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

export class InputDataAccountDto {
  readonly masterKey: string;
  readonly requester: string;
  readonly description: string;
  readonly name: string;
  readonly includeLumens: string;
  readonly nonce: string;
}

export class InputAccountDto {
  readonly data: InputDataAccountDto;
  readonly stringifiedData: string;
  readonly signature: string;
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
