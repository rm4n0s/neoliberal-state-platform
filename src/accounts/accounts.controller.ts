import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Param,
  Headers,
} from '@nestjs/common';
import {
  InputAccountDto,
  OutputAccount,
} from '../interfaces/account.interface';
import * as cvo from '../common/common-validations';
import { AccountsService } from './accounts.service';
import { ConfigService } from '../config/config.service';
import { ERROR_THE_SIGNATURE_ALREADY_EXISTS } from '../common/errors';
import { Balance } from 'src/interfaces/balance.interface';
import {
  PaginationI,
  ListPaginatedI,
} from 'src/interfaces/pagination.interface';
import { OutputTransfer } from 'src/interfaces/transfer.interface';
import { LoggerService } from '../logger/logger.service';

@Controller('api/accounts')
export class AccountsController {
  private contextName = AccountsController.name;
  constructor(
    private readonly logger: LoggerService,
    private readonly accountService: AccountsService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async create(
    @Body() input: InputAccountDto,
    @Headers('request-id') reqId: string,
  ): Promise<OutputAccount> {
    const conf = this.configService.getConf();
    cvo.validateEmptyMasterKey(input);
    cvo.validateEmptyName(input);
    cvo.validateEmptyNonce(input);
    cvo.validateEmptySignature(input);
    cvo.validateEmptyStringifiedData(input);
    cvo.validateLumen(input, conf);
    cvo.validateRequester(input, conf);
    cvo.validateRequesterSignature(input);
    const signatureExists = await this.accountService.signatureExists(
      input.signature,
    );
    if (signatureExists) {
      throw ERROR_THE_SIGNATURE_ALREADY_EXISTS;
    }
    const newAddress = await this.accountService.createAccountOnStellar(
      reqId,
      input,
    );
    await this.accountService.trustAssetsOnStellar(reqId, newAddress);
    await this.accountService.changeMasterKeyOnStellar(
      reqId,
      input,
      newAddress,
    );
    const account = await this.accountService.saveAccount(
      reqId,
      input,
      newAddress.publicKey(),
    );
    return account;
  }

  @Get(':address')
  async get(
    @Headers('request-id') reqId: string,
    @Param('address') address: string,
  ): Promise<OutputAccount> {
    return await this.accountService.getAccount(reqId, address);
  }

  @Get(':address/transfers')
  async getTransfers(
    @Param('address') address: string,
    @Query() query: PaginationI,
  ): Promise<ListPaginatedI<OutputTransfer>> {
    return await this.accountService.getTransfersByAccount(address, query);
  }

  @Get(':address/balances')
  async getBalance(@Param('address') address: string): Promise<Balance[]> {
    return await this.accountService.getBalanceFromStellar(address);
  }

  @Get()
  async getAccounts(
    @Headers('request-id') reqId: string,
    @Query() query: PaginationI,
  ): Promise<ListPaginatedI<OutputAccount>> {
    return await this.accountService.getAccountsByPage(query);
  }
}
