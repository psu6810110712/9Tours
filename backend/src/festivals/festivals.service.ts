import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Festival } from './entities/festival.entity';

@Injectable()
export class FestivalsService {
  constructor(
    @InjectRepository(Festival)
    private readonly festivalsRepository: Repository<Festival>,
  ) {}

  findAll() {
    return this.festivalsRepository.find({ order: { startDate: 'ASC' } });
  }

  findOne(id: number) {
    return this.festivalsRepository.findOne({ where: { id } });
  }
}
