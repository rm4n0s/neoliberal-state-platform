import { Injectable, Inject } from '@angular/core';
import { Mutex, MutexInterface } from 'async-mutex';
import * as StellarSdk from 'stellar-sdk';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';
import { PrivateAccount } from '../interfaces/private.account.interface';
import { ConfigurationService } from './configuration.service';
import { Balance } from '../interfaces/balance.interface';
import { AmountI } from '../interfaces/amount.interface';

const STORAGE_KEY = 'local_account_list';

class PaymentFailedError extends Error {
  constructor(message?: string) {
    super(message);
    this.message = `Payment error: ${this.message}`;
  }
}

class MergeFailedError extends Error {
  constructor(message?: string) {
    super(message);
    this.message = `Merge error: ${this.message}`;
  }
}

class RemovingTrustFailedError extends Error {
  constructor(message?: string) {
    super(message);
    this.message = `Removing trust error: ${this.message}`;
  }
}
const mutex = new Mutex();

@Injectable({
  providedIn: 'root',
})
export class PrivateAccountService {
  constructor(
    @Inject(LOCAL_STORAGE) private storage: StorageService,
    private configService: ConfigurationService,
  ) {}
  private releaseMutex: MutexInterface.Releaser | null;

  getPrivateAccounts(): PrivateAccount[] {
    return this.storage.get(STORAGE_KEY) || [];
  }

  async reloadList() {
    const accounts = this.getPrivateAccounts();
    for (const account of accounts) {
      await this.save(account);
    }
  }

  async reloadAccount(address: string) {
    const accounts = this.getPrivateAccounts().filter(
      acc => acc.address === address,
    );
    for (const account of accounts) {
      await this.save(account);
    }
  }

  async save(account: PrivateAccount) {
    this.releaseMutex = await mutex.acquire();

    let currentAccountList: PrivateAccount[] =
      this.storage.get(STORAGE_KEY) || [];
    const balances = await this.getBalanceFromStellar(account.address);
    const amounts: AmountI[] = balances.map(balance => {
      return { assetName: balance.asset, amountNumber: balance.balanceNumber };
    });
    const len = currentAccountList.filter(v => v.address === account.address)
      .length;
    if (len === 0) {
      currentAccountList.push({
        address: account.address,
        masterSecret: account.masterSecret,
        amounts,
      });
    } else {
      currentAccountList = currentAccountList.map(v => {
        if (v.address === account.address) {
          v.amounts = amounts;
          return v;
        }
        return v;
      });
    }
    this.storage.set(STORAGE_KEY, currentAccountList);
    console.log(this.storage.get(STORAGE_KEY) || 'LocaL storage is empty');
    this.releaseMutex();
    this.releaseMutex = null;
  }

  remove(address: string) {
    const currentAccountList: PrivateAccount[] =
      this.storage.get(STORAGE_KEY) || [];
    const newList = currentAccountList.filter(
      account => account.address !== address,
    );
    this.storage.set(STORAGE_KEY, newList);
  }

  async getBalanceFromStellar(address: string): Promise<Balance[]> {
    const conf = await this.configService.getConfig().toPromise();
    const server = new StellarSdk.Server(conf.horizonUrl);
    const account = await server.loadAccount(address);
    return account.balances.map(balance => {
      const b = balance as { balance: string; asset_code?: string };
      return {
        asset: b.asset_code === undefined ? 'lumen' : b.asset_code,
        balanceNumber: b.balance,
      };
    });
  }

  async paymentOnStellar(
    account: PrivateAccount,
    deposit: string,
    amounts: AmountI[],
  ) {
    const conf = await this.configService.getConfig().toPromise();
    const server = new StellarSdk.Server(conf.horizonUrl);
    const fee = await server.fetchBaseFee();
    const accountStellar = await server.loadAccount(account.address);
    const network = conf.isTest
      ? StellarSdk.Networks.TESTNET
      : StellarSdk.Networks.PUBLIC;
    const transaction = new StellarSdk.TransactionBuilder(accountStellar, {
      fee: conf.baseFeeMultiplier * fee,
      networkPassphrase: network,
    });
    for (const amount of amounts) {
      const asset = new StellarSdk.Asset(amount.assetName, conf.publicKey);
      transaction.addOperation(
        StellarSdk.Operation.payment({
          destination: conf.publicKey,
          asset,
          amount: amount.amountNumber,
        }),
      );
    }
    const transactionBuilder = transaction
      .addMemo(StellarSdk.Memo.hash(deposit))
      .setTimeout(conf.stellarTimeout)
      .build();

    transactionBuilder.sign(
      StellarSdk.Keypair.fromSecret(account.masterSecret),
    );
    try {
      await server.submitTransaction(transactionBuilder);
    } catch (err) {
      throw new PaymentFailedError('The payment failed with ' + err);
    }
  }

  async removeTrust(account: PrivateAccount) {
    const conf = await this.configService.getConfig().toPromise();
    const server = new StellarSdk.Server(conf.horizonUrl);
    const fee = await server.fetchBaseFee();
    const accountStellar = await server.loadAccount(account.address);
    const network = conf.isTest
      ? StellarSdk.Networks.TESTNET
      : StellarSdk.Networks.PUBLIC;
    let transaction = new StellarSdk.TransactionBuilder(accountStellar, {
      fee: conf.baseFeeMultiplier * fee,
      networkPassphrase: network,
    });

    for (const amount of account.amounts) {
      if (amount.assetName !== 'lumen') {
        const asset = new StellarSdk.Asset(amount.assetName, conf.publicKey);
        transaction = transaction.addOperation(
          StellarSdk.Operation.changeTrust({
            asset,
            limit: '0',
          }),
        );
      }
    }

    const transactionBuilder = transaction
      .setTimeout(conf.stellarTimeout)
      .build();

    transactionBuilder.sign(
      StellarSdk.Keypair.fromSecret(account.masterSecret),
    );
    try {
      await server.submitTransaction(transactionBuilder);
    } catch (err) {
      throw new RemovingTrustFailedError(
        'The removing trust failed with ' + err,
      );
    }
  }

  async mergeAccountToTheState(account: PrivateAccount) {
    const conf = await this.configService.getConfig().toPromise();
    const server = new StellarSdk.Server(conf.horizonUrl);
    const fee = await server.fetchBaseFee();
    const accountStellar = await server.loadAccount(account.address);
    const network = conf.isTest
      ? StellarSdk.Networks.TESTNET
      : StellarSdk.Networks.PUBLIC;
    const transaction = new StellarSdk.TransactionBuilder(accountStellar, {
      fee: conf.baseFeeMultiplier * fee,
      networkPassphrase: network,
    });

    transaction.addOperation(
      StellarSdk.Operation.accountMerge({
        destination: conf.publicKey,
      }),
    );
    const transactionBuilder = transaction
      .setTimeout(conf.stellarTimeout)
      .build();

    transactionBuilder.sign(
      StellarSdk.Keypair.fromSecret(account.masterSecret),
    );
    try {
      await server.submitTransaction(transactionBuilder);
    } catch (err) {
      throw new MergeFailedError('The account merge failed with ' + err);
    }
  }
}
