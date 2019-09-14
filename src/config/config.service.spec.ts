import * as StellarSdk from 'stellar-sdk';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import {
  generateStellarAccount,
  generateConf,
  generateProviders,
} from '../test-utils/common-generators';
import BigNumber from 'bignumber.js';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    const admin = StellarSdk.Keypair.random();
    const conf = await generateConf(
      'TestConfigService',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: generateProviders(conf),
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  test('successfull state update', async () => {
    let state = await service.getState();
    expect(new BigNumber(state.taxRevenueNumber).eq('0')).toBeTruthy();
    state = await service.maximizeTaxRevenueForState('2000');
    expect(new BigNumber(state.taxRevenueNumber).eq('2000')).toBeTruthy();
    state = await service.minimizeTaxRevenueForState('500');
    expect(new BigNumber(state.taxRevenueNumber).eq('1500')).toBeTruthy();
    state = await service.getState();
    expect(new BigNumber(state.taxRevenueNumber).eq('1500')).toBeTruthy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
