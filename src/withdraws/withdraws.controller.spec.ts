import * as StellarSdk from 'stellar-sdk';
import * as crypto from 'crypto';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WithdrawsController } from './withdraws.controller';
import {
  generateStellarAccount,
  generateConf,
  generateProviders,
  createPublicAccount,
  transferAmountToAccount,
} from '../test-utils/common-generators';
import { stellarPayment } from '../test-utils/payment';
import { ConfigurationI } from '../interfaces/config.interface';
import { AmountI } from '../interfaces/amount.interface';
import { AccountsController } from '../accounts/accounts.controller';
import { TransfersController } from '../transfers/transfers.controller';
import { DepositsController } from '../deposits/deposits.controller';
import {
  InputWithdraw,
  OutputWithdraw,
} from '../interfaces/withdraw.interface';
import BigNumber from 'bignumber.js';
import { requestIdMiddleware } from '../common/middlewares';
import { DepositsService } from '../deposits/deposits.service';
import { OutputDeposit } from '../interfaces/deposit.interface';
import { AccountsService } from '../accounts/accounts.service';
import { TaxesService } from '../taxes/taxes.service';
import { InputTax, OutputTax } from '../interfaces/tax.interface';
import { TaxesController } from '../taxes/taxes.controller';
import { ListPaginatedI } from '../interfaces/pagination.interface';
import { OutputState } from '../interfaces/state.interface';
import { ConfigController } from '../config/config.controller';
import { InputAsset } from '../interfaces/asset.interface';

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

