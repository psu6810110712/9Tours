import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Festival } from '../../festivals/entities/festival.entity';
import { TourCategory } from './tour-category.entity';
import { TourSchedule } from './tour-schedule.entity';

export enum TourType {
  ONE_DAY = 'one_day',
  PACKAGE = 'package',
}

@Entity('tours')
export class Tour {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  tourCode: string;

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

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  childPrice: number | null;

  @Column('int', { nullable: true })
  minPeople: number | null;

  @Column('int', { nullable: true })
  maxPeople: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  originalPrice: number | null;

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @Column({ type: 'jsonb', default: [] })
  highlights: string[];

  @Column({ type: 'jsonb', default: [] })
  itinerary: { time: string; title: string; description: string; day?: number }[];

  @Column({ nullable: true })
  transportation: string;

  @Column()
  duration: string;

  @Column()
  region: string;

  @Column()
  province: string;

  @Column({ type: 'varchar', nullable: true })
  accommodation: string | null;

  @Column('float', { default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ type: 'date', nullable: true })
  discountStartDate: string | null;

  @Column({ type: 'date', nullable: true })
  discountEndDate: string | null;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => TourCategory, (cat) => cat.tours, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: TourCategory;

  @ManyToOne(() => Festival, (fest) => fest.tours, { nullable: true })
  @JoinColumn({ name: 'festival_id' })
  festival: Festival;

  @OneToMany(() => TourSchedule, (schedule) => schedule.tour, { cascade: true })
  schedules: TourSchedule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
