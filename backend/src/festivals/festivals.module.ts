import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tour } from '../tours/entities/tour.entity';
import { Festival } from './entities/festival.entity';
import { FestivalsController } from './festivals.controller';
import { FestivalsService } from './festivals.service';

@Module({
  imports: [TypeOrmModule.forFeature([Festival, Tour])],
  controllers: [FestivalsController],
  providers: [FestivalsService],
  exports: [FestivalsService],
})
export class FestivalsModule {}
