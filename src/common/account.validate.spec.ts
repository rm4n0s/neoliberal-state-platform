import * as tfv from './common-validations';
import * as StellarSdk from 'stellar-sdk';

import { InputAccount } from '../interfaces/account.interface';
import {
  ERROR_SIGNATURE_IS_EMPTY,
  ERROR_REQUESTER_IS_EMPTY,
  ERROR_MASTER_KEY_IS_EMPTY,
  ERROR_NONCE_IS_EMPTY,
  ERROR_STRINGIFIED_DATA_IS_EMPTY,
  ERROR_STRINGIFIED_DATA_IS_NOT_EQUAL_TO_DATA,
  ERROR_SIGNATURE_DOES_NOT_VERIFY,
} from './errors';

describe('Account validations', () => {
  test('the input has empty values', () => {
    const input: InputAccount = {
      data: {
        masterKey: '',
        requester: '',
        description: '',
        name: '',
        includeLumens: '',
        nonce: '',
      },
      stringifiedData: '',
      signature: '',
    };

    expect(() => {
      tfv.validateEmptySignature(input);
    }).toThrow(ERROR_SIGNATURE_IS_EMPTY);
    expect(() => {
      tfv.validateEmptyRequester(input);
    }).toThrowError(ERROR_REQUESTER_IS_EMPTY);
    expect(() => {
      tfv.validateEmptyMasterKey(input);
    }).toThrowError(ERROR_MASTER_KEY_IS_EMPTY);
    expect(() => {
      tfv.validateEmptyNonce(input);
    }).toThrowError(ERROR_NONCE_IS_EMPTY);
    expect(() => {
      tfv.validateEmptyStringifiedData(input);
    }).toThrowError(ERROR_STRINGIFIED_DATA_IS_EMPTY);
  });

  test('all about verifying signature', () => {
    const receiverPair = StellarSdk.Keypair.fromSecret(
      'SD7OEY3YYUUXYWOMKFJ3A7XCWUPKE37RG5SMNLU4YCXB4LICU7SHTGMD',
    );
    const input: InputAccount = {
      data: {
        requester: receiverPair.publicKey(),
        masterKey: 'GDYLRCZVBZWG3GPE2JJYKYCVGBDFE5ERZIILYH7NCVZ3ADWC3OU352TE',
        name: 'send money for fun',
        includeLumens: '11',
        description: '',
        nonce: 'allalal',
      },
      stringifiedData: '',
      signature: '',
    };

    // compare data and stringified data and fail
    const { nonce, ...objWithoutNonce } = input.data;
    input.stringifiedData = JSON.stringify(objWithoutNonce);
    input.signature = receiverPair
      .sign(Buffer.from(input.stringifiedData))
      .toString('base64');
    expect(() => {
      tfv.validateRequesterSignature(input);
    }).toThrowError(ERROR_STRINGIFIED_DATA_IS_NOT_EQUAL_TO_DATA);

    // verify that signature is not correct
    input.stringifiedData = JSON.stringify(input.data);
    input.signature = receiverPair
      .sign(Buffer.from(input.stringifiedData + 'extra'))
      .toString('base64');
    expect(() => {
      tfv.validateRequesterSignature(input);
    }).toThrowError(ERROR_SIGNATURE_DOES_NOT_VERIFY);

    // verify signature
    input.stringifiedData = JSON.stringify(input.data);
    input.signature = receiverPair
      .sign(Buffer.from(input.stringifiedData))
      .toString('base64');
    expect(() => {
      tfv.validateRequesterSignature(input);
    }).not.toThrowError(ERROR_SIGNATURE_DOES_NOT_VERIFY);
  });
});
