import * as StellarSdk from 'stellar-sdk';
import * as crypto from 'crypto';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DepositsController } from './deposits.controller';
import { ConfigurationI } from '../interfaces/config.interface';
import {
  generateStellarAccount,
  generateConf,
  generateProviders,
} from '../test-utils/common-generators';
import { DepositsService } from './deposits.service';
import {
  InputDepositInfo,
  OutputDeposit,
} from '../interfaces/deposit.interface';
import { requestIdMiddleware } from '../common/middlewares';

describe('DepositController', () => {
  let controller: DepositsController;
  let app: INestApplication;
  let conf: ConfigurationI;
  let admin: StellarSdk.Keypair;
  let service: DepositsService;

  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    admin = StellarSdk.Keypair.random();
    conf = await generateConf(
      'TestDepositController',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepositsController],
      providers: generateProviders(conf),
    }).compile();

    controller = module.get<DepositsController>(DepositsController);
    service = module.get<DepositsService>(DepositsService);

    app = module.createNestApplication();
    app.use(requestIdMiddleware);
    await app.init();
  });

  test('Fail to receive deposit info, wrong password', async () => {
    const password = 'password';
    const hash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    await service.saveDeposit('DepositController', hash);

    const input: InputDepositInfo = {
      password: 'pasword',
      hash,
    };
    const depositResp = await request(app.getHttpServer())
      .post('/api/deposits/info')
      .send(input);
    expect(depositResp.status).toEqual(401);
  });

  test('Successful deposit', async () => {
    const password = 'password2';
    const hash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    await service.saveDeposit('DepositController', hash);

    const input: InputDepositInfo = {
      password,
      hash,
    };
    const depositResp1 = await request(app.getHttpServer())
      .post('/api/deposits/info')
      .send(input);
    expect(depositResp1.status).toEqual(201);
    const output1 = depositResp1.body as OutputDeposit;
    expect(output1.hash).toEqual(hash);
    expect(output1.totalNumber).toEqual('0');

    await service.editDepositNumbers('DepositController', hash, '0', '10', '0');
    const depositResp = await request(app.getHttpServer())
      .post('/api/deposits/info')
      .send(input);
    expect(depositResp.status).toEqual(201);
    const output = depositResp.body as OutputDeposit;
    expect(output.hash).toEqual(hash);
    expect(output.totalNumber).toEqual('10');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
