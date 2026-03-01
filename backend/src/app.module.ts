import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursModule } from './tours/tours.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    // 1. ตั้งค่าให้ NestJS อ่านไฟล์ .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. ตั้งค่าการเชื่อมต่อ Database โดยดึงค่าจาก ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // เฉพาะตอน Dev เท่านั้น: จะสร้าง Table ให้เราอัตโนมัติ
      }),
    }),

    ToursModule,
    UsersModule,
    AuthModule,
    BookingsModule,
    PaymentsModule,
    AnalyticsModule,
  ],
})
export class AppModule { }