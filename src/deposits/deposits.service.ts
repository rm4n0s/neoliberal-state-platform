import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { Deposit, serializeDeposit } from '../entities/deposit.entity';
import {
  FAILED_TO_ADD_DEPOSIT,
  ERROR_DEPOSIT_NOT_FOUND,
  FAILED_TO_EDIT_DEPOSIT,
  FAILED_TO_ADD_DEPOSIT_EXISTS_ALREADY,
} from '../common/errors';
import {
  PaginationI,
  ListPaginatedI,
} from '../interfaces/pagination.interface';
import { OutputDeposit } from '../interfaces/deposit.interface';
import { LoggerService } from '../logger/logger.service';
@Injectable()
export class DepositsService {
  private contextName = DepositsService.name;
  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   *
   * @param input
   * @throws {FAILED_TO_ADD_DEPOSIT}
   */
  async saveDeposit(reqId: string, input: string): Promise<OutputDeposit> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Deposit);
    const de = new Deposit();
    de.hash = input;
    de.taxedNumber = '0';
    de.totalNumber = '0';
    de.untaxedNumber = '0';
    de.withdraws = [];
    try {
      const res = await db.save(de);
      return serializeDeposit(res);
    } catch (e) {
      const err = e as Error;
      this.logger.error(this.contextName, reqId, err.message);
      if (err.message.includes('ER_DUP_ENTRY')) {
        throw FAILED_TO_ADD_DEPOSIT_EXISTS_ALREADY;
      }
      throw FAILED_TO_ADD_DEPOSIT;
    }
  }

  async editDepositNumbers(
    reqId: string,
    hash: string,
    taxedNumber: string,
    totalNumber: string,
    untaxedNumber: string,
  ): Promise<OutputDeposit> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Deposit);
    const d = await db.findOne(hash);
    if (d === undefined) {
      throw ERROR_DEPOSIT_NOT_FOUND;
    }

    d.taxedNumber = taxedNumber;
    d.totalNumber = totalNumber;
    d.untaxedNumber = untaxedNumber;
    try {
      const res = await db.save(d);
      return serializeDeposit(res);
    } catch (e) {
      const err = e as Error;
      this.logger.error(this.contextName, reqId, err.message);
      throw FAILED_TO_EDIT_DEPOSIT;
    }
  }

  async getDepositsByPage(
    pag: PaginationI,
  ): Promise<ListPaginatedI<OutputDeposit>> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Deposit);
    const [dps, totalNumber] = await db.findAndCount({
      skip: pag.page * pag.size,
      take: pag.size,
      order: {
        createdAt: 'DESC',
      },
      relations: ['withdraws'],
    });
    const serialized = dps.map(x => serializeDeposit(x));
    const res: ListPaginatedI<OutputDeposit> = {
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
   * @param hash
   * @throws {ERROR_DEPOSIT_NOT_FOUND}
   */
  async getDeposit(hash: string): Promise<OutputDeposit> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Deposit);
    const d = await db.findOne(hash, {
      relations: ['withdraws'],
    });
    if (d === undefined) {
      throw ERROR_DEPOSIT_NOT_FOUND;
    }
    return serializeDeposit(d);
  }
}
