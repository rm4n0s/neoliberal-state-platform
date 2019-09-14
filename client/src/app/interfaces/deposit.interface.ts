import { OutputWithdraw } from './withdraw.interface';

export interface Deposit {
  password: string;
  hash: string;
  untaxedNumber: string;
  taxedNumber: string;
  totalNumber: string;
  withdraws: OutputWithdraw[];
}

export interface InputDepositInfo {
  hash: string;
  password: string;
}

export interface OutputDeposit {
  hash: string;
  untaxedNumber: string;
  taxedNumber: string;
  totalNumber: string;
  withdraws: OutputWithdraw[];
  createdAt: Date;
}
