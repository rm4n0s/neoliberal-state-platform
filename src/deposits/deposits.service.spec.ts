import * as StellarSdk from 'stellar-sdk';
import { Test, TestingModule } from '@nestjs/testing';
import { DepositsService } from './deposits.service';
import {
  generateProviders,
  generateStellarAccount,
  generateConf,
} from '../test-utils/common-generators';

describe('DepositService', () => {
  let service: DepositsService;

  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    const admin = StellarSdk.Keypair.random();
    const conf = await generateConf(
      'TestDepositService',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: generateProviders(conf),
    }).compile();

    service = module.get<DepositsService>(DepositsService);
  });
  test('successful input in the DB', async done => {
    const hash = 'hahahahahash';
    const dep = await service.saveDeposit('DepositService', hash);
    const theSameDep = await service.getDeposit(dep.hash);
    expect(dep).toEqual(theSameDep);
    const pageDeps = await service.getDepositsByPage({ page: 0, size: 1 });
    expect(pageDeps.data).toEqual([dep]);
    const taxedNumber = '1';
    const untaxedNumber = '9';
    const totalNumber = '10';
    const edited = await service.editDepositNumbers(
      'DepositService',
      hash,
      taxedNumber,
      totalNumber,
      untaxedNumber,
    );
    expect(edited.taxedNumber).toEqual(taxedNumber);
    expect(edited.totalNumber).toEqual(totalNumber);
    expect(edited.untaxedNumber).toEqual(untaxedNumber);
    done();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
