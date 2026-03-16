import { Module } from '@nestjs/common';
import { EasySlipService } from './easyslip.service';

@Module({
  providers: [EasySlipService],
  exports: [EasySlipService],
})
export class EasySlipModule {}
