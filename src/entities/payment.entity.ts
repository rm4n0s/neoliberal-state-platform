import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';
import { OutputPayment } from '../interfaces/payment.interface';

@Entity('payments')
export class Payment {
  @PrimaryColumn()
  uuid!: string;

  @Column()
  depositHash!: string;

  @Column()
  asset!: string;

  @Column()
  amountNumber!: string;

  @Column()
  fromAccountKey!: string;

  @Column()
  accountIsPublic!: boolean;

  @Column()
  blockTrasnactionHash!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

export function serializePayment(input: Payment): OutputPayment {
  const {
    uuid,
    depositHash,
    asset,
    amountNumber,
    fromAccountKey,
    accountIsPublic,
    blockTrasnactionHash,
    createdAt,
  } = input;
  return {
    uuid,
    depositHash,
    asset,
    amountNumber,
    fromAccountKey,
    accountIsPublic,
    blockTrasnactionHash,
    createdAt,
  };
}
