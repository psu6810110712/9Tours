import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { Tour } from '../../tours/entities/tour.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tour_views')
export class TourView {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Tour, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tour_id' })
    tour: Tour;

    @Column({ name: 'tour_id' })
    tourId: number;

    @ManyToOne(() => User, (user) => user.tourViews, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId: string | null;

    @Index('idx_tour_views_anonymous_id')
    @Column({ name: 'anonymous_id', type: 'varchar', length: 64, nullable: true })
    anonymousId: string | null;

    @CreateDateColumn({ type: 'timestamptz', name: 'viewed_at' })
    viewedAt: Date;

    @Column({ name: 'session_id', nullable: true })
    sessionId: string;

    @Column({ name: 'browser_info', nullable: true })
    browserInfo: string;
}
