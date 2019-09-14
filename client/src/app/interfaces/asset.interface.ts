export interface InputAsset {
  amountNumber: string;
  assetName: string;
  masterKey: string;
}

export interface PrivateAsset {
  amountNumber: string;
  assetName: string;
  masterPublicKey: string;
  masterSecret: string;
  address: string;
}

export interface OutputAsset {
  amountNumber: string;
  assetName: string;
  masterKey: string;
  address: string;
}
