import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OutputState } from '../interfaces/state.interface';

@Entity('state')
export class State {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  taxRevenueNumber!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export function serializeState(state: State): OutputState {
  const { taxRevenueNumber, createdAt, updatedAt } = state;
  return { taxRevenueNumber, createdAt, updatedAt };
}
