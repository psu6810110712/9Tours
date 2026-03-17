import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tour } from '../tours/entities/tour.entity';
import { CreateFestivalDto } from './dto/create-festival.dto';
import { UpdateFestivalDto } from './dto/update-festival.dto';
import { Festival } from './entities/festival.entity';

@Injectable()
export class FestivalsService {
  constructor(
    @InjectRepository(Festival)
    private readonly festivalsRepository: Repository<Festival>,
    @InjectRepository(Tour)
    private readonly toursRepository: Repository<Tour>,
  ) {}

  findAll() {
    return this.festivalsRepository.find({ order: { startDate: 'ASC' } });
  }

  findOne(id: number) {
    return this.festivalsRepository.findOne({ where: { id } });
  }

  async create(dto: CreateFestivalDto) {
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException('วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่มต้น');
    }
    const festival = this.festivalsRepository.create(dto);
    return this.festivalsRepository.save(festival);
  }

  async update(id: number, dto: UpdateFestivalDto) {
    const festival = await this.festivalsRepository.findOne({ where: { id } });
    if (!festival) {
      throw new NotFoundException('ไม่พบเทศกาลที่ต้องการแก้ไข');
    }
    const newStart = dto.startDate ?? festival.startDate;
    const newEnd = dto.endDate ?? festival.endDate;
    if (newEnd < newStart) {
      throw new BadRequestException('วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่มต้น');
    }
    Object.assign(festival, dto);
    return this.festivalsRepository.save(festival);
  }

  async remove(id: number) {
    const festival = await this.festivalsRepository.findOne({ where: { id } });
    if (!festival) {
      throw new NotFoundException('ไม่พบเทศกาลที่ต้องการลบ');
    }
    const tourCount = await this.toursRepository.count({
      where: { festival: { id } },
    });
    if (tourCount > 0) {
      throw new BadRequestException(
        `ไม่สามารถลบเทศกาลนี้ได้ เพราะมีทัวร์ ${tourCount} รายการที่ผูกอยู่ กรุณาเปลี่ยนเทศกาลของทัวร์เหล่านั้นก่อน`,
      );
    }
    await this.festivalsRepository.delete(id);
    return { id, deleted: true };
  }
}
