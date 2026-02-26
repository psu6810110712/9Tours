import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  // 1. นำเข้า TypeOrmModule พร้อมระบุ Entity ที่จะใช้
  imports: [TypeOrmModule.forFeature([User])], 
  controllers: [UsersController],
  providers: [UsersService],
  // 2. Export UsersService ออกไป เพื่อให้ AuthModule เรียกใช้งานได้!
  exports: [UsersService], 
})
export class UsersModule {}