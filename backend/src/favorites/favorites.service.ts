import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { FavoriteTour } from './entities/favorite-tour.entity'
import { Tour } from '../tours/entities/tour.entity'

export type FavoriteSort = 'default' | 'price_asc' | 'price_desc' | 'rating'

export interface ListFavoritesOptions {
  sortBy?: FavoriteSort
  limit?: number
  offset?: number
}

@Injectable()
export class FavoritesService {
  private static readonly MAX_PAGE_SIZE = 50
  private static readonly DEFAULT_LIMIT = 20

  constructor(
    @InjectRepository(FavoriteTour)
    private readonly favoriteRepo: Repository<FavoriteTour>,
    @InjectRepository(Tour)
    private readonly tourRepo: Repository<Tour>,
  ) {}

  async listFavorites(userId: string, options: ListFavoritesOptions = {}) {
    const sortBy = options.sortBy ?? 'default'
    const limit = this.safeLimit(options.limit)
    const offset = Math.max(0, options.offset ?? 0)

    const qb = this.favoriteRepo
      .createQueryBuilder('favorite')
      .innerJoinAndSelect('favorite.tour', 'tour')
      .where('favorite.userId = :userId', { userId })

    if (sortBy === 'price_asc') {
      qb.orderBy('tour.price', 'ASC', 'NULLS LAST')
    } else if (sortBy === 'price_desc') {
      qb.orderBy('tour.price', 'DESC', 'NULLS LAST')
    } else if (sortBy === 'rating') {
      qb.orderBy('tour.rating', 'DESC', 'NULLS LAST')
    } else {
      qb.orderBy('favorite.createdAt', 'DESC')
    }

    qb.take(limit).skip(offset)

    const [items, total] = await qb.getManyAndCount()

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    }
  }

  async addFavorite(userId: string, tourId: number) {
    const tour = await this.tourRepo.findOne({ where: { id: tourId } })
    if (!tour) {
      throw new NotFoundException('ไม่พบทัวร์ที่ต้องการเพิ่มในรายการถูกใจ')
    }
    if (!tour.isActive) {
      throw new BadRequestException('ทัวร์นี้ปิดให้บริการชั่วคราว ไม่สามารถเพิ่มในรายการถูกใจได้')
    }

    const existing = await this.favoriteRepo.findOne({ where: { userId, tourId } })
    if (existing) {
      throw new ConflictException('ทัวร์นี้ถูกเพิ่มในรายการถูกใจแล้ว')
    }

    const favorite = this.favoriteRepo.create({ userId, tourId })
    return this.favoriteRepo.save(favorite)
  }

  async removeFavorite(userId: string, tourId: number) {
    const favorite = await this.favoriteRepo.findOne({ where: { userId, tourId } })
    if (!favorite) {
      throw new NotFoundException('ไม่พบรายการถูกใจที่จะลบ')
    }

    await this.favoriteRepo.remove(favorite)
    return { removed: true }
  }

  private safeLimit(limit?: number) {
    if (!limit || !Number.isFinite(limit)) {
      return FavoritesService.DEFAULT_LIMIT
    }
    return Math.max(1, Math.min(limit, FavoritesService.MAX_PAGE_SIZE))
  }
}
