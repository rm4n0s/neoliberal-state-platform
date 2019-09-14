import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Deposit } from './deposit.entity';
import { OutputWithdraw } from '../interfaces/withdraw.interface';
import { json } from 'body-parser';

@Entity('withdraws')
export class Withdraw {
  @PrimaryColumn()
  uuid!: string;

  @Column()
  depositHash!: string;

  @Column()
  amountNumber!: string;

  @Column()
  taxReceivedNumber!: string;

  @Column({ type: 'longtext' })
  assetsJSON!: string;

  @Column()
  totalNumber!: string;

  @ManyToOne(type => Deposit, deposit => deposit.withdraws)
  deposit!: Deposit;

  @CreateDateColumn()
  createdAt!: Date;
}

export function serializeWithdraw(input: Withdraw): OutputWithdraw {
  const {
    uuid,
    depositHash,
    amountNumber,
    taxReceivedNumber,
    assetsJSON,
    totalNumber,
    createdAt,
  } = input;
  return {
    uuid,
    depositHash,
    amountNumber,
    taxReceivedNumber,
    assets: JSON.parse(assetsJSON),
    totalNumber,
    createdAt,
  };
}
