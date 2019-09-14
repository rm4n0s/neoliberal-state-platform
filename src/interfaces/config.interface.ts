export interface SqliteOptions {
  type: 'sqlite';
  database: string;
}

export interface PgOptions {
  type: 'postgres' | 'mysql';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface ConfigurationI {
  publicKey: string;
  privateKey: string;
  currencyUnits: string[];
  listAdmins: string[];
  limitLumens: string;
  isTest: boolean;
  dbOptions: SqliteOptions | PgOptions;
  horizonUrl: string;
  stellarTimeout: number;
  port: number;
  baseFeeMultiplier: number;
  enoughLumenForAssetAccount: string;
}

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
