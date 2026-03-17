import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FavoriteTour } from './entities/favorite-tour.entity'
import { FavoritesService } from './favorites.service'
import { FavoritesController } from './favorites.controller'
import { Tour } from '../tours/entities/tour.entity'

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteTour, Tour])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
