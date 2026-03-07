import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('behavior_events')
@Index('idx_behavior_events_occurred_at', ['occurredAt'])
@Index('idx_behavior_events_event_type_path', ['eventType', 'pagePath'])
@Index('idx_behavior_events_user_id', ['userId'])
@Index('idx_behavior_events_session_id', ['sessionId'])
@Index('idx_behavior_events_tour_id', ['tourId'])
export class BehaviorEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_type', type: 'varchar', length: 64 })
  eventType: string;

  @Column({ name: 'page_path', type: 'varchar', length: 255 })
  pagePath: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'session_id', type: 'varchar', length: 64 })
  sessionId: string;

  @Column({ name: 'tour_id', type: 'int', nullable: true })
  tourId: number | null;

  @Column({ name: 'element_id', type: 'varchar', length: 120, nullable: true })
  elementId: string | null;

  @Column({ name: 'dwell_ms', type: 'int', nullable: true })
  dwellMs: number | null;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'ip_hash', type: 'varchar', length: 64, nullable: true })
  ipHash: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
