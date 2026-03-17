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
    REFUND_REJECTED = 'refund_rejected',
}

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId: string;

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

    @Column({ name: 'contact_prefix', type: 'varchar', length: 16, nullable: true })
    contactPrefix: string | null;

    @Column({ name: 'contact_name', type: 'varchar', length: 160, nullable: true })
    contactName: string | null;

    @Column({ name: 'contact_email', type: 'varchar', length: 160, nullable: true })
    contactEmail: string | null;

    @Column({ name: 'contact_phone', type: 'varchar', length: 32, nullable: true })
    contactPhone: string | null;

    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.PENDING_PAYMENT,
        nullable: true,
    })
    status: BookingStatus;

    @Column({ name: 'admin_notes', type: 'text', nullable: true })
    adminNotes: string;

    @Column({ name: 'reviewed_by_user_id', type: 'uuid', nullable: true })
    reviewedByUserId: string | null;

    @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
    reviewedAt: Date | null;

    @Column({ name: 'special_request', type: 'text', nullable: true })
    specialRequest: string;

    @Column({ name: 'cancellation_reason', type: 'text', nullable: true, default: null })
    cancellationReason: string | null;

    @Column({ name: 'is_refund_requested', type: 'boolean', default: false })
    isRefundRequested: boolean;

    @Column({ name: 'travelers_info', type: 'jsonb', nullable: true, default: null })
    travelersInfo: { name: string; isLeadTraveler?: boolean }[] | null;

    @OneToMany(() => Payment, (payment) => payment.booking)
    payments: Payment[];

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;
}
