import * as StellarSdk from 'stellar-sdk';
import { BigNumber } from 'bignumber.js';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { StellarPayment } from '../interfaces/payment.interface';
import { PaymentsService } from '../payments/payments.service';
import { DepositsService } from '../deposits/deposits.service';
import { AccountsService } from '../accounts/accounts.service';
import { InputPayment } from '../interfaces/payment.interface';
import {
  ERROR_ACCOUNT_NOT_FOUND,
  ERROR_DEPOSIT_NOT_FOUND,
  FAILED_TO_ADD_DEPOSIT_EXISTS_ALREADY,
} from '../common/errors';
import { OutputDeposit } from '../interfaces/deposit.interface';
import { multipleAssetToValue } from '../common/math';
import { TaxesService } from '../taxes/taxes.service';
import { source, map, control, filter, Source } from '@connectv/core';

@Injectable()
export class PaymentListenerService {
  private logger: Logger = new Logger(PaymentListenerService.name);
  private depositHashes: string[] = [];
  private paymentPipe: Source;
  constructor(
    private readonly configService: ConfigService,
    private readonly depositService: DepositsService,
    private readonly paymentService: PaymentsService,
    private readonly taxService: TaxesService,
    private readonly accountService: AccountsService,
  ) {
    const conf = this.configService.getConf();
    this.paymentPipe = source();
    const savingPayment = map(async (payments, done) => {
      for (const payment of payments) {
        await this.applyPayment(payment);
      }
      done('');
    });
    const filterStellarMessageByPublicKey = filter(
      message =>
        // only transactions for the state
        message.to === conf.publicKey &&
        // asset code to be in the list of assets
        conf.currencyUnits.includes(message.asset_code) &&
        // asset 's issuer to be the state only
        conf.publicKey === message.asset_issuer,
    );
    const mapMessageToStellarPayment = map((message, done) => {
      message.transaction().then(tr => {
        const buf = Buffer.from(tr.memo, 'base64');
        const payment: StellarPayment = {
          from: message.from,
          to: message.to,
          hash: buf.toString('hex'),
          transaction_hash: message.transaction_hash,
          asset_code: message.asset_code,
          asset_issuer: message.asset_issuer,
          amount: message.amount,
        };

        done(payment);
      });
    });
    this.paymentPipe
      .to(filterStellarMessageByPublicKey)
      .to(mapMessageToStellarPayment)
      .to(control())
      .to(savingPayment)
      .to(control())
      .subscribe(
        () => this.logger.log('submitted payment'),
        err => this.logger.error(err),
      );

    this.startTransactionListener();
  }

  startTransactionListener() {
    // tslint:disable-next-line:no-console
    console.log('Starting transaction listener');
    const conf = this.configService.getConf();
    const server = new StellarSdk.Server(conf.horizonUrl);
    const self = this;
    server
      .payments()
      .cursor('now')
      .stream({
        onmessage(message: any) {
          self.paymentPipe.send(message);
        },
      });
  }

  async applyPayment(payment: StellarPayment) {
    const input: InputPayment = {
      fromAccountKey: payment.from,
      blockTrasnactionHash: payment.transaction_hash,
      asset: payment.asset_code,
      amountNumber: payment.amount,
      depositHash: payment.hash,
      accountIsPublic: true,
    };

    try {
      await this.accountService.getAccount(
        'PaymentListenerService',
        input.fromAccountKey,
      );
    } catch (e) {
      if (e === ERROR_ACCOUNT_NOT_FOUND) {
        input.accountIsPublic = false;
      }
    }
    let deposit: OutputDeposit;
    try {
      deposit = await this.depositService.getDeposit(input.depositHash);
    } catch (e) {
      if (e === ERROR_DEPOSIT_NOT_FOUND) {
        if (!this.depositHashes.includes(input.depositHash)) {
          this.depositHashes.push(input.depositHash);
          try {
            deposit = await this.depositService.saveDeposit(
              'PaymentListenerService',
              input.depositHash,
            );
          } catch (e) {
            this.logger.error(`Payment listener error failed to save: ${e}`);
            if (e === FAILED_TO_ADD_DEPOSIT_EXISTS_ALREADY) {
              try {
                deposit = await this.depositService.getDeposit(
                  input.depositHash,
                );
              } catch (e) {
                this.logger.error(
                  `Payment listener error failed to find: ${e}`,
                );
              }
            }
          }
          this.logger.log('Created deposit ' + input.depositHash);
        }
      }
    }

    await this.paymentService.savePayment('PaymentListenerService', input);
    const amount = multipleAssetToValue(input.asset, input.amountNumber);
    const total = new BigNumber(amount).plus(deposit.totalNumber).toString();

    const taxes = await this.taxService.getTaxesByPage({ page: 0, size: 1 });
    let taxation = '0';
    if (taxes.data.length > 0) {
      const taxToFloat = new BigNumber(taxes.data[0].taxNumber)
        .dividedBy('100')
        .toString();
      taxation = new BigNumber(total).multipliedBy(taxToFloat).toString();
    }
    const untaxed = new BigNumber(total).minus(taxation).toString();
    this.logger.log(
      `Add to the deposit ${input.depositHash} the amount ${amount} now the deposit is total:${total} tax:${taxation} untaxed:${untaxed}`,
    );

    await this.depositService.editDepositNumbers(
      'PaymentListenerService',
      input.depositHash,
      taxation,
      total,
      untaxed,
    );
  }
}
