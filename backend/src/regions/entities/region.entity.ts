import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from 'typeorm';
import { Province } from './province.entity';
import { Tour } from '../../tours/entities/tour.entity';

@Entity('regions')
export class Region {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => Province, (province) => province.region)
    provinces: Province[];

    @OneToMany(() => Tour, (tour) => tour.region)
    tours: Tour[];
}
