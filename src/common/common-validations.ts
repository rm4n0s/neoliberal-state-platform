import * as StellarSdk from 'stellar-sdk';
import * as crypto from 'crypto';
import { isEqual } from 'lodash';
import {
  ERROR_SIGNATURE_IS_EMPTY,
  ERROR_REQUESTER_IS_EMPTY,
  ERROR_RECEIVER_IS_EMPTY,
  ERROR_REASON_IS_EMPTY,
  ERROR_NONCE_IS_EMPTY,
  ERROR_AMOUNT_IS_EMPTY,
  ERROR_SIGNATURE_DOES_NOT_VERIFY,
  ERROR_STRINGIFIED_DATA_IS_EMPTY,
  ERROR_STRINGIFIED_DATA_IS_NOT_EQUAL_TO_DATA,
  ERROR_REQUESTER_NOT_IN_ADMINS,
  ERROR_ASSET_NAME_DOES_NOT_EXISTS,
  ERROR_AMOUNT_CAN_NOT_BE_EQUAL_OR_LESS_THAN_ZERO,
  ERROR_INCLUDED_LUMENS_ARE_OVER_THE_LIMIT,
  ERROR_NAME_IS_EMPTY,
  ERROR_MASTER_KEY_IS_EMPTY,
  ERROR_THE_SIGNATURE_ALREADY_EXISTS,
  ERROR_THE_PASSWORD_IS_NOT_CORRECT,
  ERROR_MASTER_KEY_IS_NOT_CORRECT_LENGTH,
  ERROR_DEPOSIT_HASH_IS_EMPTY,
} from './errors';

import BigNumber from 'bignumber.js';
import { AmountI } from 'src/interfaces/amount.interface';
import { InputAsset } from '../interfaces/asset.interface';

/**
 *
 * @param input
 * @throws {ERROR_NAME_IS_EMPTY}
 */
export function validateEmptyName(input: { data: { name: string } }) {
  if (input.data.name.length === 0) {
    throw ERROR_NAME_IS_EMPTY;
  }
}

/**
 *
 * @param input
 * @throws {ERROR_MASTER_KEY_IS_EMPTY}
 */
export function validateEmptyMasterKey(input: { data: { masterKey: string } }) {
  if (input.data.masterKey.length === 0) {
    throw ERROR_MASTER_KEY_IS_EMPTY;
  }
}

/**
 *
 * @param input
 * @throws {ERROR_SIGNATURE_IS_EMPTY}
 */
export function validateEmptySignature(input: { signature: string }) {
  if (input.signature.length === 0) {
    throw ERROR_SIGNATURE_IS_EMPTY;
  }
}

/**
 *
 * @param input
 * @throws {ERROR_REQUESTER_IS_EMPTY}
 */
export function validateEmptyRequester(input: { data: { requester: string } }) {
  if (input.data.requester.length === 0) {
    throw ERROR_REQUESTER_IS_EMPTY;
  }
}

/**
 *
 * @param input
 * @throws {ERROR_RECEIVER_IS_EMPTY}
 */
export function validateEmptyReceiver(input: { data: { receiver: string } }) {
  if (input.data.receiver.length === 0) {
    throw ERROR_RECEIVER_IS_EMPTY;
  }
}

/**
 *
 * @param input
 * @throws {ERROR_REASON_IS_EMPTY}
 */
export function validateEmptyReason(input: { data: { reason: string } }) {
  if (input.data.reason.length === 0) {
    throw ERROR_REASON_IS_EMPTY;
  }
}

/**
 *
 * @param input
 * @throws {ERROR_NONCE_IS_EMPTY}
 */
export function validateEmptyNonce(input: { data: { nonce: string } }) {
  if (input.data.nonce.length === 0) {
    throw ERROR_NONCE_IS_EMPTY;
  }
}

/**
 *
 * @param input
 * @throws {ERROR_AMOUNT_IS_EMPTY}
 */
export function validateEmptyAmount(input: { data: { amounts: AmountI[] } }) {
  if (input.data.amounts.length === 0) {
    throw ERROR_AMOUNT_IS_EMPTY;
  }
}

/**
 *
 * @param input
 * @throws {ERROR_STRINGIFIED_DATA_IS_EMPTY}
 */
