import * as StellarSdk from 'stellar-sdk';
import { Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { Account, serializeAccount } from '../entities/account.entity';
import { InputAccount, OutputAccount } from '../interfaces/account.interface';
import {
  FAILED_TO_SAVE_THE_ACCOUNT_IN_DB,
  ERROR_ACCOUNT_NOT_FOUND,
  FAILED_TO_CREATE_ACCOUNT_ON_STELLAR,
  FAILED_TO_TRUST_ASSET_ON_STELLAR,
  FAILED_TO_CHANGE_MASTER_KEY_ON_STELLAR,
} from '../common/errors';
import { Balance } from '../interfaces/balance.interface';
import {
  PaginationI,
  ListPaginatedI,
} from '../interfaces/pagination.interface';
import { OutputTransfer } from '../interfaces/transfer.interface';
import { Transfer, serializeTransfer } from '../entities/transfer.entity';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class AccountsService {
  private contextName = AccountsService.name;
  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   *
   * @param input
   * @param address
   * @throws {FAILED_TO_SAVE_THE_ACCOUNT_IN_DB}
   */
  async saveAccount(
    reqId: string,
    input: InputAccount,
    address: string,
  ): Promise<OutputAccount> {
    const dbConn = this.configService.getDbConn();
    const dbac = await dbConn.getRepository(Account);

    const ac = new Account();
    ac.name = input.data.name;
    ac.address = address;
    ac.requester = input.data.requester;
    ac.signature = input.signature;
    ac.signedData = input.stringifiedData;
    ac.masterKey = input.data.masterKey;
    ac.description = input.data.description;
    try {
      const savedAccount = await dbac.save(ac);
      return serializeAccount(savedAccount);
    } catch (e) {
      const err = e as Error;
      this.logger.error(this.contextName, reqId, err.message);
      throw FAILED_TO_SAVE_THE_ACCOUNT_IN_DB;
    }
  }

  /**
   *
   * @param address
   * @throws {ERROR_ACCOUNT_NOT_FOUND}
   */
  async getAccount(reqId: string, address: string): Promise<OutputAccount> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Account);
    const ac = await db.findOne({ address });
    if (ac === undefined) {
      this.logger.error(
        this.contextName,
        reqId,
        'Account ' + address + ' not found',
      );
      throw ERROR_ACCOUNT_NOT_FOUND;
    }
    return serializeAccount(ac);
  }

  async signatureExists(signature: string): Promise<boolean> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Account);
    const ac = await db.findOne({ signature });
    return ac !== undefined;
  }

  async getAccounts(): Promise<OutputAccount[]> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Account);
    const accs = await db.find();
    return accs.map(acc => serializeAccount(acc));
  }

  async getAccountsByPage(
    pag: PaginationI,
  ): Promise<ListPaginatedI<OutputAccount>> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Account);
    const [accounts, totalNumber] = await db.findAndCount({
      skip: pag.page * pag.size,
      take: pag.size,
      order: {
        createdAt: 'DESC',
      },
    });
    const serialized = accounts.map(x => serializeAccount(x));
    const res: ListPaginatedI<OutputAccount> = {
      data: serialized,
      totalPages: Math.ceil(totalNumber / pag.size),
      page: pag.page,
      size: pag.size,
      total: totalNumber,
    };
    return res;
  }

  async getTransfersByAccount(
    address: string,
    pag: PaginationI,
  ): Promise<ListPaginatedI<OutputTransfer>> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Transfer);
    const [transfers, totalNumber] = await db.findAndCount({
      skip: pag.page * pag.size,
      take: pag.size,
      order: {
        createdAt: 'DESC',
      },
      where: { receiver: address },
      relations: ['amounts'],
    });
    const serialized = transfers.map(x => serializeTransfer(x));
    const res: ListPaginatedI<OutputTransfer> = {
      data: serialized,
      totalPages: Math.ceil(totalNumber / pag.size),
      page: pag.page,
      size: pag.size,
      total: totalNumber,
    };
    return res;
  }

  /**
   *
   * @param input
   * @throws {FAILED_TO_CREATE_ACCOUNT_ON_STELLAR}
   */
  async createAccountOnStellar(
    reqId: string,
    input: InputAccount,
  ): Promise<StellarSdk.Keypair> {
    const conf = this.configService.getConf();
    let networkPassphrase = StellarSdk.Networks.PUBLIC;
    if (conf.isTest) {
      networkPassphrase = StellarSdk.Networks.TESTNET;
    }

    const server = new StellarSdk.Server(conf.horizonUrl);
    const newAddress = StellarSdk.Keypair.random();
    const creator = StellarSdk.Keypair.fromSecret(conf.privateKey);
    const baseFee = this.configService.getBaseFee();
    const issuerAcc = this.configService.issuer;
    // tslint:disable-next-line:no-console
    console.log('Create sequence ', issuerAcc.sequenceNumber());
    this.logger.log(
      this.contextName,
      reqId,
      `Creating a new account ${newAddress.publicKey()}`,
    );
    const transaction = new StellarSdk.TransactionBuilder(issuerAcc, {
      fee: conf.baseFeeMultiplier * baseFee,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.createAccount({
          destination: newAddress.publicKey(),
          startingBalance: input.data.includeLumens,
        }),
      )
      .setTimeout(conf.stellarTimeout);
    const transactionBuild = transaction.build();
    transactionBuild.sign(creator);
    try {
      await server.submitTransaction(transactionBuild);
      this.logger.log(
        this.contextName,
        reqId,
        'The creation of the account was a success.',
      );
    } catch (e) {
      this.logger.error(
        this.contextName,
        reqId,
        FAILED_TO_CREATE_ACCOUNT_ON_STELLAR.message +
          ': ' +
          JSON.stringify(e.response.data.extras),
      );
      throw FAILED_TO_CREATE_ACCOUNT_ON_STELLAR;
    }
    return newAddress;
  }

  /**
   *
   * @param newAddress
   * @throws {FAILED_TO_TRUST_ASSET_ON_STELLAR}
   */
  async trustAssetsOnStellar(reqId: string, newAddress: StellarSdk.Keypair) {
    this.logger.log(
      this.contextName,
      reqId,
      `For the account ${newAddress.publicKey()} trust assets`,
    );
    const conf = this.configService.getConf();
    let networkPassphrase = StellarSdk.Networks.PUBLIC;
    if (conf.isTest) {
      networkPassphrase = StellarSdk.Networks.TESTNET;
    }

    const server = new StellarSdk.Server(conf.horizonUrl);
    const baseFee = await server.fetchBaseFee();
    const issuerAcc = await server.loadAccount(newAddress.publicKey());
    let transaction = new StellarSdk.TransactionBuilder(issuerAcc, {
      fee: conf.baseFeeMultiplier * baseFee,
      networkPassphrase,
    });
    for (const assetName of conf.currencyUnits) {
      const asset = new StellarSdk.Asset(assetName, conf.publicKey);
      transaction = transaction.addOperation(
        StellarSdk.Operation.changeTrust({
          asset,
        }),
      );
    }
    const transactionBuild = transaction
      .setTimeout(conf.stellarTimeout)
      .build();
    transactionBuild.sign(newAddress);
    try {
      await server.submitTransaction(transactionBuild);
      this.logger.log(this.contextName, reqId, 'The trust was a success.');
    } catch (e) {
      this.logger.error(
        this.contextName,
        reqId,
        FAILED_TO_TRUST_ASSET_ON_STELLAR.message +
          ': ' +
          JSON.stringify(e.response.data.extras),
      );
      throw FAILED_TO_TRUST_ASSET_ON_STELLAR;
    }
  }

  /**
   *
   * @param input
   * @param newAddress
   * @throws {FAILED_TO_CHANGE_MASTER_KEY_ON_STELLAR}
   */
  async changeMasterKeyOnStellar(
    reqId: string,
    input: InputAccount,
    newAddress: StellarSdk.Keypair,
  ) {
    this.logger.log(
      this.contextName,
      reqId,
      `For the account ${newAddress.publicKey()} change master key to ${
        input.data.masterKey
      }`,
    );
    const conf = this.configService.getConf();
    let networkPassphrase = StellarSdk.Networks.PUBLIC;
    if (conf.isTest) {
      networkPassphrase = StellarSdk.Networks.TESTNET;
    }

    const server = new StellarSdk.Server(conf.horizonUrl);
    const baseFee = await server.fetchBaseFee();
    const issuerAcc = await server.loadAccount(newAddress.publicKey());
    const transaction = new StellarSdk.TransactionBuilder(issuerAcc, {
      fee: conf.baseFeeMultiplier * baseFee,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.setOptions({
          signer: {
            ed25519PublicKey: input.data.masterKey,
            weight: 1,
          },
        }),
      )
      .addOperation(
        StellarSdk.Operation.setOptions({
          masterWeight: 0, // set master key weight to 0 so the first user is disabled
          lowThreshold: 1,
          medThreshold: 1,
          highThreshold: 1,
        }),
      );
    const transactionBuild = transaction
      .setTimeout(conf.stellarTimeout)
      .build();
    transactionBuild.sign(newAddress);
    try {
      await server.submitTransaction(transactionBuild);
      this.logger.log(
        this.contextName,
        reqId,
        'The master key change was a success.',
      );
    } catch (e) {
      this.logger.error(
        this.contextName,
        reqId,
        FAILED_TO_CHANGE_MASTER_KEY_ON_STELLAR.message +
          ': ' +
          JSON.stringify(e.response.data.extras),
      );
      throw FAILED_TO_CHANGE_MASTER_KEY_ON_STELLAR;
    }
  }

  async getBalanceFromStellar(address: string): Promise<Balance[]> {
    const conf = this.configService.getConf();
    const server = new StellarSdk.Server(conf.horizonUrl);
    const account = await server.loadAccount(address);
    return account.balances.map(balance => {
      const b = balance as { balance: string; asset_code?: string };
      return {
        asset: b.asset_code === undefined ? 'lumen' : b.asset_code,
        balanceNumber: b.balance,
      };
    });
  }
}
