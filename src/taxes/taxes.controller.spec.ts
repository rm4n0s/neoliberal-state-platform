import * as StellarSdk from 'stellar-sdk';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

import { TaxesController } from './taxes.controller';
import {
  generateStellarAccount,
  generateConf,
  generateProviders,
} from '../test-utils/common-generators';
import { ConfigurationI } from '../interfaces/config.interface';
import { InputTax, OutputTax } from '../interfaces/tax.interface';
import { ListPaginatedI } from '../interfaces/pagination.interface';
import { requestIdMiddleware } from '../common/middlewares';

describe('Taxes Controller', () => {
  let controller: TaxesController;
  let app: INestApplication;
  let conf: ConfigurationI;
  let admin: StellarSdk.Keypair;

  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    admin = StellarSdk.Keypair.random();
    conf = await generateConf(
      'TestTaxController',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxesController],
      providers: generateProviders(conf),
    }).compile();

    controller = module.get<TaxesController>(TaxesController);
    app = module.createNestApplication();
    app.use(requestIdMiddleware);
    await app.init();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  test('Test create a tax', async () => {
    let input: InputTax = {
      data: {
        requester: admin.publicKey(),
        taxNumber: '10',
        nonce: 'aaaa',
      },
      signature: '',
      stringifiedData: '',
    };

    input.stringifiedData = JSON.stringify(input.data);
    input.signature = admin
      .sign(Buffer.from(input.stringifiedData))
      .toString('base64');

    let taxResp = await request(app.getHttpServer())
      .post('/api/taxes')
      .send(input);

    expect(taxResp.status).toEqual(201);
    let tax = taxResp.body as OutputTax;
    expect(tax.requester).toEqual(input.data.requester);
    expect(tax.taxNumber).toEqual(input.data.taxNumber);

    input = {
      data: {
        requester: admin.publicKey(),
        taxNumber: '20',
        nonce: 'bbb',
      },
      signature: '',
      stringifiedData: '',
    };

    input.stringifiedData = JSON.stringify(input.data);
    input.signature = admin
      .sign(Buffer.from(input.stringifiedData))
      .toString('base64');

    taxResp = await request(app.getHttpServer())
      .post('/api/taxes')
      .send(input);

    expect(taxResp.status).toEqual(201);
    tax = taxResp.body as OutputTax;
    expect(tax.requester).toEqual(input.data.requester);
    expect(tax.taxNumber).toEqual(input.data.taxNumber);

    let pagTaxResp = await request(app.getHttpServer()).get(
      '/api/taxes?page=0&size=2',
    );

    let getAllTaxes = pagTaxResp.body as ListPaginatedI<OutputTax>;
    expect(getAllTaxes.data.length).toEqual(2);
    expect(getAllTaxes.data[0].taxNumber).toEqual('20');
    expect(getAllTaxes.data[1].taxNumber).toEqual('10');

    pagTaxResp = await request(app.getHttpServer()).get(
      '/api/taxes?page=1&size=1',
    );

    getAllTaxes = pagTaxResp.body as ListPaginatedI<OutputTax>;
    expect(getAllTaxes.data.length).toEqual(1);
    expect(getAllTaxes.data[0].taxNumber).toEqual('10');
  });
});
