export interface InputDataTax {
  requester: string;
  taxNumber: string;
  nonce: string;
}

export interface InputTax {
  data: InputDataTax;
  stringifiedData: string;
  signature: string;
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
