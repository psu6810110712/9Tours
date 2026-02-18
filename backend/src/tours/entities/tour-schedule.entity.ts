import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tour } from './tour.entity';

@Entity('tour_schedules')
export class TourSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tour, (tour) => tour.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tourId' })
  tour: Tour;

  @Column()
  tourId: number;

  @Column('date')
  startDate: string;

  @Column('date')
  endDate: string;

  // สำหรับทริปที่มีหลายรอบต่อวัน เช่น ATV รอบเช้า/รอบบ่าย
  @Column({ type: 'varchar', nullable: true })
  timeSlot: string | null;

  @Column({ type: 'varchar', nullable: true })
  roundName: string | null;

  @Column()
  maxCapacity: number;

  @Column({ default: 0 })
  currentBooked: number;
}
