import { Controller, Post, Body } from '@nestjs/common';
import * as cvo from '../common/common-validations';
import {
  InputDepositInfoDto,
  OutputDeposit,
} from '../interfaces/deposit.interface';
import { DepositsService } from './deposits.service';
import { LoggerService } from '../logger/logger.service';

@Controller('api/deposits')
export class DepositsController {
  constructor(
    private readonly logger: LoggerService,
    private readonly depositService: DepositsService,
  ) {}
  @Post('/info')
  async getDepositInfo(
    @Body() input: InputDepositInfoDto,
  ): Promise<OutputDeposit> {
    cvo.validatePassword(input.hash, input.password);
    const dep = await this.depositService.getDeposit(input.hash);
    return dep;
  }
}
