import { OutputWithdraw } from './withdraw.interface';

export interface InputDeposit {
  hash: string;
}

export interface OutputDeposit {
  hash: string;
  untaxedNumber: string;
  taxedNumber: string;
  totalNumber: string;
  withdraws: OutputWithdraw[];
  createdAt: Date;
}

export interface InputDepositInfo {
  hash: string;
  password: string;
}
export class InputDepositInfoDto {
  hash: string;
  password: string;
}
