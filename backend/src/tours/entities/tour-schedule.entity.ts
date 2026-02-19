import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Tour } from './tour.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('tour_schedules')
export class TourSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tour, (tour) => tour.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tour_id' })
  tour: Tour;

  @Column({ name: 'tour_id' })
  tourId: number;

  @Column({ name: 'travel_date', type: 'date' })
  travelDate: string;

  @Column({ name: 'total_capacity' })
  totalCapacity: number;

  @Column({ name: 'available_seats' })
  availableSeats: number;

  @OneToMany(() => Booking, (booking) => booking.schedule)
  bookings: Booking[];
}
