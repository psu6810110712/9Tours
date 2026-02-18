import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TourSchedule } from './tour-schedule.entity';

export enum TourType {
  ONE_DAY = 'one_day',
  PACKAGE = 'package',
}

@Entity('tours')
export class Tour {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: TourType })
  tourType: TourType;

  @Column({ type: 'jsonb', default: [] })
  categories: string[];

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  // ราคาเดิมก่อนลด - ถ้า null แสดงว่าไม่มีส่วนลด
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  originalPrice: number | null;

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @Column({ type: 'jsonb', default: [] })
  highlights: string[];

  // กำหนดการแบบ [{time, title, description}]
  @Column({ type: 'jsonb', default: [] })
  itinerary: { time: string; title: string; description: string }[];

  @Column({ nullable: true })
  transportation: string;

  @Column()
  duration: string;

  @Column()
  region: string;

  @Column()
  province: string;

  // เฉพาะทัวร์แบบ package ที่มีที่พัก
  @Column({ type: 'varchar', nullable: true })
  accommodation: string | null;

  @Column('float', { default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  // false = ซ่อนจากรายการ (soft delete)
  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => TourSchedule, (schedule) => schedule.tour, {
    cascade: true,
  })
  schedules: TourSchedule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
