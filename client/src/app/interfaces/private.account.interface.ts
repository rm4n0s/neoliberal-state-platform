import { AmountI } from './amount.interface';

export interface PrivateAccount {
  address: string;
  masterSecret: string;
  amounts: AmountI[];
}
