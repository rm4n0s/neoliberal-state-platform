export interface InputDataAccount {
  masterKey: string;
  requester: string;
  description: string;
  name: string;
  includeLumens: string;
  nonce: string;
}

export interface InputAccount {
  data: InputDataAccount;
  stringifiedData: string;
  signature: string;
}

export class OutputAccount {
  address: string;
  masterKey: string;
  requester: string;
  description: string;
  name: string;
  createdAt: Date;
  signature: string;
  signedData: string;
}
