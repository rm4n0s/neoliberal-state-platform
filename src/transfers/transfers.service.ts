import * as StellarSdk from 'stellar-sdk';
import { BigNumber } from 'bignumber.js';
import { v4 as uuid } from 'uuid';
import { Injectable } from '@nestjs/common';
import {
  InputTransfer,
  OutputTransfer,
} from '../interfaces/transfer.interface';
import { Transfer, serializeTransfer } from '../entities/transfer.entity';
import {
  FAILED_TO_SAVE_THE_TRANSFER_IN_DB,
  ERROR_TRANSFER_NOT_FOUND,
  FAILED_THE_TRANSACTION_ON_STELLAR,
} from '../common/errors';
import { Amount } from '../entities/amount.entity';
import { ConfigService } from '../config/config.service';
import {
  PaginationI,
  ListPaginatedI,
} from '../interfaces/pagination.interface';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class TransfersService {
  private contextName = TransfersService.name;
  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   *
   * @param input
   * @throws {FAILED_TO_SAVE_THE_TRANSFER_IN_DB}
   */
  async saveTransfer(
    reqId: string,
    input: InputTransfer,
  ): Promise<OutputTransfer> {
    const dbConn = this.configService.getDbConn();
    const dbtr = await dbConn.getRepository(Transfer);
    const dbam = await dbConn.getRepository(Amount);

    const tr = new Transfer();
    tr.uuid = uuid();
    tr.includedLumens = input.data.includeLumens;
    tr.reason = input.data.reason;
    tr.receiver = input.data.receiver;
    tr.requester = input.data.requester;
    tr.signature = input.signature;
    tr.signedData = input.stringifiedData;
    tr.source = input.data.source;
    try {
      tr.amounts = [];
      for (const amount of input.data.amounts) {
        const am = new Amount();
        am.uuid = uuid();
        am.assetName = amount.assetName;
        am.amountNumber = amount.amountNumber;
        const savedAm = await dbam.save(am);
        tr.amounts.push(savedAm);
      }

      const savedTransfer = await dbtr.save(tr);
      return serializeTransfer(savedTransfer);
    } catch (e) {
      const err = e as Error;
      this.logger.error(this.contextName, reqId, err.message);
      throw FAILED_TO_SAVE_THE_TRANSFER_IN_DB;
    }
  }

  /**
   *
   * @param id
   * @throws {ERROR_TRANSFER_NOT_FOUND}
   */
  async getTransfer(id: string): Promise<OutputTransfer> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Transfer);
    const tr = await db.findOne(id, {
      relations: ['amounts'],
    });
    if (tr === undefined) {
      throw ERROR_TRANSFER_NOT_FOUND;
    }
    return serializeTransfer(tr);
  }

  async getTransfers(): Promise<OutputTransfer[]> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Transfer);
    const transfers = await db.find();
    return transfers.map(x => serializeTransfer(x));
  }

  async getTransfersByPage(
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

  async signatureExists(signature: string): Promise<boolean> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Transfer);
    const ac = await db.findOne({ signature });
    return ac !== undefined;
  }

  /**
   *
   * @param input
   * @throws {FAILED_THE_TRANSACTION_ON_STELLAR}
   */
  async executeTransfer(reqId: string, input: InputTransfer) {
    const conf = this.configService.getConf();
    let networkPassphrase = StellarSdk.Networks.PUBLIC;
    if (conf.isTest) {
      networkPassphrase = StellarSdk.Networks.TESTNET;
    }

    const server = new StellarSdk.Server(conf.horizonUrl);
    const sender = StellarSdk.Keypair.fromSecret(conf.privateKey);
    const baseFee = this.configService.getBaseFee();
    const issuerAcc = this.configService.issuer;
    let transactionBuilder = new StellarSdk.TransactionBuilder(issuerAcc, {
      fee: conf.baseFeeMultiplier * baseFee,
      networkPassphrase,
    });
    for (const amount of input.data.amounts) {
      const asset = new StellarSdk.Asset(amount.assetName, conf.publicKey);
      transactionBuilder = transactionBuilder.addOperation(
        StellarSdk.Operation.payment({
          destination: input.data.receiver,
          asset,
          amount: amount.amountNumber,
        }),
      );
    }
    if (new BigNumber(input.data.includeLumens).gt(0)) {
      transactionBuilder = transactionBuilder.addOperation(
        StellarSdk.Operation.payment({
          destination: input.data.receiver,
          asset: StellarSdk.Asset.native(),
          amount: input.data.includeLumens,
        }),
      );
    }
    const transaction = transactionBuilder
      .setTimeout(conf.stellarTimeout)
      .build();

    transaction.sign(sender);
    try {
      await server.submitTransaction(transaction);
      this.logger.log(
        this.contextName,
        reqId,
        `Transfering money to the state address ${input.data.receiver}`,
      );
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
