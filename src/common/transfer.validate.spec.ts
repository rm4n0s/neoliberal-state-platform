import * as tfv from './common-validations';
import * as StellarSdk from 'stellar-sdk';

import {
  ERROR_REQUESTER_IS_EMPTY,
  ERROR_RECEIVER_IS_EMPTY,
  ERROR_REASON_IS_EMPTY,
  ERROR_NONCE_IS_EMPTY,
  ERROR_SIGNATURE_IS_EMPTY,
  ERROR_AMOUNT_IS_EMPTY,
  ERROR_STRINGIFIED_DATA_IS_EMPTY,
  ERROR_STRINGIFIED_DATA_IS_NOT_EQUAL_TO_DATA,
  ERROR_SIGNATURE_DOES_NOT_VERIFY,
  ERROR_REQUESTER_NOT_IN_ADMINS,
  ERROR_ASSET_NAME_DOES_NOT_EXISTS,
  ERROR_AMOUNT_CAN_NOT_BE_EQUAL_OR_LESS_THAN_ZERO,
  ERROR_INCLUDED_LUMENS_ARE_OVER_THE_LIMIT,
} from './errors';
import { InputTransfer } from '../interfaces/transfer.interface';
import { ConfigurationI } from '../interfaces/config.interface';
import {
  generateConf,
  generateStellarAccount,
} from '../test-utils/common-generators';

describe('Transfer validations', () => {
  let CONF: ConfigurationI;
  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    const admin = StellarSdk.Keypair.random();
    CONF = await generateConf(
      'TestAccountService',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
  });
  test('the input has empty values', () => {
    const input: InputTransfer = {
      data: {
        requester: '',
        receiver: '',
        reason: '',
        includeLumens: '0',
        amounts: [],
        nonce: '',
        source: 'printer',
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
      tfv.validateEmptyReceiver(input);
    }).toThrowError(ERROR_RECEIVER_IS_EMPTY);
    expect(() => {
      tfv.validateEmptyReason(input);
    }).toThrowError(ERROR_REASON_IS_EMPTY);
    expect(() => {
      tfv.validateEmptyNonce(input);
    }).toThrowError(ERROR_NONCE_IS_EMPTY);
    expect(() => {
      tfv.validateEmptyAmount(input);
    }).toThrowError(ERROR_AMOUNT_IS_EMPTY);
    expect(() => {
      tfv.validateEmptyStringifiedData(input);
    }).toThrowError(ERROR_STRINGIFIED_DATA_IS_EMPTY);
  });

  test('all about verifying signature', () => {
    const receiverPair = StellarSdk.Keypair.fromSecret(
      'SD7OEY3YYUUXYWOMKFJ3A7XCWUPKE37RG5SMNLU4YCXB4LICU7SHTGMD',
    );
    const input: InputTransfer = {
      data: {
        requester: receiverPair.publicKey(),
        receiver: 'GDYLRCZVBZWG3GPE2JJYKYCVGBDFE5ERZIILYH7NCVZ3ADWC3OU352TE',
        reason: 'send money for fun',
        includeLumens: '11',
        amounts: [
          {
            assetName: '1',
            amountNumber: '100',
          },
        ],
        nonce: 'allalal',
        source: 'printer',
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

    // everything is working
    input.stringifiedData = JSON.stringify(input.data);
    input.signature = receiverPair
      .sign(Buffer.from(input.stringifiedData))
      .toString('base64');
    expect(() => {
      tfv.validateRequesterSignature(input);
    }).not.toThrowError(ERROR_SIGNATURE_DOES_NOT_VERIFY);
  });

  test('validate receiver and requester', () => {
    const randomPair = StellarSdk.Keypair.random();
    const input: InputTransfer = {
      data: {
        requester: randomPair.publicKey(),
        receiver: randomPair.publicKey(),
        reason: 'send money for fun',
        includeLumens: '11',
        amounts: [
          {
            assetName: '1',
            amountNumber: '100',
          },
        ],
        nonce: 'allalal',
        source: 'printer',
      },
      stringifiedData: '',
      signature: '',
    };

    input.stringifiedData = JSON.stringify(input.data);
    input.signature = randomPair
      .sign(Buffer.from(input.stringifiedData))
      .toString('base64');

    expect(() => {
      tfv.validateRequester(input, CONF);
    }).toThrowError(ERROR_REQUESTER_NOT_IN_ADMINS);
  });

  test('validate amount and lumen', () => {
    const randomPair = StellarSdk.Keypair.random();
    const input: InputTransfer = {
      data: {
        requester: randomPair.publicKey(),
        receiver: randomPair.publicKey(),
        reason: 'send money for fun',
        includeLumens: '11',
        amounts: [],
        nonce: 'allalal',
        source: 'printer',
      },
      stringifiedData: '',
      signature: '',
    };

    input.data.amounts = [
      {
        assetName: '1dollar',
        amountNumber: '100',
      },
    ];

    expect(() => {
      tfv.validateAmmount(input.data.amounts, CONF);
    }).toThrowError(ERROR_ASSET_NAME_DOES_NOT_EXISTS);

    input.data.amounts = [
      {
        assetName: '1',
        amountNumber: '-10',
      },
    ];

    expect(() => {
      tfv.validateAmmount(input.data.amounts, CONF);
    }).toThrowError(ERROR_AMOUNT_CAN_NOT_BE_EQUAL_OR_LESS_THAN_ZERO);

    input.data.amounts = [
      {
        assetName: '1',
        amountNumber: '0',
      },
    ];

    expect(() => {
      tfv.validateAmmount(input.data.amounts, CONF);
    }).toThrowError(ERROR_AMOUNT_CAN_NOT_BE_EQUAL_OR_LESS_THAN_ZERO);

    input.data.includeLumens = '101';
    expect(() => {
      tfv.validateLumen(input, CONF);
    }).toThrowError(ERROR_INCLUDED_LUMENS_ARE_OVER_THE_LIMIT);
  });
});
