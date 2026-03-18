import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StorageService } from '../common/storage.interface';
import { UserRole } from '../users/entities/user.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { ToursService } from './tours.service';

const MAX_TOUR_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@Controller('tours')
export class ToursController {
  constructor(
    private readonly toursService: ToursService,
    private readonly storageService: StorageService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: 'memory' as any,
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = /\/(jpg|jpeg|png|gif|webp)$/;
        if (!file.mimetype.match(allowedMimeTypes)) {
          return cb(new BadRequestException('Please upload only image files (JPG, PNG, GIF, WebP)'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: MAX_TOUR_IMAGE_SIZE_BYTES,
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    const uploadResult = await this.storageService.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      folder: '', // Store in root uploads folder
    });

    return {
      url: uploadResult.publicUrl,
    };
  }

  @Post()
  create(@Body() createTourDto: CreateTourDto) {
    return this.toursService.create(createTourDto);
  }

  @Get()
  findAll(@Query() query: Record<string, unknown>) {
    return this.toursService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommendations')
  getRecommendations(
    @Req() req: { user?: { id?: string } },
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.id;
    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 8;
    return this.toursService.getRecommendationsForUser(userId || '', safeLimit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/overview')
  getAdminOverview() {
    return this.toursService.getAdminOverview();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toursService.findOne(+id);
  }

  @Get(':tourId/schedule/:scheduleId/available-seats')
  getAvailableSeats(
    @Param('tourId') tourId: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    try {
      return this.toursService.getAvailableSeats(+tourId, +scheduleId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTourDto: UpdateTourDto) {
    return this.toursService.update(+id, updateTourDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toursService.remove(+id);
  }
}
