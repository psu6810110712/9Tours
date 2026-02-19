import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
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

    @Column({ name: 'user_id', nullable: true })
    userId: number;

    @CreateDateColumn({ name: 'viewed_at' })
    viewedAt: Date;

    @Column({ name: 'session_id', nullable: true })
    sessionId: string;

    @Column({ name: 'browser_info', nullable: true })
    browserInfo: string;
}
