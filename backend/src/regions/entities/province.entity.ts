import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Region } from './region.entity';
import { Tour } from '../../tours/entities/tour.entity';

@Entity('provinces')
export class Province {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Region, (region) => region.provinces, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'region_id' })
    region: Region;

    @Column({ name: 'region_id' })
    regionId: number;

    @Column()
    name: string;

    @Column({ name: 'iso_code', nullable: true })
    isoCode: string;

    @OneToMany(() => Tour, (tour) => tour.province)
    tours: Tour[];
}
