import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { Transfer } from './transfer.entity';

@Entity('amounts')
export class Amount {
  @PrimaryColumn()
  uuid!: string;

  @Column()
  assetName!: string;

  @Column()
  amountNumber!: string;

  @ManyToOne(type => Transfer, transfer => transfer.amounts)
  transfer!: Transfer;
}
