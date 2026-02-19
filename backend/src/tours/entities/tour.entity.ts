import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TourCategory } from './tour-category.entity';
import { TourSchedule } from './tour-schedule.entity';
import { Region } from '../../regions/entities/region.entity';
import { Province } from '../../regions/entities/province.entity';
import { Festival } from '../../festivals/entities/festival.entity';

@Entity('tours')
export class Tour {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tour_code', unique: true, nullable: true })
  tourCode: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'price_per_person', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerPerson: number;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;

  // --- Relations ---

  @ManyToOne(() => TourCategory, (category) => category.tours, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: TourCategory;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @ManyToOne(() => Region, (region) => region.tours, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @Column({ name: 'region_id', nullable: true })
  regionId: number;

  @ManyToOne(() => Province, (province) => province.tours, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'province_id' })
  province: Province;

  @Column({ name: 'province_id', nullable: true })
  provinceId: number;

  @ManyToOne(() => Festival, (festival) => festival.tours, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'festival_id' })
  festival: Festival;

  @Column({ name: 'festival_id', nullable: true })
  festivalId: number;

  @OneToMany(() => TourSchedule, (schedule) => schedule.tour, { cascade: true })
  schedules: TourSchedule[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
