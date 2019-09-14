import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Headers,
} from '@nestjs/common';
import * as cvo from '../common/common-validations';
import { TaxesService } from './taxes.service';
import { ConfigService } from '../config/config.service';
import { InputTaxDto, OutputTax } from '../interfaces/tax.interface';
import { ERROR_THE_SIGNATURE_ALREADY_EXISTS } from '../common/errors';
import {
  PaginationI,
  ListPaginatedI,
} from '../interfaces/pagination.interface';

@Controller('api/taxes')
export class TaxesController {
  constructor(
    private readonly taxService: TaxesService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async create(
    @Headers('request-id') reqId: string,
    @Body() input: InputTaxDto,
  ): Promise<OutputTax> {
    const conf = this.configService.getConf();
    cvo.validateEmptySignature(input);
    cvo.validateEmptyNonce(input);
    cvo.validateEmptyStringifiedData(input);
    cvo.validateRequester(input, conf);
    cvo.validateRequesterSignature(input);

    const signatureExists = await this.taxService.signatureExists(
      input.signature,
    );
    if (signatureExists) {
      throw ERROR_THE_SIGNATURE_ALREADY_EXISTS;
    }

    return await this.taxService.saveTax(reqId, input);
  }

  @Get()
  async getTaxes(
    @Query() query: PaginationI,
  ): Promise<ListPaginatedI<OutputTax>> {
    return await this.taxService.getTaxesByPage(query);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<OutputTax> {
    return await this.taxService.getTax(id);
  }
}
