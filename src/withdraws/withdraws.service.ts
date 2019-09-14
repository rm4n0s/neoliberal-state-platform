import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { BigNumber } from 'bignumber.js';
import * as StellarSdk from 'stellar-sdk';
import { ConfigService } from '../config/config.service';
import {
  InputWithdraw,
  OutputWithdraw,
  ToSaveWithdraw,
} from '../interfaces/withdraw.interface';
import { Withdraw, serializeWithdraw } from '../entities/withdraw.entity';
import {
  FAILED_TO_SAVE_THE_WITHDRAW_IN_DB,
  FAILED_TO_CREATE_ACCOUNT_ON_STELLAR,
  FAILED_TO_TRUST_ASSET_ON_STELLAR,
  FAILED_TO_CHANGE_MASTER_KEY_ON_STELLAR,
  FAILED_THE_TRANSACTION_ON_STELLAR,
} from '../common/errors';
import { multipleAssetToValue } from '../common/math';
import { LoggerService } from '../logger/logger.service';
import { InputAsset } from '../interfaces/asset.interface';

@Injectable()
export class WithdrawsService {
  private contextName = WithdrawsService.name;
  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  async saveWithdraw(
    reqId: string,
    input: ToSaveWithdraw,
    amountNumber: string,
    taxReceivedNumber: string,
    totalNumber: string,
  ): Promise<OutputWithdraw> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Withdraw);
    const w = new Withdraw();
    w.uuid = uuid();
    w.totalNumber = totalNumber;
    w.taxReceivedNumber = taxReceivedNumber;
    w.totalNumber = totalNumber;
    w.amountNumber = amountNumber;
    w.depositHash = input.depositHash;
    w.assetsJSON = JSON.stringify(input.assets);
    try {
      const saved = await db.save(w);
      return serializeWithdraw(saved);
    } catch (e) {
      const err = e as Error;
      this.logger.error(this.contextName, reqId, err.message);
      throw FAILED_TO_SAVE_THE_WITHDRAW_IN_DB;
    }
  }

  async getWithdraws(hash: string): Promise<OutputWithdraw[]> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Withdraw);
    const ws = await db.find({
      where: { depositHash: hash },
      order: { createdAt: 'DESC' },
    });
    const withdraws: OutputWithdraw[] = [];
    for (const w of ws) {
      withdraws.push(serializeWithdraw(w));
    }
    return withdraws;
  }

  totalAssetsAmount(assets: InputAsset[]): string {
    let res = '0';
    for (const asset of assets) {
      const num = multipleAssetToValue(asset.assetName, asset.amountNumber);
      res = new BigNumber(res).plus(num).toString();
    }
    return res;
  }

  async createAccountForAssetOnStellar(
    reqId: string,
    asset: InputAsset,
  ): Promise<StellarSdk.Keypair> {
    const conf = this.configService.getConf();
    let networkPassphrase = StellarSdk.Networks.PUBLIC;
    if (conf.isTest) {
      networkPassphrase = StellarSdk.Networks.TESTNET;
    }

    const server = new StellarSdk.Server(conf.horizonUrl);
    const creator = StellarSdk.Keypair.fromSecret(conf.privateKey);
    const baseFee = this.configService.getBaseFee();
    const issuerAcc = this.configService.issuer;
    const newAddress = StellarSdk.Keypair.random();

    this.logger.log(
      this.contextName,
      reqId,
      `Creating a new account ${newAddress.publicKey()} ` +
        `for asset ${asset.assetName} ` +
        `with master key ${asset.masterKey} ` +
        `and amount ${asset.amountNumber}`,
    );

    // enough balance for the users to transact in the future based on the amount
    const enoughBalance = conf.enoughLumenForAssetAccount;
    const transaction = new StellarSdk.TransactionBuilder(issuerAcc, {
      fee: conf.baseFeeMultiplier * baseFee,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.createAccount({
          destination: newAddress.publicKey(),
          startingBalance: enoughBalance,
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
        FAILED_TO_CREATE_ACCOUNT_ON_STELLAR.message + ': ' + JSON.stringify(e),
      );
      throw FAILED_TO_CREATE_ACCOUNT_ON_STELLAR;
    }
    return newAddress;
  }

  async trustAssetOnStellar(
    reqId: string,
    asset: InputAsset,
    address: StellarSdk.Keypair,
  ) {
    this.logger.log(
      this.contextName,
      reqId,
      `For the account ${address.publicKey()} trust asset ${asset.assetName}`,
    );
    const conf = this.configService.getConf();
    let networkPassphrase = StellarSdk.Networks.PUBLIC;
    if (conf.isTest) {
      networkPassphrase = StellarSdk.Networks.TESTNET;
    }

    const server = new StellarSdk.Server(conf.horizonUrl);
    const baseFee = await server.fetchBaseFee();
    const issuerAcc = await server.loadAccount(address.publicKey());
    const assetStellar = new StellarSdk.Asset(asset.assetName, conf.publicKey);

    const transaction = new StellarSdk.TransactionBuilder(issuerAcc, {
      fee: conf.baseFeeMultiplier * baseFee,
      networkPassphrase,
    }).addOperation(
      StellarSdk.Operation.changeTrust({
        asset: assetStellar,
      }),
    );

    const transactionBuild = transaction
      .setTimeout(conf.stellarTimeout)
      .build();
    transactionBuild.sign(address);
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

  async changeMasterKeyOnStellar(
    reqId: string,
    asset: InputAsset,
    address: StellarSdk.Keypair,
  ) {
    this.logger.log(
      this.contextName,
      reqId,
      `For the account ${address.publicKey()} change master key to ${
        asset.masterKey
      }`,
    );
    const conf = this.configService.getConf();
    let networkPassphrase = StellarSdk.Networks.PUBLIC;
    if (conf.isTest) {
      networkPassphrase = StellarSdk.Networks.TESTNET;
    }

    const server = new StellarSdk.Server(conf.horizonUrl);
    const baseFee = await server.fetchBaseFee();
    const issuerAcc = await server.loadAccount(address.publicKey());
    const transaction = new StellarSdk.TransactionBuilder(issuerAcc, {
      fee: conf.baseFeeMultiplier * baseFee,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.setOptions({
          signer: {
            ed25519PublicKey: asset.masterKey,
            weight: 1,
          },
        }),
      )
      .addOperation(
        StellarSdk.Operation.setOptions({
          masterWeight: 0, // set master key weight to 0 so the user's key is the only owner
          lowThreshold: 1,
          medThreshold: 1,
          highThreshold: 1,
        }),
      );
    const transactionBuild = transaction
      .setTimeout(conf.stellarTimeout)
      .build();
    transactionBuild.sign(address);
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

  async transferAssetToAccountOnStellar(
    reqId: string,
    asset: InputAsset,
    address: StellarSdk.Keypair,
  ) {
    const conf = this.configService.getConf();
    let networkPassphrase = StellarSdk.Networks.PUBLIC;
    if (conf.isTest) {
      networkPassphrase = StellarSdk.Networks.TESTNET;
    }

    const server = new StellarSdk.Server(conf.horizonUrl);
    const sender = StellarSdk.Keypair.fromSecret(conf.privateKey);
    const baseFee = this.configService.getBaseFee();
    const issuerAcc = this.configService.issuer;
    const assetStellar = new StellarSdk.Asset(asset.assetName, conf.publicKey);
    const transactionBuilder = new StellarSdk.TransactionBuilder(issuerAcc, {
      fee: conf.baseFeeMultiplier * baseFee,
      networkPassphrase,
    }).addOperation(
      StellarSdk.Operation.payment({
        destination: address.publicKey(),
        asset: assetStellar,
        amount: asset.amountNumber,
      }),
    );
    const transaction = transactionBuilder
      .setTimeout(conf.stellarTimeout)
      .build();

    transaction.sign(sender);
    try {
      await server.submitTransaction(transaction);
    } catch (e) {
      this.logger.error(
        this.contextName,
        reqId,
        FAILED_THE_TRANSACTION_ON_STELLAR.message +
          ': ' +
          JSON.stringify(e.response.data.extras),
      );
      throw FAILED_THE_TRANSACTION_ON_STELLAR;
    }
  }
}
