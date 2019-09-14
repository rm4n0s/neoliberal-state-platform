import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
import { OutputAccount } from '../interfaces/account.interface';

@Entity('accounts')
export class Account {
  @PrimaryColumn()
  address!: string;

  @Column()
  masterKey!: string;

  @Column()
  requester!: string;

  @Column()
  description!: string;

  @Column()
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  signature!: string;

  @Column({ type: 'text' })
  signedData!: string;
}

export function serializeAccount(acc: Account): OutputAccount {
  const {
    address,
    masterKey,
    requester,
    description,
    name,
    createdAt,
    signature,
    signedData,
  } = acc;
  const output: OutputAccount = {
    address,
    masterKey,
    requester,
    description,
    name,
    createdAt,
    signature,
    signedData,
  };
  return output;
}
