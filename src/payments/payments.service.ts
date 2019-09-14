import { v4 as uuid } from 'uuid';
import { Injectable } from '@nestjs/common';
import { OutputPayment, InputPayment } from '../interfaces/payment.interface';
import { Payment, serializePayment } from '../entities/payment.entity';
import { ConfigService } from '../config/config.service';
import { FAILED_TO_SAVE_THE_TRANSACTION_IN_DB } from '../common/errors';
import {
  PaginationI,
  ListPaginatedI,
} from '../interfaces/pagination.interface';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PaymentsService {
  private contextName = PaymentsService.name;
  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  async savePayment(
    reqId: string,
    input: InputPayment,
  ): Promise<OutputPayment> {
    const dbConn = this.configService.getDbConn();
    const dbtr = await dbConn.getRepository(Payment);
    const tr = new Payment();
    tr.uuid = uuid();
    tr.asset = input.asset;
    tr.amountNumber = input.amountNumber;
    tr.blockTrasnactionHash = input.blockTrasnactionHash;
    tr.depositHash = input.depositHash;
    tr.fromAccountKey = input.fromAccountKey;
    tr.accountIsPublic = input.accountIsPublic;
    try {
      const saved = await dbtr.save(tr);
      return serializePayment(saved);
    } catch (e) {
      const err = e as Error;
      this.logger.error(this.contextName, reqId, err.message);
      throw FAILED_TO_SAVE_THE_TRANSACTION_IN_DB;
    }
  }

  async getPaymentsByDepositPaginated(
    depositHash: string,
    pag: PaginationI,
  ): Promise<ListPaginatedI<OutputPayment>> {
    const dbConn = this.configService.getDbConn();
    const db = await dbConn.getRepository(Payment);
    const [trans, totalNumber] = await db.findAndCount({
      skip: pag.page * pag.size,
      take: pag.size,
      order: {
        createdAt: 'DESC',
      },
      where: { depositHash },
    });
    const serialized = trans.map(x => serializePayment(x));
    const res: ListPaginatedI<OutputPayment> = {
      data: serialized,
      totalPages: Math.ceil(totalNumber / pag.size),
      page: pag.page,
      size: pag.size,
      total: totalNumber,
    };
    return res;
  }
}
