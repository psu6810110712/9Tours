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
  ) {}

  async create(createTourDto: CreateTourDto) {
    const newTour = this.tourRepository.create(createTourDto);
    return await this.tourRepository.save(newTour); // บันทึกลง DB
  }

  async findAll(filters?: { region?: string; province?: string; tourType?: string; search?: string }) {
    const query = this.tourRepository.createQueryBuilder('tour')
      .leftJoinAndSelect('tour.schedules', 'schedules')
      .where('tour.isActive = :isActive', { isActive: true });

    if (filters?.region) {
      query.andWhere('tour.region = :region', { region: filters.region });
    }
    if (filters?.province) {
      query.andWhere('tour.province = :province', { province: filters.province });
    }
    if (filters?.tourType) {
      query.andWhere('tour.tourType = :tourType', { tourType: filters.tourType });
    }
    if (filters?.search) {
      const searchTerm = `%${filters.search.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(tour.name) LIKE :search OR LOWER(tour.description) LIKE :search OR LOWER(tour.province) LIKE :search)',
        { search: searchTerm },
      );
    }

    query.orderBy('tour.id', 'DESC');

    return await query.getMany();
  }

  async findOne(id: number) {
    const tour = await this.tourRepository.findOne({
      where: { id },
      relations: ['schedules'],
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
    tour.isActive = false;
    return await this.tourRepository.save(tour);
  }
}