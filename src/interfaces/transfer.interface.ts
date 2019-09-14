import { AmountI } from './amount.interface';

export interface InputDataTransfer {
  requester: string;
  receiver: string;
  reason: string;
  includeLumens: string;
  amounts: AmountI[];
  source: 'printer' | 'taxes';
  nonce: string;
}

export interface InputTransfer {
  data: InputDataTransfer;
  stringifiedData: string;
  signature: string;
}

export interface OutputTransfer {
  uuid: string;
  requester: string;
  receiver: string;
  reason: string;
  signature: string;
  signedData: string;
  source: string;
  includedLumens: string;
  createdAt: Date;
  amounts: AmountI[];
}

export class InputDataTransferDto {
  readonly requester: string;
  readonly receiver: string;
  readonly reason: string;
  readonly includeLumens: string;
  readonly amounts: AmountI[];
  readonly nonce: string;
  readonly source: 'printer' | 'taxes';
}

export class InputTransferDto {
  readonly data: InputDataTransferDto;
  readonly stringifiedData: string;
  readonly signature: string;
}
