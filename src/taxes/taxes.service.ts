import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ConfigService } from '../config/config.service';
import { InputTax, OutputTax } from '../interfaces/tax.interface';
import { Tax, serializeTax } from '../entities/tax.entity';
import {
  FAILED_TO_ADD_TAX_IN_DB,
  ERROR_TAX_NOT_FOUND,
  FAILED_EDIT_TAX_IN_DB,
} from '../common/errors';
import {
  PaginationI,
  ListPaginatedI,
} from '../interfaces/pagination.interface';
import { LoggerService } from '../logger/logger.service';
import BigNumber from 'bignumber.js';

@Injectable()
export class TaxesService {
  private contextName = TaxesService.name;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  async saveTax(reqId: string, input: InputTax): Promise<OutputTax> {
    const dbConn = this.configService.getDbConn();
    const dbtr = await dbConn.getRepository(Tax);
    const tax = new Tax();
    tax.uuid = uuid();
    tax.requester = input.data.requester;
    tax.taxNumber = input.data.taxNumber;
    tax.taxRevenueNumber = '0';
    tax.signature = input.signature;
    tax.stringifiedData = input.stringifiedData;
    try {
      const saved = await dbtr.save(tax);
      return serializeTax(saved);
    } catch (e) {
      const err = e as Error;
      this.logger.error(this.contextName, reqId, err.message);
      throw FAILED_TO_ADD_TAX_IN_DB;
    }
  }

  async getTaxesByPage(pag: PaginationI): Promise<ListPaginatedI<OutputTax>> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Tax);
    const [dps, totalNumber] = await db.findAndCount({
      skip: pag.page * pag.size,
      take: pag.size,
      order: {
        createdAt: 'DESC',
      },
    });
    const serialized = dps.map(x => serializeTax(x));
    const res: ListPaginatedI<OutputTax> = {
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
   * @param id
   * @throws {ERROR_TAX_NOT_FOUND}
   */
  async getTax(id: string): Promise<OutputTax> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Tax);
    const d = await db.findOne(id);
    if (d === undefined) {
      throw ERROR_TAX_NOT_FOUND;
    }
    return serializeTax(d);
  }

  async signatureExists(signature: string): Promise<boolean> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Tax);
    const ac = await db.findOne({ signature });
    return ac !== undefined;
  }

  async maximizeTaxRevenue(
    reqId: string,
    id: string,
    taxRevenueNumber: string,
  ): Promise<OutputTax> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Tax);
    const tax = await db.findOne(id);
    if (tax === undefined) {
      throw ERROR_TAX_NOT_FOUND;
    }
    tax.taxRevenueNumber = new BigNumber(tax.taxRevenueNumber)
      .plus(taxRevenueNumber)
      .toString();
    try {
      const res = await db.save(tax);
      return serializeTax(res);
    } catch (e) {
      const err = e as Error;
      this.logger.error(this.contextName, reqId, err.message);
      throw FAILED_EDIT_TAX_IN_DB;
    }
  }
}
