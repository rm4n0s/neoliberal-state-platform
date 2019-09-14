import * as StellarSdk from 'stellar-sdk';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { ConfigurationI } from '../interfaces/config.interface';
import { InputAccount } from '../interfaces/account.interface';
import {
  FAILED_TO_CREATE_ACCOUNT_ON_STELLAR,
  FAILED_TO_TRUST_ASSET_ON_STELLAR,
  FAILED_TO_CHANGE_MASTER_KEY_ON_STELLAR,
} from '../common/errors';
import {
  generateStellarAccount,
  generateConf,
  generateProviders,
} from '../test-utils/common-generators';

describe('AccountsService', () => {
  let service: AccountsService;
  let conf: ConfigurationI;
  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    const admin = StellarSdk.Keypair.random();
    conf = await generateConf(
      'TestAccountService',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: generateProviders(conf),
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  test('successful input in the DB', async done => {
    const randomPair = StellarSdk.Keypair.random();
    const input: InputAccount = {
      data: {
        requester: randomPair.publicKey(),
        masterKey: randomPair.publicKey(),
        name: 'Police',
        includeLumens: '11',
        nonce: 'allalal',
        description: '',
      },
      stringifiedData: '',
      signature: '',
    };

    input.stringifiedData = JSON.stringify(input.data);
    input.signature = randomPair
      .sign(Buffer.from(input.stringifiedData))
      .toString('base64');

    const ac = await service.saveAccount(
      'AccountsService',
      input,
      randomPair.publicKey(),
    );
    expect(ac).not.toBeUndefined();
    if (ac) {
      const acSame = await service.getAccount('AccountsService', ac.address);
      expect(acSame.signature).toEqual(input.signature);
    }
    const acs = await service.getAccounts();
    expect(acs.length).toEqual(1);
    done();
  });

  it('successful input on the stellar', async done => {
    const masterKeyPair = StellarSdk.Keypair.random();
    const input: InputAccount = {
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
    expect(async () => {
      const newAddress = await service.createAccountOnStellar(
        'AccountsService',
        input,
      );
      expect(async () => {
        await service.trustAssetsOnStellar('AccountsService', newAddress);
        expect(async () => {
          await service.changeMasterKeyOnStellar(
            'AccountsService',
            input,
            newAddress,
          );
          const balances = await service.getBalanceFromStellar(
            newAddress.publicKey(),
          );
          expect(balances.length).toEqual(conf.currencyUnits.length + 1);
          done();
        }).not.toThrow(FAILED_TO_CHANGE_MASTER_KEY_ON_STELLAR);
      }).not.toThrow(FAILED_TO_TRUST_ASSET_ON_STELLAR);
    }).not.toThrow(FAILED_TO_CREATE_ACCOUNT_ON_STELLAR);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
