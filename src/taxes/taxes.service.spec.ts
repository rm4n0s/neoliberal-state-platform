import { Test, TestingModule } from '@nestjs/testing';
import * as StellarSdk from 'stellar-sdk';
import { TaxesService } from './taxes.service';
import {
  generateStellarAccount,
  generateConf,
  generateProviders,
} from '../test-utils/common-generators';
import { InputTax } from '../interfaces/tax.interface';

describe('TaxesService', () => {
  let service: TaxesService;

  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    const admin = StellarSdk.Keypair.random();
    const conf = await generateConf(
      'TestTaxService',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: generateProviders(conf),
    }).compile();
    service = module.get<TaxesService>(TaxesService);
  });

  test('Test successful tax', async () => {
    const randomPair = StellarSdk.Keypair.random();
    let input: InputTax = {
      data: {
        requester: randomPair.publicKey(),
        taxNumber: '10',
        nonce: '',
      },
      stringifiedData: '',
      signature: '',
    };

    input.stringifiedData = JSON.stringify(input.data);
    input.signature = randomPair
      .sign(Buffer.from(input.stringifiedData))
      .toString('base64');

    let savedTax = await service.saveTax('TaxesService', input);
    expect(savedTax.requester).toEqual(input.data.requester);
    expect(savedTax.taxNumber).toEqual(input.data.taxNumber);

    input = {
      data: {
        requester: randomPair.publicKey(),
        taxNumber: '20',
        nonce: '',
      },
      stringifiedData: '',
      signature: '',
    };

    input.stringifiedData = JSON.stringify(input.data);
    input.signature = randomPair
      .sign(Buffer.from(input.stringifiedData))
      .toString('base64');

    savedTax = await service.saveTax('TaxesService', input);
    expect(savedTax.requester).toEqual(input.data.requester);
    expect(savedTax.taxNumber).toEqual(input.data.taxNumber);

    let taxesPag = await service.getTaxesByPage({ page: 0, size: 2 });
    expect(taxesPag.data[0].taxNumber).toEqual('20');
    expect(taxesPag.data[1].taxNumber).toEqual('10');

    taxesPag = await service.getTaxesByPage({ page: 1, size: 1 });
    expect(taxesPag.data[0].taxNumber).toEqual('10');

    const tax = await service.getTax(taxesPag.data[0].uuid);
    expect(tax.taxNumber).toEqual('10');

    const editTax = await service.maximizeTaxRevenue(
      'TaxesService',
      tax.uuid,
      '1000',
    );
    expect(editTax.taxRevenueNumber).toEqual('1000');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
