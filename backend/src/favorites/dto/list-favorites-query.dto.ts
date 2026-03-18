import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsOptional, Min, Max } from 'class-validator'
import type { FavoriteSort } from '../favorites.service'

export class ListFavoritesQueryDto {
  @IsOptional()
  @IsIn(['default', 'price_asc', 'price_desc', 'rating'])
  sortBy?: FavoriteSort

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  offset?: number
}
