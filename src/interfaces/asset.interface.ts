export interface InputAsset {
  amountNumber: string;
  assetName: string;
  masterKey: string;
}

export interface ToSaveAsset {
  amountNumber: string;
  assetName: string;
  masterKey: string;
  address: string;
  addressSecret: string;
}

export interface OutputAsset {
  amountNumber: string;
  assetName: string;
  masterKey: string;
  address: string;
}
