import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

@Entity('dashboard_stats_daily')
export class DashboardStatsDaily {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date' })
    date: string;

    @Column({ name: 'total_views', default: 0 })
    totalViews: number;

    @Column({ name: 'total_bookings', default: 0 })
    totalBookings: number;

    @Column({ name: 'total_revenue', type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalRevenue: number;

    @Column({ name: 'new_users_count', default: 0 })
    newUsersCount: number;
}
