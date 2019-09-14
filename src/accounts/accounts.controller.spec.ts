import * as StellarSdk from 'stellar-sdk';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { ConfigurationI } from '../interfaces/config.interface';
import { InputAccount, OutputAccount } from '../interfaces/account.interface';
import { Balance } from '../interfaces/balance.interface';
import BigNumber from 'bignumber.js';
import { ListPaginatedI } from '../interfaces/pagination.interface';
import {
  generateStellarAccount,
  generateConf,
  generateProviders,
} from '../test-utils/common-generators';
import { requestIdMiddleware } from '../common/middlewares';

describe('Accounts Controller', () => {
  let controller: AccountsController;
  let app: INestApplication;
  let conf: ConfigurationI;
  let admin: StellarSdk.Keypair;

  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    admin = StellarSdk.Keypair.random();
    conf = await generateConf(
      'TestAccountController',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: generateProviders(conf),
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
    app = module.createNestApplication();
    app.use(requestIdMiddleware);
    await app.init();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('Create an account', async done => {
    const masterKeyPair = StellarSdk.Keypair.random();
    const input: InputAccount = {
      data: {
        requester: admin.publicKey(),
        masterKey: masterKeyPair.publicKey(),
        name: 'Police',
        includeLumens: '99.9999999',
        nonce: '122134',
        description: 'Account for the police',
      },
      stringifiedData: '',
      signature: '',
    };

    input.stringifiedData = JSON.stringify(input.data);
    input.signature = admin
      .sign(Buffer.from(input.stringifiedData))
      .toString('base64');

    const accountResp = await request(app.getHttpServer())
      .post('/api/accounts')
      .send(input);

    expect(accountResp.status).toEqual(201);
    const acc = accountResp.body as OutputAccount;
    expect(acc.requester).toEqual(input.data.requester);
    expect(acc.description).toEqual(input.data.description);
    expect(acc.name).toEqual(input.data.name);
    expect(acc.masterKey).toEqual(input.data.masterKey);
    expect(acc.signature).toEqual(input.signature);
    expect(acc.signedData).toEqual(input.stringifiedData);
    expect(acc.address).toBeDefined();

    const sameAccResp = await request(app.getHttpServer())
      .get(`/api/accounts/${acc.address}`)
      .expect(200);
    const sameAcc = sameAccResp.body as OutputAccount;
    expect(sameAcc).toEqual(acc);

    const balanceResp = await request(app.getHttpServer())
      .get(`/api/accounts/${acc.address}/balances`)
      .expect(200);
    const balances = balanceResp.body as Balance[];
    const assetNames = [...conf.currencyUnits, 'lumen'];
    for (const balance of balances) {
      expect(assetNames.includes(balance.asset)).toBeTruthy();
      if (balance.asset === 'lumen') {
        // compare the inluded lumens between 99 and 99.9999 because some spend on operations
        expect(
          new BigNumber(input.data.includeLumens).gt(balance.balanceNumber) &&
            new BigNumber(balance.balanceNumber).gt('99'),
        ).toBeTruthy();
      }
    }
    done();
  });

  it('Account pagination', async done => {
    const addedAccounts: OutputAccount[] = [];
    for (let i = 0; i < 3; i++) {
      const masterKeyPair = StellarSdk.Keypair.random();
      const input: InputAccount = {
        data: {
          requester: admin.publicKey(),
          masterKey: masterKeyPair.publicKey(),
          name: i.toString(),
          includeLumens: '99.9999999',
          nonce: '122134' + i,
          description: 'Account ' + i,
        },
        stringifiedData: '',
        signature: '',
      };

      input.stringifiedData = JSON.stringify(input.data);
      input.signature = admin
        .sign(Buffer.from(input.stringifiedData))
        .toString('base64');

      const accResp = await request(app.getHttpServer())
        .post('/api/accounts')
        .send(input);
      const acc = accResp.body as OutputAccount;
      addedAccounts.push(acc);
    }

    const getAllResp = await request(app.getHttpServer()).get(
      '/api/accounts?page=0&size=3',
    );
    const getAllAccs = getAllResp.body as ListPaginatedI<OutputAccount>;
    expect(getAllAccs.data.length).toEqual(3);

    const getFirstResp = await request(app.getHttpServer()).get(
      '/api/accounts?page=2&size=1',
    );
    const getFirstAcc = getFirstResp.body as ListPaginatedI<OutputAccount>;
    expect(getFirstAcc.data.length).toEqual(1);
    expect(getFirstAcc.data[0].createdAt).toEqual(addedAccounts[0].createdAt);
    done();
  });
});
