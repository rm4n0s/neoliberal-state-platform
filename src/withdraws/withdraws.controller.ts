import { Mutex, MutexInterface } from 'async-mutex';
import { Controller, Post, Body, Headers } from '@nestjs/common';
import * as cvo from '../common/common-validations';
import { WithdrawsService } from './withdraws.service';
import { ConfigService } from '../config/config.service';
import {
  InputWithdrawDto,
  ToSaveWithdraw,
} from '../interfaces/withdraw.interface';
import { DepositsService } from '../deposits/deposits.service';
import { ERROR_AMOUNT_NOT_EQUAL_THE_DEPOSIT_AMOUNT } from '../common/errors';
import { TaxesService } from '../taxes/taxes.service';
import { LoggerService } from '../logger/logger.service';
import { ToSaveAsset } from '../interfaces/asset.interface';
import { Keypair } from 'stellar-sdk';

@Controller('/api/withdraws')
export class WithdrawsController {
  private contextName = WithdrawsController.name;
  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly withdrawService: WithdrawsService,
    private readonly depositService: DepositsService,
    private readonly taxService: TaxesService,
  ) {}
  mutex = new Mutex();
  private releaseMutex: MutexInterface.Releaser | null;

  @Post()
  async withdraw(
    @Headers('request-id') reqId: string,
    @Body() input: InputWithdrawDto,
  ) {
    cvo.validateEmptyDepositHash(input);
    cvo.validatePassword(input.depositHash, input.password);
    // check if deposit hash exists
    const dep = await this.depositService.getDeposit(input.depositHash);
    cvo.validateAmmount(input.assets, this.configService.getConf());
    cvo.validateAssetsMasterKey(input.assets);
    const amount = this.withdrawService.totalAssetsAmount(input.assets);
    if (amount !== dep.untaxedNumber) {
      throw ERROR_AMOUNT_NOT_EQUAL_THE_DEPOSIT_AMOUNT;
    }
    this.releaseMutex = await this.mutex.acquire();
    try {
      const toSaveAssets: ToSaveAsset[] = [];
      for (const inputAsset of input.assets) {
        const newAddress = await this.withdrawService.createAccountForAssetOnStellar(
          reqId,
          inputAsset,
        );
        const toSaveAsset: ToSaveAsset = {
          masterKey: inputAsset.masterKey,
          assetName: inputAsset.assetName,
          amountNumber: inputAsset.amountNumber,
          address: newAddress.publicKey(),
          addressSecret: newAddress.secret(),
        };
        toSaveAssets.push(toSaveAsset);
      }
      const toSaveWithdraw: ToSaveWithdraw = {
        password: input.password,
        depositHash: input.depositHash,
        assets: toSaveAssets,
      };

      const outputWithdraw = await this.withdrawService.saveWithdraw(
        reqId,
        toSaveWithdraw,
        dep.untaxedNumber,
        dep.taxedNumber,
        dep.totalNumber,
      );
      await this.depositService.editDepositNumbers(
        reqId,
        dep.hash,
        '0',
        '0',
        '0',
      );
      const taxesPage = await this.taxService.getTaxesByPage({
        page: 0,
        size: 1,
      });
      if (taxesPage.data.length > 0) {
        const tax = taxesPage.data[0];
        await this.taxService.maximizeTaxRevenue(
          reqId,
          tax.uuid,
          dep.taxedNumber,
        );
        await this.configService.maximizeTaxRevenueForState(dep.taxedNumber);
      }

      const trustAsset = async (
        withdrawService: WithdrawsService,
        inputWithdraw: ToSaveWithdraw,
        logger: LoggerService,
      ) => {
        let i = 1;
        // create the account on stellar
        for (const asset of inputWithdraw.assets) {
          const addressKey = Keypair.fromSecret(asset.addressSecret);
          await withdrawService.trustAssetOnStellar(reqId, asset, addressKey);
          await withdrawService.transferAssetToAccountOnStellar(
            reqId,
            asset,
            addressKey,
          );
          await withdrawService.changeMasterKeyOnStellar(
            reqId,
            asset,
            addressKey,
          );
          // tslint:disable-next-line:no-console
          logger.log(
            this.contextName,
            reqId,
            i + ' saving asset : ' + JSON.stringify(asset),
          );
          i++;
        }
      };
      trustAsset(this.withdrawService, toSaveWithdraw, this.logger);
      this.releaseMutex();
      this.releaseMutex = null;
      return outputWithdraw;
    } catch (e) {
      this.releaseMutex();
      this.releaseMutex = null;
      throw e;
    }
  }
}
