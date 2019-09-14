import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Amount } from './amount.entity';
import { OutputTransfer } from '../interfaces/transfer.interface';
import { AmountI } from '../interfaces/amount.interface';

@Entity('transfers')
export class Transfer {
  @PrimaryColumn()
  uuid!: string;

  @Column()
  requester!: string;

  @Column()
  receiver!: string;

  @Column()
  reason!: string;

  @Column()
  signature!: string;

  @Column()
  source!: string;

  @Column({ type: 'text' })
  signedData!: string;

  @Column()
  includedLumens!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(type => Amount, amount => amount.transfer)
  amounts!: Amount[];
}

export function serializeTransfer(tr: Transfer): OutputTransfer {
  const {
    uuid,
    requester,
    receiver,
    createdAt,
    signature,
    signedData,
    reason,
    source,
    includedLumens,
  } = tr;
  const amounts: AmountI[] = [];
  if (tr.amounts) {
    for (const am of tr.amounts) {
      const { assetName, amountNumber } = am;
      amounts.push({ assetName, amountNumber });
    }
  }
  const out: OutputTransfer = {
    uuid,
    requester,
    receiver,
    createdAt,
    signature,
    source,
    signedData,
    amounts,
    reason,
    includedLumens,
  };
  return out;
}
