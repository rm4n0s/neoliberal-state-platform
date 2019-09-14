import * as cvo from '../common/common-validations';
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import {
  InputTransferDto,
  OutputTransfer,
} from '../interfaces/transfer.interface';
import { AccountsService } from '../accounts/accounts.service';
import { ConfigService } from '../config/config.service';
import { TransfersService } from './transfers.service';
import {
  PaginationI,
  ListPaginatedI,
} from '../interfaces/pagination.interface';
import BigNumber from 'bignumber.js';
import { assetToNumber } from '../common/math';
import { ERROR_TAX_REVENUE_NOT_ENOUGH_FOR_THE_TRANSFER } from '../common/errors';

@Controller('api/transfers')
export class TransfersController {
  constructor(
    private readonly transferService: TransfersService,
    private readonly accountService: AccountsService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async create(
    @Headers('request-id') reqId: string,
    @Body() input: InputTransferDto,
  ): Promise<OutputTransfer> {
    const conf = this.configService.getConf();
    cvo.validateEmptyRequester(input);
    cvo.validateEmptyReceiver(input);
    cvo.validateEmptyReason(input);
    cvo.validateEmptyNonce(input);
    cvo.validateEmptyAmount(input);
    cvo.validateEmptySignature(input);
    cvo.validateEmptyStringifiedData(input);
    cvo.validateRequester(input, conf);
    cvo.validateAmmount(input.data.amounts, conf);
    cvo.validateRequesterSignature(input);
    await cvo.validateSignatureExists(
      this.transferService.signatureExists.bind(this),
      input.signature,
    );

    if (input.data.source === 'taxes') {
      const state = await this.configService.getState();
      let sum = '0';
      for (const amount of input.data.amounts) {
        const assetAmount = new BigNumber(assetToNumber(amount.assetName))
          .multipliedBy(amount.amountNumber)
          .toString();
        sum = new BigNumber(sum).plus(assetAmount).toString();
      }

      if (new BigNumber(state.taxRevenueNumber).lt(sum)) {
        throw ERROR_TAX_REVENUE_NOT_ENOUGH_FOR_THE_TRANSFER;
      }

      await this.configService.minimizeTaxRevenueForState(sum);
    }
    await this.accountService.getAccount(reqId, input.data.receiver);
    await this.transferService.executeTransfer(reqId, input);
    return await this.transferService.saveTransfer(reqId, input);
  }

  @Get()
  async getTransfers(
    @Query() query: PaginationI,
  ): Promise<ListPaginatedI<OutputTransfer>> {
    return await this.transferService.getTransfersByPage(query);
  }

  @Get(':id')
  async getTransfer(@Param('id') id: string): Promise<OutputTransfer> {
    return await this.transferService.getTransfer(id);
  }
}
