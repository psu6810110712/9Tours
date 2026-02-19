import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from 'typeorm';
import { Tour } from './tour.entity';

@Entity('tour_categories')
export class TourCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => Tour, (tour) => tour.category)
    tours: Tour[];
}
