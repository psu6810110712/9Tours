import { Controller, Get } from '@nestjs/common';
import { FestivalsService } from './festivals.service';

@Controller('festivals')
export class FestivalsController {
  constructor(private readonly festivalsService: FestivalsService) {}

  @Get()
  findAll() {
    return this.festivalsService.findAll();
  }
}
