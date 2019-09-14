export interface OutputConfigurationI {
  publicKey: string;
  currencyUnits: string[];
  listAdmins: string[];
  limitLumens: string;
  isTest: boolean;
  horizonUrl: string;
  stellarTimeout: number;
  baseFeeMultiplier: number;
  enoughLumenForAssetAccount: string;
}