describe('Withdraws Controller', () => {
  let controller: WithdrawsController;
  let app: INestApplication;
  let conf: ConfigurationI;
  let admin: StellarSdk.Keypair;
  let depositService: DepositsService;
  let accountsService: AccountsService;

  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    admin = StellarSdk.Keypair.random();
    conf = await generateConf(
      'TestWithdrawController',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        WithdrawsController,
        AccountsController,
        TransfersController,
        DepositsController,
        TaxesController,
        ConfigController,
      ],
      providers: generateProviders(conf),
    }).compile();

    controller = module.get<WithdrawsController>(WithdrawsController);
    depositService = module.get<DepositsService>(DepositsService);
    accountsService = module.get<AccountsService>(AccountsService);
    app = module.createNestApplication();
    app.use(requestIdMiddleware);
    await app.init();
  });

  test('Successful withdraw without tax', async () => {
    // +++++ create account +++
    const [accMasterKey, account] = await createPublicAccount(admin, app);
    const amounts: AmountI[] = [
      { assetName: '1', amountNumber: '100' },
      { assetName: '2', amountNumber: '100' },
    ];
    await transferAmountToAccount(admin, account.address, amounts, app);

    // +++++ payment to deposit +++
    const amountsPayment: AmountI[] = [
      { assetName: '1', amountNumber: '10' },
      { assetName: '2', amountNumber: '1' },
    ];
    const password = 'password-aaaaa';
    const hash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    // tslint:disable-next-line:no-console
    console.log('Hash ' + hash);
    await stellarPayment(
      account.address,
      accMasterKey.secret(),
      conf.publicKey,
      amountsPayment,
      hash,
    );

    // ++++ check deposit +++
    let depOut: OutputDeposit;
    while (true) {
      try {
        depOut = await depositService.getDeposit(hash);
        break;
      } catch (e) {
        await sleep(1000);
      }
    }
    for (let i = 0; i < 600; i++) {
      depOut = await depositService.getDeposit(hash);
      if (new BigNumber(depOut.totalNumber).eq('12')) {
        break;
      }
      await sleep(1000);
    }
    // tslint:disable-next-line:no-console
    console.log('total number', depOut.totalNumber);
    expect(new BigNumber(depOut.totalNumber).eq('12')).toBeTruthy();
    expect(new BigNumber(depOut.untaxedNumber).eq('12')).toBeTruthy();
    expect(new BigNumber(depOut.taxedNumber).eq('0')).toBeTruthy();

    // ++++ withdraw assets +++
    const masterKeyPair = StellarSdk.Keypair.random();
    const inputAssets: InputAsset[] = [];
    for (let i = 0; i < 12; i++) {
      const inputAsset: InputAsset = {
        amountNumber: '1',
        assetName: '1',
        masterKey: masterKeyPair.publicKey(),
      };
      inputAssets.push(inputAsset);
    }
    const inputWithdraw: InputWithdraw = {
      assets: inputAssets,
      depositHash: hash,
      password,
    };

    const withdrawResp = await request(app.getHttpServer())
      .post('/api/withdraws')
      .send(inputWithdraw);
    expect(withdrawResp.status).toEqual(201);
    const withdrawOutput = withdrawResp.body as OutputWithdraw;
    expect(new BigNumber(withdrawOutput.totalNumber).eq('12')).toBeTruthy();
    expect(
      new BigNumber(withdrawOutput.taxReceivedNumber).eq('0'),
    ).toBeTruthy();
    expect(new BigNumber(withdrawOutput.amountNumber).eq('12')).toBeTruthy();
    for (const asset of withdrawOutput.assets) {
      for (let i = 0; i < 1000; i++) {
        try {
          const balances = await accountsService.getBalanceFromStellar(
            asset.address,
          );
          // tslint:disable-next-line:no-console
          console.log('Created the account for asset ', asset.address);
          for (const balance of balances) {
            if (balance.asset === asset.assetName) {
              expect(
                new BigNumber(balance.balanceNumber).eq(asset.amountNumber),
              ).toBeTruthy();
            }
          }
          break;
        } catch (e) {
          await sleep(1000);
        }
      }
    }

    depOut = await depositService.getDeposit(hash);
    expect(new BigNumber(depOut.totalNumber).eq('0')).toBeTruthy();
    expect(new BigNumber(depOut.untaxedNumber).eq('0')).toBeTruthy();
    expect(new BigNumber(depOut.taxedNumber).eq('0')).toBeTruthy();
  });

  test('Successful withdraw with tax', async () => {
    // +++ create tax +++
    const inputTax: InputTax = {
      data: {
        requester: admin.publicKey(),
        taxNumber: '10',
        nonce: 'aaaa',
      },
      signature: '',
      stringifiedData: '',
    };
    inputTax.stringifiedData = JSON.stringify(inputTax.data);
    inputTax.signature = admin
      .sign(Buffer.from(inputTax.stringifiedData))
      .toString('base64');
    const taxResp = await request(app.getHttpServer())
      .post('/api/taxes')
      .send(inputTax);
    expect(taxResp.status).toEqual(201);

    // +++++ create account +++
    const [accMasterKey, account] = await createPublicAccount(admin, app);
    const amounts: AmountI[] = [{ assetName: '1', amountNumber: '100' }];
    await transferAmountToAccount(admin, account.address, amounts, app);

    // +++++ payment to deposit +++
    const amountsPayment: AmountI[] = [{ assetName: '1', amountNumber: '10' }];
    const password = 'password-pppppp';
    const hash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    // tslint:disable-next-line:no-console
    console.log('Hash ' + hash);
    await stellarPayment(
      account.address,
      accMasterKey.secret(),
      conf.publicKey,
      amountsPayment,
      hash,
    );

    // ++++ check deposit +++
    let depOut: OutputDeposit;
    for (let i = 0; i < 150; i++) {
      try {
        depOut = await depositService.getDeposit(hash);
        if (new BigNumber(depOut.totalNumber).eq('10')) {
          break;
        }
        await sleep(1000);
      } catch (e) {
        await sleep(1000);
      }
    }
    expect(new BigNumber(depOut.totalNumber).eq('10')).toBeTruthy();
    expect(new BigNumber(depOut.taxedNumber).eq('1')).toBeTruthy();
    expect(new BigNumber(depOut.untaxedNumber).eq('9')).toBeTruthy();

    // ++++ withdraw assets +++
    const masterKeyPair = StellarSdk.Keypair.random();
    const inputAssets: InputAsset[] = [];
    for (let i = 0; i < 9; i++) {
      const inputAsset: InputAsset = {
        amountNumber: '1',
        assetName: '1',
        masterKey: masterKeyPair.publicKey(),
      };
      inputAssets.push(inputAsset);
    }
    const inputWithdraw: InputWithdraw = {
      assets: inputAssets,
      depositHash: hash,
      password,
    };

    const withdrawResp = await request(app.getHttpServer())
      .post('/api/withdraws')
      .send(inputWithdraw);
    expect(withdrawResp.status).toEqual(201);
    const withdrawOutput = withdrawResp.body as OutputWithdraw;
    expect(new BigNumber(withdrawOutput.totalNumber).eq('10')).toBeTruthy();
    expect(
      new BigNumber(withdrawOutput.taxReceivedNumber).eq('1'),
    ).toBeTruthy();
    expect(new BigNumber(withdrawOutput.amountNumber).eq('9')).toBeTruthy();
    for (const asset of withdrawOutput.assets) {
      for (let i = 0; i < 1000; i++) {
        try {
          const balances = await accountsService.getBalanceFromStellar(
            asset.address,
          );
          // tslint:disable-next-line:no-console
          console.log('Created the account for asset ', asset.address);
          for (const balance of balances) {
            if (balance.asset === asset.assetName) {
              expect(
                new BigNumber(balance.balanceNumber).eq(asset.amountNumber),
              ).toBeTruthy();
            }
          }
          break;
        } catch (e) {
          await sleep(1000);
        }
      }
    }

    // ++++ check deposit again that is empty +++
    depOut = await depositService.getDeposit(hash);
    expect(new BigNumber(depOut.taxedNumber).eq('0')).toBeTruthy();
    expect(new BigNumber(depOut.totalNumber).eq('0')).toBeTruthy();
    expect(new BigNumber(depOut.untaxedNumber).eq('0')).toBeTruthy();

    // ++++ check tax revenue is 1 +++
    const pagTaxResp = await request(app.getHttpServer()).get(
      '/api/taxes?page=0&size=1',
    );

    const getAllTaxes = pagTaxResp.body as ListPaginatedI<OutputTax>;
    expect(getAllTaxes.data.length).toEqual(1);
    expect(
      new BigNumber(getAllTaxes.data[0].taxRevenueNumber).eq('1'),
    ).toBeTruthy();

    const stateResp = await request(app.getHttpServer()).get(
      '/api/config/state',
    );
    const state = stateResp.body as OutputState;
    // tslint:disable-next-line:no-console
    console.log(state);
    expect(new BigNumber(state.taxRevenueNumber).eq('1')).toBeTruthy();
    depOut = await depositService.getDeposit(hash);
    expect(new BigNumber(depOut.totalNumber).eq('0')).toBeTruthy();
    expect(new BigNumber(depOut.untaxedNumber).eq('0')).toBeTruthy();
    expect(new BigNumber(depOut.taxedNumber).eq('0')).toBeTruthy();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
