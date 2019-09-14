import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OutputTax } from '../interfaces/tax.interface';

@Entity('taxes')
export class Tax {
  @PrimaryColumn()
  uuid!: string;

  @Column()
  requester!: string;

  @Column()
  taxNumber!: string;

  @Column()
  signature!: string;

  @Column({ type: 'text' })
  stringifiedData!: string;

  @Column()
  taxRevenueNumber!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export function serializeTax(tax: Tax): OutputTax {
  const {
    uuid,
    requester,
    taxNumber,
    signature,
    stringifiedData,
    taxRevenueNumber,
    createdAt,
    updatedAt,
  } = tax;
  return {
    uuid,
    requester,
    taxNumber,
    signature,
    stringifiedData,
    taxRevenueNumber,
    createdAt,
    updatedAt,
  };
}
