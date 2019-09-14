import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as StellarSdk from 'stellar-sdk';
import { ConfigurationI } from '../interfaces/config.interface';
import {
  Connection,
  ConnectionOptions,
  createConnection,
  EntitySchema,
  Table,
} from 'typeorm';
import { Transfer } from '../entities/transfer.entity';
import { Account } from '../entities/account.entity';
import { Amount } from '../entities/amount.entity';
import { Deposit } from '../entities/deposit.entity';
import { Withdraw } from '../entities/withdraw.entity';
import { Tax } from '../entities/tax.entity';
import { Payment } from '../entities/payment.entity';
import { State, serializeState } from '../entities/state.entity';
import { OutputState } from '../interfaces/state.interface';
import {
  ERROR_FAILED_TO_ADD_STATE_IN_DB,
  ERROR_MISSING_STATE_IN_DB,
} from '../common/errors';
import BigNumber from 'bignumber.js';
import { TaxRevenueGateway } from './tax-revenue.gateway';

@Injectable()
export class ConfigService {
  private conf?: ConfigurationI;
  private dbConn?: Connection;
  private baseFee: number;
  public issuer: StellarSdk.AccountResponse;
  constructor(private taxRevenueGateway: TaxRevenueGateway) {}
  async initStellarIssuer() {
    const server = new StellarSdk.Server(this.getConf().horizonUrl);
    const creator = StellarSdk.Keypair.fromSecret(this.getConf().privateKey);
    this.baseFee = await server.fetchBaseFee();
    this.issuer = await server.loadAccount(creator.publicKey());
  }
  getBaseFee() {
    return this.baseFee;
  }
  async init(input: string | ConfigurationI): Promise<Connection> {
    if (typeof input === 'string') {
      const config = fs.readFileSync(input);
      this.conf = JSON.parse(config.toString());
    } else {
      this.conf = input;
    }
    const entities = [
      Transfer,
      Account,
      Amount,
      Deposit,
      Withdraw,
      Payment,
      Tax,
      State,
    ];
    let dbConf: ConnectionOptions;
    if (this.conf.dbOptions.type === 'sqlite') {
      dbConf = {
        type: 'sqlite',
        database: this.conf.dbOptions.database,
        synchronize: true,
        entities,
        // logging: true,
        // logger: 'simple-console',
      };
    }

    if (this.conf.dbOptions.type === 'postgres') {
      const { username, password, host, database, port } = this.conf.dbOptions;
      dbConf = {
        type: 'postgres',
        database,
        username,
        password,
        host,
        port,
        entities,
      };
    }

    if (this.conf.dbOptions.type === 'mysql') {
      const { username, password, host, database, port } = this.conf.dbOptions;
      dbConf = {
        type: 'mysql',
        database,
        username,
        password,
        host,
        port,
        entities,
      };
    }
    this.dbConn = await createConnection(dbConf);
    for (const entity of entities) {
      await this.createTable(entity);
    }
    const db = await this.dbConn.getRepository(State);
    const states = await db.find();
    if (states.length === 0) {
      const state = new State();
      state.taxRevenueNumber = '0';
      const newState = await db.save(state);
      if (newState === undefined) {
        throw ERROR_FAILED_TO_ADD_STATE_IN_DB;
      }
    }
    await this.initStellarIssuer();
    return this.dbConn;
  }

  // tslint:disable-next-line:ban-types
  private async createTable(entity: Function | EntitySchema<any> | string) {
    const qr = this.dbConn.createQueryRunner();
    const table = this.getTable(entity);
    const has = await qr.hasTable(table);
    if (!has) {
      await qr.createTable(table);
    }
  }

  // tslint:disable-next-line:ban-types
  private getTable(entity: Function | EntitySchema<any> | string): Table {
    const md = this.dbConn.getMetadata(entity);
    const newTable = Table.create(md, this.dbConn.driver);
    return newTable;
  }
  getConf(): ConfigurationI {
    return this.conf;
  }

  getDbConn(): Connection {
    return this.dbConn;
  }

  async maximizeTaxRevenueForState(
    taxRevenueNumber: string,
  ): Promise<OutputState> {
    const db = await this.dbConn.getRepository(State);
    const states = await db.find();
    if (states.length === 0) {
      throw ERROR_MISSING_STATE_IN_DB;
    }
    const state = states[0];
    state.taxRevenueNumber = new BigNumber(state.taxRevenueNumber)
      .plus(taxRevenueNumber)
      .toString();
    const editedState = await db.save(state);
    this.taxRevenueGateway.sendNewTaxRevenue(state.taxRevenueNumber);
    return serializeState(editedState);
  }

  async minimizeTaxRevenueForState(
    taxRevenueNumber: string,
  ): Promise<OutputState> {
    const db = await this.dbConn.getRepository(State);
    const states = await db.find();
    if (states.length === 0) {
      throw ERROR_MISSING_STATE_IN_DB;
    }
    const state = states[0];
    state.taxRevenueNumber = new BigNumber(state.taxRevenueNumber)
      .minus(taxRevenueNumber)
      .toString();
    const editedState = await db.save(state);
    this.taxRevenueGateway.sendNewTaxRevenue(state.taxRevenueNumber);
    return serializeState(editedState);
  }

  async getState(): Promise<OutputState> {
    const db = await this.dbConn.getRepository(State);
    const states = await db.find();
    if (states.length === 0) {
      throw ERROR_MISSING_STATE_IN_DB;
    }
    const state = states[0];
    return serializeState(state);
  }
}
