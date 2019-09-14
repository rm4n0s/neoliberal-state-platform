import { InputAsset, PrivateAsset, OutputAsset } from './asset.interface';

export interface Withdraw {
  depositHash: string;
  assets: PrivateAsset[];
  amountNumber: string;
  totalNumber: string;
}

export interface InputWithdraw {
  assets: InputAsset[];
  depositHash: string;
  password: string;
}

export interface OutputWithdraw {
  uuid: string;
  depositHash: string;
  amountNumber: string;
  taxReceivedNumber: string;
  assets: OutputAsset[];
  totalNumber: string;
  createdAt: Date;
}
