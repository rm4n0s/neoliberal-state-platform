export interface InputTaxData {
  requester: string;
  taxNumber: string;
  nonce: string;
}

export interface InputTax {
  data: InputTaxData;
  signature: string;
  stringifiedData: string;
}

export interface OutputTax {
  uuid: string;
  requester: string;
  taxNumber: string;
  taxRevenueNumber: string;
  signature: string;
  stringifiedData: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InputDataTaxDto {
  readonly requester: string;
  readonly taxNumber: string;
  readonly nonce: string;
}

export class InputTaxDto {
  readonly data: InputDataTaxDto;
  readonly stringifiedData: string;
  readonly signature: string;
}
