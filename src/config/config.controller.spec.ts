import * as request from 'supertest';
import * as StellarSdk from 'stellar-sdk';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './config.controller';
import { INestApplication } from '@nestjs/common';
import {
  generateStellarAccount,
  generateConf,
  generateProviders,
} from '../test-utils/common-generators';
import { OutputState } from '../interfaces/state.interface';
import BigNumber from 'bignumber.js';
import { ConfigService } from './config.service';

describe('Config Controller', () => {
  let controller: ConfigController;
  let service: ConfigService;
  let app: INestApplication;
  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    const admin = StellarSdk.Keypair.random();
    const conf = await generateConf(
      'TestConfigController',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: generateProviders(conf),
    }).compile();

    controller = module.get<ConfigController>(ConfigController);
    service = module.get<ConfigService>(ConfigService);
    app = module.createNestApplication();
    await app.init();
  });

  it('GET /api/config', () => {
    return request(app.getHttpServer())
      .get('/api/config')
      .expect(200)
      .then(({ body }) => {
        expect(body.privateKey).toBeUndefined();
        expect(body.publicKey).not.toBeUndefined();
      });
  });

  it('GET /api/config/state', async () => {
    let resp = await request(app.getHttpServer()).get('/api/config/state');
    expect(resp.status).toEqual(200);
    let state = resp.body as OutputState;
    expect(new BigNumber(state.taxRevenueNumber).eq('0')).toBeTruthy();
    await service.maximizeTaxRevenueForState('2000');
    resp = await request(app.getHttpServer()).get('/api/config/state');
    state = resp.body as OutputState;
    expect(new BigNumber(state.taxRevenueNumber).eq('2000')).toBeTruthy();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
