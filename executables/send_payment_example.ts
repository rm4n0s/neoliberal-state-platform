import * as crypto from 'crypto';
import { stellarPayment } from '../src/test-utils/payment';

const shasum = crypto
  .createHash('sha256')
  .update('malakies')
  .digest('hex');
const amounts = [{ currencyUnit: '1', amountNumber: '1' }];

stellarPayment(
  'GAB6NQRXMZZDGCN7OQKENQY2EEX6YHKXFXQCDJXUL2QFOXWEK7DFCEJX',
  'SABA3OBHX4ISZKE66CFUZT2LU32WA264BD4ZMMGAK2TFHCTYUMDMTVVJ',
  'GARHNBZDXJBRRUYS6UO3A7FHTY4OG3VFGGRH4455Q54PULH3AYWJ2U3B',
  amounts,
  shasum,
);
