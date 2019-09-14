import * as StellarSdk from 'stellar-sdk';
import * as request from 'supertest';
import { transform } from 'lodash';
import BigNumber from 'bignumber.js';

import { Test, TestingModule } from '@nestjs/testing';
import { TransfersController } from './transfers.controller';
import { ConfigurationI } from '../interfaces/config.interface';
import { INestApplication } from '@nestjs/common';
import { Balance } from '../interfaces/balance.interface';
import {
  InputTransfer,
  OutputTransfer,
} from '../interfaces/transfer.interface';
import { AccountsController } from '../accounts/accounts.controller';
import { ListPaginatedI } from '../interfaces/pagination.interface';
import {
  generateConf,
  generateStellarAccount,
  createPublicAccount,
  generateProviders,
} from '../test-utils/common-generators';
import { requestIdMiddleware } from '../common/middlewares';
import { ConfigService } from '../config/config.service';
import { ConfigController } from '../config/config.controller';
import { OutputState } from '../interfaces/state.interface';

async function checkAccountBalance(
  inputs: InputTransfer[],
  address: string,
  app: INestApplication,
): Promise<
  [
    Balance[],
    {
      [key: string]: string;
    },
  ]
> {
  const { body } = await request(app.getHttpServer()).get(
    '/api/accounts/' + address + '/balances',
  );
  const balances = body as Balance[];
  const expectedBalances: {
    [key: string]: string;
  } = transform(
    inputs,
    (
      result: {
        [key: string]: string;
      },
      input: InputTransfer,
    ) => {
      for (const amount of input.data.amounts) {
        if (result[amount.assetName]) {
          const sum = new BigNumber(result[amount.assetName]).plus(
            amount.amountNumber,
          );
          result[amount.assetName] = sum.toString();
        } else {
          result[amount.assetName] = amount.amountNumber;
        }
      }
      return result;
    },
    {},
  );

  return [balances, expectedBalances];
}

