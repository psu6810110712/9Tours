import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async create(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @Get()
  async findByTour(
    @Query() query: ListReviewsQueryDto,
  ) {
    return this.reviewsService.findByTour(
      query.tourId,
      query.limit,
      query.offset,
    );
  }
}
