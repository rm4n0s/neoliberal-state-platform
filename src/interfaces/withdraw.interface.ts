import { InputAsset, OutputAsset, ToSaveAsset } from './asset.interface';

export interface InputWithdraw {
  assets: InputAsset[];
  depositHash: string;
  password: string;
}

export interface ToSaveWithdraw {
  assets: ToSaveAsset[];
  depositHash: string;
  password: string;
}

export class InputWithdrawDto {
  readonly assets: InputAsset[];
  readonly depositHash: string;
  readonly password: string;
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
