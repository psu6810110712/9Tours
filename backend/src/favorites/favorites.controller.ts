import { Controller, Get, Post, Delete, Param, Query, UseGuards, Req } from '@nestjs/common'
import type { Request } from 'express'
import { FavoritesService } from './favorites.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../users/entities/user.entity'
import { ListFavoritesQueryDto } from './dto/list-favorites-query.dto'

@Controller('favorites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @Roles(UserRole.CUSTOMER)
  async listFavorites(
    @Req() req: Request & { user: { id: string } },
    @Query() query: ListFavoritesQueryDto,
  ) {
    return this.favoritesService.listFavorites(req.user.id, {
      sortBy: query.sortBy,
      limit: query.limit,
      offset: query.offset,
    })
  }

  @Post(':tourId')
  @Roles(UserRole.CUSTOMER)
  async addFavorite(@Req() req: Request & { user: { id: string } }, @Param('tourId') tourId: string) {
    return this.favoritesService.addFavorite(req.user.id, Number(tourId))
  }

  @Delete(':tourId')
  @Roles(UserRole.CUSTOMER)
  async removeFavorite(@Req() req: Request & { user: { id: string } }, @Param('tourId') tourId: string) {
    return this.favoritesService.removeFavorite(req.user.id, Number(tourId))
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/health/summary')
  async adminHealthCheck() {
    // allow admin to probe if service works without exposing user data
    return { status: 'ok' }
  }
}
