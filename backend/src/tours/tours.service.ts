import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { Tour } from './entities/tour.entity';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,
  ) { }

  async create(createTourDto: CreateTourDto) {
    const newTour = this.tourRepository.create(createTourDto);
    return await this.tourRepository.save(newTour);
  }

  async findAll(filters?: { regionId?: number; provinceId?: number; categoryId?: number; search?: string }) {
    const query = this.tourRepository.createQueryBuilder('tour')
      .leftJoinAndSelect('tour.schedules', 'schedules')
      .leftJoinAndSelect('tour.category', 'category')
      .leftJoinAndSelect('tour.region', 'region')
      .leftJoinAndSelect('tour.province', 'province')
      .leftJoinAndSelect('tour.festival', 'festival')
      .where('tour.is_visible = :isVisible', { isVisible: true });

    if (filters?.regionId) {
      query.andWhere('tour.region_id = :regionId', { regionId: filters.regionId });
    }
    if (filters?.provinceId) {
      query.andWhere('tour.province_id = :provinceId', { provinceId: filters.provinceId });
    }
    if (filters?.categoryId) {
      query.andWhere('tour.category_id = :categoryId', { categoryId: filters.categoryId });
    }
    if (filters?.search) {
      const searchTerm = `%${filters.search.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(tour.title) LIKE :search OR LOWER(tour.description) LIKE :search)',
        { search: searchTerm },
      );
    }

    query.orderBy('tour.id', 'DESC');

    return await query.getMany();
  }

  async findOne(id: number) {
    const tour = await this.tourRepository.findOne({
      where: { id },
      relations: ['schedules', 'category', 'region', 'province', 'festival'],
    });

    if (!tour) throw new NotFoundException(`ไม่พบทัวร์รหัส ${id}`);
    return tour;
  }

  async update(id: number, updateTourDto: UpdateTourDto) {
    const tour = await this.findOne(id);
    this.tourRepository.merge(tour, updateTourDto);
    return await this.tourRepository.save(tour);
  }

  async remove(id: number) {
    const tour = await this.findOne(id);
    tour.isVisible = false;
    return await this.tourRepository.save(tour);
  }
}