import * as StellarSdk from 'stellar-sdk';
import * as bignum from 'bignumber.js';
import { Test, TestingModule } from '@nestjs/testing';
import { TransfersService } from './transfers.service';
import { InputTransfer } from '../interfaces/transfer.interface';
import { ConfigurationI } from '../interfaces/config.interface';
import { AccountsService } from '../accounts/accounts.service';
import { InputAccount } from '../interfaces/account.interface';
import {
  generateStellarAccount,
  generateConf,
  generateProviders,
} from '../test-utils/common-generators';

describe('TransfersService', () => {
  let transferService: TransfersService;
  let accountService: AccountsService;
  let conf: ConfigurationI;
  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    const admin = StellarSdk.Keypair.random();
    conf = await generateConf(
      'TestTransferService',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: generateProviders(conf),
    }).compile();

    transferService = module.get<TransfersService>(TransfersService);
    accountService = module.get<AccountsService>(AccountsService);
  });

  test('successful input in the DB', async done => {
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
          {
            assetName: '2',
            amountNumber: '20',
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

    const tr = await transferService.saveTransfer('TransfersService', input);
    expect(tr).not.toBeUndefined();
    if (tr) {
      const trSame = await transferService.getTransfer(tr.uuid);
      expect(trSame.amounts.length).toEqual(2);
    }
    const trs = await transferService.getTransfers();
    expect(trs.length).toEqual(1);
    done();
  });

  test('successful transaction', async done => {
    const masterKeyPair = StellarSdk.Keypair.random();
    const inputAccount: InputAccount = {
      data: {
        requester: 'GA62ZTFJXXNIMYWD4RQGZRAOQT4BGHIUSMNGG43SCLMWXTR2ZMYZPD4D',
        masterKey: masterKeyPair.publicKey(),
        name: 'Police',
        includeLumens: '10',
        nonce: 'allalal',
        description: '',
      },
      stringifiedData: '',
      signature: '',
    };
    jest.setTimeout(100000);
    const newAddress = await accountService.createAccountOnStellar(
      'TransfersService',
      inputAccount,
    );
    await accountService.trustAssetsOnStellar('TransfersService', newAddress);
    await accountService.changeMasterKeyOnStellar(
      'TransfersService',
      inputAccount,
      newAddress,
    );
    let balances = await accountService.getBalanceFromStellar(
      newAddress.publicKey(),
    );

    const inputTransfer: InputTransfer = {
      data: {
        requester: 'GA62ZTFJXXNIMYWD4RQGZRAOQT4BGHIUSMNGG43SCLMWXTR2ZMYZPD4D',
        receiver: newAddress.publicKey(),
        reason: 'send money for fun',
        includeLumens: '10',
        amounts: [],
        nonce: 'allalal',
        source: 'printer',
      },
      stringifiedData: '',
      signature: '',
    };

    inputTransfer.data.amounts = conf.currencyUnits.map(assetName => {
      return { assetName, amountNumber: '1' };
    });

    await transferService.executeTransfer('TransfersService', inputTransfer);
    balances = await accountService.getBalanceFromStellar(
      newAddress.publicKey(),
    );

    const withOne = balances.filter(balance =>
      new bignum.BigNumber(balance.balanceNumber).eq(1),
    );
    expect(conf.currencyUnits.length).toEqual(withOne.length);

    done();
  });

  it('should be defined', () => {
    expect(transferService).toBeDefined();
  });
});
