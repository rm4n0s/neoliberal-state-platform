import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import { Component, OnInit } from '@angular/core';
import { PrivateAccountService } from '../services/private.account.service';
import { FormControl } from '@angular/forms';
import { PrivateAccount } from '../interfaces/private.account.interface';
import { assetToNumber } from '../utils/asset.math.util';
import { AmountI } from '../interfaces/amount.interface';

@Component({
  selector: 'app-private-accounts',
  templateUrl: './private-accounts.component.html',
  styleUrls: ['./private-accounts.component.css'],
})
export class PrivateAccountsComponent implements OnInit {
  constructor(private privAccService: PrivateAccountService) {}
  address = new FormControl('');
  secret = new FormControl('');
  accounts: PrivateAccount[] = [];
  currentAccountsPage = 1;
  sizeAccountsPage = 10;
  totalAccounts = 10;
  totalAmount = '0';
  totalLumen = '0';
  ngOnInit() {
    this.pageAccountChange(1);
    this.calculateAmounts();
  }

  async reloadItem(address: string) {
    await this.privAccService.reloadAccount(address);
    await this.calculateAmounts();
    this.pageAccountChange(this.currentAccountsPage);
  }

  async removeItem(address: string) {
    await this.privAccService.remove(address);
    await this.calculateAmounts();
    this.pageAccountChange(this.currentAccountsPage);
  }

  async reloadList() {
    console.log('reload list');
    await this.privAccService.reloadList();
    await this.calculateAmounts();
    this.pageAccountChange(this.currentAccountsPage);
  }

  async calculateAmounts() {
    const accounts = this.privAccService.getPrivateAccounts();
    const allAmounts: AmountI[] = _.flatten(accounts.map(acc => acc.amounts));
    this.totalAmount = '0';
    this.totalLumen = '0';
    for (const amount of allAmounts) {
      if (amount.assetName !== 'lumen') {
        let assetNumber = assetToNumber(amount.assetName);
        assetNumber = new BigNumber(assetNumber)
          .multipliedBy(amount.amountNumber)
          .toString();
        this.totalAmount = new BigNumber(this.totalAmount)
          .plus(assetNumber)
          .toString();
      } else {
        this.totalLumen = new BigNumber(this.totalLumen)
          .plus(amount.amountNumber)
          .toString();
      }
    }
  }

  async submitAddress() {
    const account: PrivateAccount = {
      address: this.address.value,
      masterSecret: this.secret.value,
      amounts: [],
    };
    await this.privAccService.save(account);
    this.address.setValue('');
    this.secret.setValue('');
    this.reloadList();
  }

  pageAccountChange(page: number) {
    this.currentAccountsPage = page;
    const accounts = this.privAccService.getPrivateAccounts();
    const pageNumber = this.currentAccountsPage - 1;
    this.totalAccounts = accounts.length;
    this.accounts = accounts.slice(
      pageNumber * this.sizeAccountsPage,
      (pageNumber + 1) * this.sizeAccountsPage,
    );
  }
}
