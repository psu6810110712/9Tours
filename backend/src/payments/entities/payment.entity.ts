import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import type { PaymentVerificationStatus } from '../../easyslip/easyslip.service';

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

  @Column({ name: 'verification_status', type: 'varchar', length: 32, default: 'pending' })
  verificationStatus: PaymentVerificationStatus;

  @Column({ name: 'verified_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  verifiedAmount: number | null;

  @Column({ name: 'verified_trans_ref', type: 'varchar', length: 120, nullable: true })
  verifiedTransRef: string | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ name: 'verification_provider', type: 'varchar', length: 32, nullable: true })
  verificationProvider: string | null;

  @Column({ name: 'verification_message', type: 'varchar', length: 255, nullable: true })
  verificationMessage: string | null;

  @Column({ name: 'verification_raw', type: 'jsonb', nullable: true })
  verificationRaw: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'uploaded_at' })
  uploadedAt: Date;
}
