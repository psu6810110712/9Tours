import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from 'typeorm';
import { Tour } from '../../tours/entities/tour.entity';

@Entity('festivals')
export class Festival {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ name: 'start_date', type: 'date' })
    startDate: string;

    @Column({ name: 'end_date', type: 'date' })
    endDate: string;

    @OneToMany(() => Tour, (tour) => tour.festival)
    tours: Tour[];
}
