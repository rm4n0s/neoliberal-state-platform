import { AmountI } from './amount.interface';

export interface InputDataTransfer {
  requester: string;
  receiver: string;
  reason: string;
  includeLumens: string;
  amounts: AmountI[];
  nonce: string;
  source: 'printer' | 'taxes';
}

export interface InputTransfer {
  data: InputDataTransfer;
  stringifiedData: string;
  signature: string;
}

export interface OutputTransfer {
  id: number;
  requester: string;
  receiver: string;
  reason: string;
  signature: string;
  source: string;
  signedData: string;
  includedLumens: string;
  createdAt: Date;
  amounts: AmountI[];
}
