import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Booking, (booking) => booking.payments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'booking_id' })
    booking: Booking;

    @Column({ name: 'booking_id' })
    bookingId: number;

    @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2 })
    amountPaid: number;

    @Column({ name: 'slip_url', nullable: true })
    slipUrl: string;

    @Column({ name: 'payment_method', nullable: true })
    paymentMethod: string;

    @CreateDateColumn({ type: 'timestamptz', name: 'uploaded_at' })
    uploadedAt: Date;
}
