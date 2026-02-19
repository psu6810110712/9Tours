import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { TourView } from '../../analytics/entities/tour-view.entity';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ name: 'full_name', nullable: true })
    fullName: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @OneToMany(() => Booking, (booking) => booking.user)
    bookings: Booking[];

    @OneToMany(() => TourView, (view) => view.user)
    tourViews: TourView[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
