import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Withdraw, serializeWithdraw } from './withdraw.entity';
import { OutputDeposit } from '../interfaces/deposit.interface';
import { OutputWithdraw } from '../interfaces/withdraw.interface';

@Entity('deposits')
export class Deposit {
  @PrimaryColumn()
  hash!: string;

  @Column()
  untaxedNumber!: string;

  @Column()
  taxedNumber!: string;

  @Column()
  totalNumber!: string;

  @OneToMany(type => Withdraw, withdraw => withdraw.deposit)
  withdraws!: Withdraw[];

  @CreateDateColumn()
  createdAt!: Date;
}

export function serializeDeposit(input: Deposit): OutputDeposit {
  const {
    hash,
    untaxedNumber,
    taxedNumber,
    totalNumber,
    createdAt,
    withdraws,
  } = input;
  const ows: OutputWithdraw[] = [];
  if (withdraws) {
    for (const withdraw of withdraws) {
      ows.push(serializeWithdraw(withdraw));
    }
  }
  return {
    hash,
    untaxedNumber,
    taxedNumber,
    totalNumber,
    createdAt,
    withdraws: ows,
  };
}
