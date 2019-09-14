import * as StellarSdk from 'stellar-sdk';
import * as mysql from 'promise-mysql';
import fetch from 'node-fetch';
import * as request from 'supertest';

import { ConfigurationI } from 'src/interfaces/config.interface';
import { INestApplication, Provider } from '@nestjs/common';
import { InputAccount, OutputAccount } from 'src/interfaces/account.interface';
import { ConfigService } from '../config/config.service';
import { TransfersService } from '../transfers/transfers.service';
import { AccountsService } from '../accounts/accounts.service';
import { PaymentListenerService } from '../payment-listener/payment-listener.service';
import { DepositsService } from '../deposits/deposits.service';
import { PaymentsService } from '../payments/payments.service';
import { Connection } from 'typeorm';
import { TaxesService } from '../taxes/taxes.service';
import { WithdrawsService } from '../withdraws/withdraws.service';
import { AmountI } from '../interfaces/amount.interface';
import { InputTransfer } from '../interfaces/transfer.interface';
import { LoggerService } from '../logger/logger.service';
import { TaxRevenueGateway } from '../config/tax-revenue.gateway';

export async function generateStellarAccount(): Promise<string> {
  jest.setTimeout(1000000);
  const source = StellarSdk.Keypair.random();
  await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(
      source.publicKey(),
    )}`,
  );
  return source.secret();
}

export async function generateDB(conf: ConfigurationI) {
  if (conf.dbOptions.type === 'mysql') {
    const con = await mysql.createConnection({
      host: conf.dbOptions.host,
      user: conf.dbOptions.username,
      password: conf.dbOptions.password,
    });
    await con.query('CREATE DATABASE ' + conf.dbOptions.database);
  }
}
export async function generateConf(
  dbName: string,
  username: string,
  password: string,
  secretPrinter: string,
  secretAdmin: string,
): Promise<ConfigurationI> {
  const keyPrinter = StellarSdk.Keypair.fromSecret(secretPrinter);
  const keyAdmin = StellarSdk.Keypair.fromSecret(secretAdmin);
  // tslint:disable-next-line:no-console
  console.log(
    `Account: public_key=${keyPrinter.publicKey()},\n private_key=${keyPrinter.secret()}`,
  );
  // tslint:disable-next-line:no-console
  console.log(
    `DB: database=${dbName},\n username=${username},\n password=${password}`,
  );
  const conf: ConfigurationI = {
    publicKey: keyPrinter.publicKey(),
    privateKey: keyPrinter.secret(),
    currencyUnits: [
      '1',
      '2',
      '5',
      '10',
      '20',
      '50',
      '100',
      '200',
      'c10',
      'c20',
      'c50',
    ],
    listAdmins: [keyAdmin.publicKey()],
    limitLumens: '100',
    dbOptions: {
      type: 'mysql',
      database: dbName,
      username,
      password,
      port: 3306,
      host: 'localhost',
    },
    port: 3000,
    baseFeeMultiplier: 30,
    enoughLumenForAssetAccount: '10',
    isTest: true,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    stellarTimeout: 1000,
  };
  return conf;
}

export async function createPublicAccount(
  admin: StellarSdk.Keypair,
  app: INestApplication,
): Promise<[StellarSdk.Keypair, OutputAccount]> {
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

  const accResp = await request(app.getHttpServer())
    .post('/api/accounts')
    .send(input);

  if (accResp.status !== 201) {
    throw new Error('The account failed: ' + accResp.text);
  }

  const acc = accResp.body as OutputAccount;
  return [masterKeyPair, acc];
}

export async function transferAmountToAccount(
  admin: StellarSdk.Keypair,
  accAddress: string,
  amounts: AmountI[],
  app: INestApplication,
) {
  const input: InputTransfer = {
    data: {
      requester: admin.publicKey(),
      receiver: accAddress,
      reason: 'send money for fun',
      includeLumens: '11',
      amounts,
      nonce: 'allalal',
      source: 'printer',
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
  if (tranResp.status !== 201) {
    throw new Error('The transfer failed: ' + tranResp.text);
  }
}

export function generateProviders(conf: ConfigurationI): Provider[] {
  return [
    TaxRevenueGateway,
    {
      provide: ConfigService,
      useFactory: async (taxRevenueGateway: TaxRevenueGateway) => {
        const cs = new ConfigService(taxRevenueGateway);
        await generateDB(conf);
        await cs.init(conf);
        return cs;
      },
      inject: [TaxRevenueGateway],
    },
    {
      provide: LoggerService,
      useFactory: async () => {
        return new LoggerService();
      },
    },
    {
      provide: TransfersService,
      useFactory: async (
        loggerService: LoggerService,
        configService: ConfigService,
      ) => {
        return new TransfersService(loggerService, configService);
      },
      inject: [LoggerService, ConfigService],
    },
    {
      provide: DepositsService,
      useFactory: async (
        loggerService: LoggerService,
        configService: ConfigService,
      ) => {
        return new DepositsService(loggerService, configService);
      },
      inject: [LoggerService, ConfigService],
    },
    {
      provide: AccountsService,
      useFactory: async (
        loggerService: LoggerService,
        configService: ConfigService,
      ) => {
        return new AccountsService(loggerService, configService);
      },
      inject: [LoggerService, ConfigService],
    },
    {
      provide: PaymentListenerService,
      useFactory: async (
        configService: ConfigService,
        depositService: DepositsService,
        transactionService: PaymentsService,
        taxService: TaxesService,
        accountService: AccountsService,
      ) => {
        return new PaymentListenerService(
          configService,
          depositService,
          transactionService,
          taxService,
          accountService,
        );
      },
      inject: [
        ConfigService,
        DepositsService,
        PaymentsService,
        TaxesService,
        AccountsService,
      ],
    },
    {
      provide: PaymentsService,
      useFactory: async (
        loggerService: LoggerService,
        configService: ConfigService,
      ) => {
        return new PaymentsService(loggerService, configService);
      },
      inject: [LoggerService, ConfigService],
    },
    {
      provide: TaxesService,
      useFactory: async (
        loggerService: LoggerService,
        configService: ConfigService,
      ) => {
        return new TaxesService(loggerService, configService);
      },
      inject: [LoggerService, ConfigService],
    },
    {
      provide: WithdrawsService,
      useFactory: async (
        loggerService: LoggerService,
        configService: ConfigService,
      ) => {
        return new WithdrawsService(loggerService, configService);
      },
      inject: [LoggerService, ConfigService],
    },
  ];
}

export async function deleteDatabase(conn: Connection, dbName: string) {
  const qr = conn.createQueryRunner();
  await qr.dropDatabase(dbName, true);
}
