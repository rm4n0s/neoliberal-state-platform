export interface StellarPayment {
  from: string;
  to: string;
  asset_code: string;
  asset_issuer: string;
  amount: string;
  hash: string;
  transaction_hash: string;
}

export interface InputPayment {
  depositHash: string;
  asset: string;
  amountNumber: string;
  fromAccountKey: string;
  accountIsPublic: boolean;
  blockTrasnactionHash: string;
}

export interface OutputPayment {
  uuid: string;
  depositHash: string;
  asset: string;
  amountNumber: string;
  fromAccountKey: string;
  accountIsPublic: boolean;
  blockTrasnactionHash: string;
  createdAt: Date;
}
