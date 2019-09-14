import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PrivateAccount } from '../interfaces/private.account.interface';
import { PrivateAccountService } from '../services/private.account.service';
import { assetToNumber } from '../utils/asset.math.util';
import BigNumber from 'bignumber.js';

@Component({
  selector: 'app-private-account-as-item',
  templateUrl: './private-account-as-item.component.html',
  styleUrls: ['./private-account-as-item.component.css'],
})
export class PrivateAccountAsItemComponent implements OnInit {
  @Input() account: PrivateAccount;
  @Output() reloadItem = new EventEmitter<string>();
  @Output() removeItem = new EventEmitter<string>();

  totalAmount = '0';
  totalLumen = '0';
  isAmountsHidden = true;
  constructor() {}

  ngOnInit() {
    this.totalAmount = '0';
    this.totalLumen = '0';
    for (const amount of this.account.amounts) {
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
  async reload() {
    this.reloadItem.emit(this.account.address);
  }
  async remove() {
    this.removeItem.emit(this.account.address);
  }
  afterPayment() {
    console.log('After payment');
    this.reloadItem.emit(this.account.address);
  }
  showAmounts() {
    this.isAmountsHidden = false;
  }
  hideAmounts() {
    this.isAmountsHidden = true;
  }
}
