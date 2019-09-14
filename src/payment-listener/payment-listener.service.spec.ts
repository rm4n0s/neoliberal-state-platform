import * as StellarSdk from 'stellar-sdk';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentListenerService } from './payment-listener.service';
import {
  generateProviders,
  generateConf,
  generateStellarAccount,
} from '../test-utils/common-generators';
import { ConfigService } from '../config/config.service';
import { StellarPayment } from '../interfaces/payment.interface';
import { DepositsService } from '../deposits/deposits.service';
import BigNumber from 'bignumber.js';
import { TaxesService } from '../taxes/taxes.service';
import { InputTax } from '../interfaces/tax.interface';

describe('PaymentListenerService', () => {
  let service: PaymentListenerService;
  let configService: ConfigService;
  let depositService: DepositsService;
  let taxService: TaxesService;

  const dbName = 'PaymentListenerService';
  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    const admin = StellarSdk.Keypair.random();
    const conf = await generateConf(
      dbName,
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: generateProviders(conf),
    }).compile();

    service = module.get<PaymentListenerService>(PaymentListenerService);
    configService = module.get<ConfigService>(ConfigService);
    depositService = module.get<DepositsService>(DepositsService);
    taxService = module.get<TaxesService>(TaxesService);
  });

  test('test successful payment with deposit creation and deposit of amount is increasing', async () => {
    const hash = 'hashshahaha';
    const payment1: StellarPayment = {
      from: 'fake',
      to: 'fake',
      asset_issuer: configService.getConf().publicKey,
      asset_code: '1',
      amount: '1',
      transaction_hash: 'hash',
      hash,
    };
    await service.applyPayment(payment1);
    const deposit1 = await depositService.getDeposit(hash);

    expect(new BigNumber(deposit1.totalNumber).eq('1')).toBeTruthy();
    const payment2: StellarPayment = {
      from: 'fake',
      to: 'fake',
      asset_issuer: configService.getConf().publicKey,
      asset_code: 'c50',
      amount: '1',
      transaction_hash: 'hash',
      hash,
    };
    await service.applyPayment(payment2);
    const deposit2 = await depositService.getDeposit(hash);
    expect(new BigNumber(deposit2.totalNumber).eq('1.50')).toBeTruthy();
  });

  test('test successful payment with tax', async () => {
    const adminPair = StellarSdk.Keypair.fromSecret(
      configService.getConf().privateKey,
    );
    const inputTax: InputTax = {
      data: {
        requester: adminPair.publicKey(),
        taxNumber: '10',
        nonce: '',
      },
      stringifiedData: '',
      signature: '',
    };

    inputTax.stringifiedData = JSON.stringify(inputTax.data);
    inputTax.signature = adminPair
      .sign(Buffer.from(inputTax.stringifiedData))
      .toString('base64');

    await taxService.saveTax('PaymentListenerService', inputTax);

    const hash = 'hohoohohohoho';
    const payment1: StellarPayment = {
      from: 'fake',
      to: 'fake',
      asset_issuer: configService.getConf().publicKey,
      asset_code: 'c50',
      amount: '1',
      transaction_hash: 'hash',
      hash,
    };
    await service.applyPayment(payment1);
    const deposit1 = await depositService.getDeposit(hash);
    expect(new BigNumber(deposit1.totalNumber).eq('0.50')).toBeTruthy();
    expect(new BigNumber(deposit1.taxedNumber).eq('0.05')).toBeTruthy();
    expect(new BigNumber(deposit1.untaxedNumber).eq('0.45')).toBeTruthy();

    const payment2: StellarPayment = {
      from: 'fake',
      to: 'fake',
      asset_issuer: configService.getConf().publicKey,
      asset_code: '1',
      amount: '1',
      transaction_hash: 'hash',
      hash,
    };
    await service.applyPayment(payment2);
    const deposit2 = await depositService.getDeposit(hash);
    expect(new BigNumber(deposit2.totalNumber).eq('1.50')).toBeTruthy();
    expect(new BigNumber(deposit2.taxedNumber).eq('0.15')).toBeTruthy();
    expect(new BigNumber(deposit2.untaxedNumber).eq('1.35')).toBeTruthy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