export function validateEmptyStringifiedData(input: {
  stringifiedData: string;
}) {
  if (input.stringifiedData.length === 0) {
    throw ERROR_STRINGIFIED_DATA_IS_EMPTY;
  }
}

/**
 *
 * @param input
 * @throws {ERROR_STRINGIFIED_DATA_IS_NOT_EQUAL_TO_DATA}
 * @throws {ERROR_SIGNATURE_DOES_NOT_VERIFY}
 */
export function validateRequesterSignature(input: {
  stringifiedData: string;
  signature: string;
  data: { requester: string };
}) {
  const data = JSON.parse(input.stringifiedData);
  if (!isEqual(data, input.data)) {
    throw ERROR_STRINGIFIED_DATA_IS_NOT_EQUAL_TO_DATA;
  }
  const pair = StellarSdk.Keypair.fromPublicKey(input.data.requester);
  const isVerified = pair.verify(
    Buffer.from(input.stringifiedData),
    Buffer.from(input.signature, 'base64'),
  );
  if (!isVerified) {
    throw ERROR_SIGNATURE_DOES_NOT_VERIFY;
  }
}

/**
 *
 * @param input
 * @param config
 * @throws {ERROR_REQUESTER_NOT_IN_ADMINS}
 */
export function validateRequester(
  input: { data: { requester: string } },
  config: { listAdmins: string[] },
) {
  const isIn = config.listAdmins.includes(input.data.requester);
  if (!isIn) {
    throw ERROR_REQUESTER_NOT_IN_ADMINS;
  }
}

/**
 *
 * @param input
 * @param config
 * @throws {ERROR_ASSET_NAME_DOES_NOT_EXISTS}
 * @throws {ERROR_AMOUNT_CAN_NOT_BE_EQUAL_OR_LESS_THAN_ZERO}
 */
export function validateAmmount(
  amounts: AmountI[],
  config: { currencyUnits: string[] },
) {
  amounts.forEach(amount => {
    if (!config.currencyUnits.includes(amount.assetName)) {
      throw ERROR_ASSET_NAME_DOES_NOT_EXISTS;
    }
    const amountNumber = new BigNumber(amount.amountNumber);
    if (amountNumber.lte(0)) {
      throw ERROR_AMOUNT_CAN_NOT_BE_EQUAL_OR_LESS_THAN_ZERO;
    }
  });
}

/**
 *
 * @param input
 * @param config
 * @throws {ERROR_INCLUDED_LUMENS_ARE_OVER_THE_LIMIT}
 */
export function validateLumen(
  input: { data: { includeLumens: string } },
  config: { limitLumens: string },
) {
  const includeLumen = new BigNumber(input.data.includeLumens);
  const limitLumens = new BigNumber(config.limitLumens);
  if (includeLumen.gt(limitLumens)) {
    throw ERROR_INCLUDED_LUMENS_ARE_OVER_THE_LIMIT;
  }
}

/**
 *
 * @param signatureExists
 * @param signature
 * @throws {ERROR_THE_SIGNATURE_ALREADY_EXISTS}
 */
export async function validateSignatureExists(
  signatureExists: (signature: string) => Promise<boolean>,
  signature: string,
) {
  const exists = await signatureExists(signature);
  if (exists) {
    throw ERROR_THE_SIGNATURE_ALREADY_EXISTS;
  }
}

/**
 *
 * @param hash
 * @param password
 * @throws {ERROR_THE_PASSWORD_IS_NOT_CORRECT}
 */
export function validatePassword(hash: string, password: string) {
  const shasum = crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
  if (shasum !== hash) {
    throw ERROR_THE_PASSWORD_IS_NOT_CORRECT;
  }
}

export async function validateAssetsMasterKey(assets: InputAsset[]) {
  assets.forEach(asset => {
    if (asset.masterKey.length !== 56) {
      throw ERROR_MASTER_KEY_IS_NOT_CORRECT_LENGTH;
    }
  });
}

/**
 *
 * @param input
 * @throws {ERROR_DEPOSIT_HASH_IS_EMPTY}
 */
export function validateEmptyDepositHash(input: { depositHash: string }) {
  if (input.depositHash.length === 0) {
    throw ERROR_DEPOSIT_HASH_IS_EMPTY;
  }
}
