import * as StellarSdk from 'stellar-sdk';
import { BigNumber } from 'bignumber.js';
import { Test, TestingModule } from '@nestjs/testing';
import { WithdrawsService } from './withdraws.service';
import {
  generateConf,
  generateProviders,
  generateStellarAccount,
} from '../test-utils/common-generators';
import {
  InputWithdraw,
  ToSaveWithdraw,
} from '../interfaces/withdraw.interface';
import {
  FAILED_TO_CREATE_ACCOUNT_ON_STELLAR,
  FAILED_TO_TRUST_ASSET_ON_STELLAR,
  FAILED_THE_TRANSACTION_ON_STELLAR,
  FAILED_TO_CHANGE_MASTER_KEY_ON_STELLAR,
} from '../common/errors';
import { AccountsService } from '../accounts/accounts.service';
import { InputAsset } from '../interfaces/asset.interface';

describe('WithdrawsService', () => {
  let service: WithdrawsService;
  let accountService: AccountsService;

  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    const admin = StellarSdk.Keypair.random();
    const conf = await generateConf(
      'TestWithdrawService',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: generateProviders(conf),
    }).compile();

    service = module.get<WithdrawsService>(WithdrawsService);
    accountService = module.get<AccountsService>(AccountsService);
  });

  test('Test successfull withdraw', async () => {
    let input: ToSaveWithdraw = {
      assets: [
        {
          assetName: '1',
          amountNumber: '1',
          masterKey: '',
          address: '',
          addressSecret: '',
        },
      ],
      depositHash: 'asad',
      password: 'a',
    };
    let saved = await service.saveWithdraw(
      'WithdrawsService',
      input,
      '1',
      '0',
      '1',
    );
    expect(saved.assets.length).toEqual(1);
    expect(saved.assets[0].assetName).toEqual('1');
    expect(saved.depositHash).toEqual(input.depositHash);
    expect(saved.taxReceivedNumber).toEqual('0');
    expect(saved.totalNumber).toEqual('1');
    expect(saved.amountNumber).toEqual('1');

    input = {
      assets: [
        {
          assetName: '2',
          amountNumber: '1',
          masterKey: '',
          address: '',
          addressSecret: '',
        },
      ],
      depositHash: 'asad',
      password: 'a',
    };
    saved = await service.saveWithdraw(
      'WithdrawsService',
      input,
      '2',
      '0',
      '2',
    );
    expect(saved.assets.length).toEqual(1);
    expect(saved.assets[0].assetName).toEqual('2');
    expect(saved.depositHash).toEqual(input.depositHash);
    expect(saved.taxReceivedNumber).toEqual('0');
    expect(saved.totalNumber).toEqual('2');
    expect(saved.amountNumber).toEqual('2');

    const ws = await service.getWithdraws(input.depositHash);
    expect(ws.length).toEqual(2);
  });

  test('test total payment assets', async () => {
    const assets: InputAsset[] = [
      {
        assetName: '1',
        amountNumber: '10',
        masterKey: '',
      },
      {
        assetName: 'c50',
        amountNumber: '2',
        masterKey: '',
      },
    ];
    const amount = service.totalAssetsAmount(assets);
    expect(new BigNumber(amount).eq('11')).toBeTruthy();
  });

  test('test create account for asset', async done => {
    const masterKey = StellarSdk.Keypair.random();

    const asset: InputAsset = {
      assetName: '1',
      amountNumber: '1',
      masterKey: masterKey.publicKey(),
    };
    expect(async () => {
      const newAddress = await service.createAccountForAssetOnStellar(
        'WithdrawsService',
        asset,
      );
      expect(async () => {
        await service.trustAssetOnStellar(
          'WithdrawsService',
          asset,
          newAddress,
        );
        expect(async () => {
          await service.transferAssetToAccountOnStellar(
            'WithdrawsService',
            asset,
            newAddress,
          );
          expect(async () => {
            await service.changeMasterKeyOnStellar(
              'WithdrawsService',
              asset,
              newAddress,
            );
            const balances = await accountService.getBalanceFromStellar(
              newAddress.publicKey(),
            );
            expect(balances.length).toEqual(2);
            for (const balance of balances) {
              if (balance.asset !== 'lumen') {
                expect(balance.asset).toEqual(asset.assetName);
                expect(
                  new BigNumber(balance.balanceNumber).eq(asset.amountNumber),
                ).toBeTruthy();
              }
            }
            done();
          }).not.toThrow(FAILED_TO_CHANGE_MASTER_KEY_ON_STELLAR);
        }).not.toThrow(FAILED_THE_TRANSACTION_ON_STELLAR);
      }).not.toThrow(FAILED_TO_TRUST_ASSET_ON_STELLAR);
    }).not.toThrow(FAILED_TO_CREATE_ACCOUNT_ON_STELLAR);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
