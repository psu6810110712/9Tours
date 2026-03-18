import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Tour } from '../../tours/entities/tour.entity'

@Index(['userId', 'tourId'], { unique: true })
@Index(['userId', 'createdAt'])
@Index(['tourId'])
@Entity('favorite_tours')
export class FavoriteTour {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => User, (user) => user.favoriteTours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @ManyToOne(() => Tour, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'tour_id' })
  tour: Tour

  @Column({ name: 'tour_id', type: 'int' })
  tourId: number

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
