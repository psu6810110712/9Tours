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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  buildPublicUploadUrl,
  buildStoredUploadPath,
  ensureDirectoryExistsSync,
  getTourUploadDirectory,
} from '../common/upload-paths';
import { UserRole } from '../users/entities/user.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { ToursService } from './tours.service';

@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, ensureDirectoryExistsSync(getTourUploadDirectory()));
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `tour-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    const storedPath = buildStoredUploadPath(file.filename);
    return {
      url: buildPublicUploadUrl(storedPath),
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
