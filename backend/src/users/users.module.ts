import { Module } from '@nestjs/common';
import { UsersSeederService } from './users.seeder';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UsersSeederService],
  exports: [UsersService],
})
export class UsersModule { }