describe('Transfers Controller', () => {
  let controller: TransfersController;
  let app: INestApplication;
  let conf: ConfigurationI;
  let admin: StellarSdk.Keypair;
  let configService: ConfigService;

  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    admin = StellarSdk.Keypair.random();
    conf = await generateConf(
      'TestTransferController',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    expect(conf.listAdmins[0]).toEqual(admin.publicKey());
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransfersController, AccountsController, ConfigController],
      providers: generateProviders(conf),
    }).compile();

    module.get<AccountsController>(AccountsController);
    controller = module.get<TransfersController>(TransfersController);
    configService = module.get<ConfigService>(ConfigService);
    app = module.createNestApplication();
    app.use(requestIdMiddleware);
    await app.init();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('Transfer successfully three times from printer', async () => {
    const [master, acc] = await createPublicAccount(admin, app);
    const inputs: InputTransfer[] = [];
    const outputTransferUUIDs: string[] = [];
    for (let i = 0; i < 3; i++) {
      const input: InputTransfer = {
        data: {
          requester: admin.publicKey(),
          receiver: acc.address,
          reason: 'send money for fun',
          includeLumens: '11' + i,
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
          nonce: 'allalal' + i,
          source: 'printer',
        },
        stringifiedData: '',
        signature: '',
      };

      input.stringifiedData = JSON.stringify(input.data);
      input.signature = admin
        .sign(Buffer.from(input.stringifiedData))
        .toString('base64');
      inputs.push(input);
      const tranResp = await request(app.getHttpServer())
        .post('/api/transfers')
        .send(input);

      expect(tranResp.status).toEqual(201);
      const transfer = tranResp.body as OutputTransfer;
      expect(transfer.receiver).toEqual(input.data.receiver);
      expect(transfer.requester).toEqual(input.data.requester);
      expect(transfer.reason).toEqual(input.data.reason);
      expect(transfer.includedLumens).toEqual(input.data.includeLumens);
      expect(transfer.signature).toEqual(input.signature);
      expect(transfer.signedData).toEqual(input.stringifiedData);

      outputTransferUUIDs.push(transfer.uuid);
      for (const amount of transfer.amounts) {
        const acceptedAmmounts = input.data.amounts.filter(a => {
          return (
            a.amountNumber === amount.amountNumber &&
            a.assetName === amount.assetName
          );
        });
        expect(acceptedAmmounts.length).toEqual(1);
      }
    }

    const getAllTranResp = await request(app.getHttpServer()).get(
      '/api/transfers?page=0&size=3',
    );
    const pageZeroTranfer = getAllTranResp.body as ListPaginatedI<
      OutputTransfer
    >;
    expect(pageZeroTranfer.data.length).toEqual(3);
    expect(pageZeroTranfer.data[0].uuid).toEqual(outputTransferUUIDs[2]);
    expect(pageZeroTranfer.data[0].amounts.length).toEqual(2);

    const getPageTranResp = await request(app.getHttpServer()).get(
      '/api/transfers?page=2&size=1',
    );
    const lastPageTranfer = getPageTranResp.body as ListPaginatedI<
      OutputTransfer
    >;
    expect(lastPageTranfer.data.length).toEqual(1);
    expect(lastPageTranfer.data[0].uuid).toEqual(outputTransferUUIDs[0]);
    expect(lastPageTranfer.data[0].amounts.length).toEqual(2);

    const getByIdResp = await request(app.getHttpServer()).get(
      '/api/transfers/' + lastPageTranfer.data[0].uuid,
    );
    const oneTransfer = getByIdResp.body as OutputTransfer;
    expect(oneTransfer).toEqual(lastPageTranfer.data[0]);

    const [balances, expectedBalances] = await checkAccountBalance(
      inputs,
      acc.address,
      app,
    );

    for (const balance of balances) {
      if (expectedBalances[balance.asset]) {
        expect(
          new BigNumber(balance.balanceNumber).eq(
            expectedBalances[balance.asset],
          ),
        ).toBeTruthy();
      }
    }

    const getTransfersByAccount = await request(app.getHttpServer()).get(
      '/api/accounts/' + acc.address + '/transfers?size=10&page=0',
    );
    const transByAccount = getTransfersByAccount.body as ListPaginatedI<
      OutputTransfer
    >;
    expect(transByAccount.data.length).toEqual(3);
  });

  it('Transfer failed on taxation ', async () => {
    const [master, acc] = await createPublicAccount(admin, app);
    await configService.maximizeTaxRevenueForState('2000');

    const input: InputTransfer = {
      data: {
        requester: admin.publicKey(),
        receiver: acc.address,
        reason: 'send money for fun',
        includeLumens: '11',
        amounts: [
          {
            assetName: '10',
            amountNumber: '100',
          },
          {
            assetName: '20',
            amountNumber: '50',
          },
          {
            assetName: 'c50',
            amountNumber: '1',
          },
        ],
        nonce: 'allalal',
        source: 'taxes',
      },
      stringifiedData: '',
      signature: '',
    };

    input.stringifiedData = JSON.stringify(input.data);
    input.signature = admin
      .sign(Buffer.from(input.stringifiedData))
      .toString('base64');
    const tranResp = await request(app.getHttpServer())
      .post('/api/transfers')
      .send(input);
    // tslint:disable-next-line:no-console
    console.log(tranResp.body);
    expect(tranResp.status).toEqual(401);
    await configService.minimizeTaxRevenueForState('2000');
  });

  it('Transfer successfull on taxation ', async () => {
    const [master, acc] = await createPublicAccount(admin, app);
    await configService.maximizeTaxRevenueForState('2000.50');

    const input: InputTransfer = {
      data: {
        requester: admin.publicKey(),
        receiver: acc.address,
        reason: 'send money for fun',
        includeLumens: '11',
        amounts: [
          {
            assetName: '10',
            amountNumber: '100',
          },
          {
            assetName: '20',
            amountNumber: '50',
          },
          {
            assetName: 'c50',
            amountNumber: '1',
          },
        ],
        nonce: 'allalal',
        source: 'taxes',
      },
      stringifiedData: '',
      signature: '',
    };

    input.stringifiedData = JSON.stringify(input.data);
    input.signature = admin
      .sign(Buffer.from(input.stringifiedData))
      .toString('base64');
    const tranResp = await request(app.getHttpServer())
      .post('/api/transfers')
      .send(input);

    expect(tranResp.status).toEqual(201);
    const stateResp = await request(app.getHttpServer()).get(
      '/api/config/state',
    );
    const state = stateResp.body as OutputState;

    expect(new BigNumber(state.taxRevenueNumber).eq('0')).toBeTruthy();
  });
});
