import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ToursService } from './tours.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';

@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) { }

  @Post()
  create(@Body() createTourDto: CreateTourDto) {
    return this.toursService.create(createTourDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('ไม่มีไฟล์อัปโหลด');
    return { url: `http://localhost:3000/uploads/${file.filename}` };
  }

  @Get()
  findAll(@Query() query: any) {
    // query จะมีค่า region / province / tourType / search ตามที่ frontend ส่งมา
    return this.toursService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toursService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTourDto: UpdateTourDto) {
    return this.toursService.update(+id, updateTourDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toursService.remove(+id);
  }
}
