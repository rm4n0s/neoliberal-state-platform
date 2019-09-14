import * as StellarSdk from 'stellar-sdk';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import {
  generateStellarAccount,
  generateConf,
  generateProviders,
} from '../test-utils/common-generators';
import { InputPayment } from '../interfaces/payment.interface';
import { AccountsService } from '../accounts/accounts.service';
import { InputAccount } from '../interfaces/account.interface';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let accountService: AccountsService;

  beforeAll(async () => {
    const printerSecret = await generateStellarAccount();
    const admin = StellarSdk.Keypair.random();
    const conf = await generateConf(
      'TestPaymentService',
      'root',
      'Test',
      printerSecret,
      admin.secret(),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: generateProviders(conf),
    }).compile();

    accountService = module.get<AccountsService>(AccountsService);
    service = module.get<PaymentsService>(PaymentsService);
  });

  test('successful input in the DB', async done => {
    const input: InputPayment = {
      depositHash: 'hahhahahahhahah',
      asset: '1',
      amountNumber: '2',
      fromAccountKey: 'accountKeytest',
      accountIsPublic: false,
      blockTrasnactionHash: 'blockhash',
    };
    const tr = await service.savePayment('PaymentService', input);
    expect(tr.accountIsPublic).toEqual(false);
    const pageTrs = await service.getPaymentsByDepositPaginated(
      input.depositHash,
      {
        page: 0,
        size: 1,
      },
    );
    expect(pageTrs.data).toEqual([tr]);

    const randomPair = StellarSdk.Keypair.random();
    const newAcc: InputAccount = {
      data: {
        requester: randomPair.publicKey(),
        masterKey: randomPair.publicKey(),
        name: 'Police',
        includeLumens: '11',
        nonce: 'allalal',
        description: '',
      },
      stringifiedData: '',
      signature: '',
    };

    newAcc.stringifiedData = JSON.stringify(newAcc.data);
    newAcc.signature = randomPair
      .sign(Buffer.from(newAcc.stringifiedData))
      .toString('base64');

    const ac = await accountService.saveAccount(
      'PaymentService',
      newAcc,
      randomPair.publicKey(),
    );

    const input2: InputPayment = {
      depositHash: 'hahhahahahhahah',
      asset: '1',
      amountNumber: '2',
      accountIsPublic: true,
      fromAccountKey: randomPair.publicKey(),
      blockTrasnactionHash: 'blockhash',
    };
    const tr2 = await service.savePayment('PaymentService', input2);
    expect(tr2.accountIsPublic).toEqual(true);

    const pageTrs2 = await service.getPaymentsByDepositPaginated(
      input.depositHash,
      {
        page: 0,
        size: 1,
      },
    );
    expect(pageTrs2.data).toEqual([tr2]);

    const pageTrs3 = await service.getPaymentsByDepositPaginated(
      input.depositHash,
      {
        page: 0,
        size: 2,
      },
    );
    expect(pageTrs3.data).toEqual([tr2, tr]);
    done();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
