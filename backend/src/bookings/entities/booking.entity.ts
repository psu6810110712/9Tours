import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum BookingStatus {
    PENDING_PAYMENT = 'pending_payment',
    AWAITING_APPROVAL = 'awaiting_approval',
    CONFIRMED = 'confirmed',
    SUCCESS = 'success',
    CANCELED = 'canceled',
    REFUND_PENDING = 'refund_pending',
    REFUND_COMPLETED = 'refund_completed',
}

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id', nullable: true })
    userId: number;

    // scheduleId เก็บเป็นตัวเลขอ้างอิง — ข้อมูล schedule จริงอ่านจาก tours-data.json
    @Column({ name: 'schedule_id', nullable: true })
    scheduleId: number;

    @Column({ name: 'pax_count', nullable: true })
    paxCount: number;

    @Column({ name: 'adults', default: 1 })
    adults: number;

    @Column({ name: 'children', default: 0 })
    children: number;

    @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
    totalPrice: number;

    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.PENDING_PAYMENT,
        nullable: true,
    })
    status: BookingStatus;

    @Column({ name: 'admin_notes', type: 'text', nullable: true })
    adminNotes: string;

    @OneToMany(() => Payment, (payment) => payment.booking)
    payments: Payment[];

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;
}

