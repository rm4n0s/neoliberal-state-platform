import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl } from '@angular/forms';
import { PrivateAccount } from '../interfaces/private.account.interface';
import { PrivateAccountService } from '../services/private.account.service';
import BigNumber from 'bignumber.js';
import { assetToNumber } from '../utils/asset.math.util';

interface AmountForm {
  assetName: string;
  currentValue: string;
  formValue: FormControl;
}
@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.css'],
})
export class PaymentFormComponent implements OnInit {
  @Input() account: PrivateAccount;
  @Output() afterPayment = new EventEmitter();

  deposit = new FormControl('');
  amounts: AmountForm[] = [];
  isLoading = false;
  errorMsg = '';

  constructor(
    private privAccService: PrivateAccountService,
    private modalService: NgbModal,
  ) {}

  ngOnInit() {}
  open(content) {
    for (const asset of this.account.amounts) {
      this.amounts.push({
        assetName: asset.assetName,
        currentValue: asset.amountNumber,
        formValue: new FormControl('0'),
      });
    }
    this.modalService
      .open(content, { ariaLabelledBy: 'modal-basic-title' })
      .result.then(result => {}, reason => {});
  }

  closeError() {
    this.errorMsg = '';
  }

  cleanValues() {
    this.amounts = [];
  }

  async submit(modal) {
    const amounts = this.amounts
      .map(am => {
        return { assetName: am.assetName, amountNumber: am.formValue.value };
      })
      .filter(am => new BigNumber(am.amountNumber).gt('0'));
    let totalPaymentAmount = '0';
    for (const amount of this.amounts) {
      if (amount.assetName !== 'lumen') {
        let assetNumber = assetToNumber(amount.assetName);
        assetNumber = new BigNumber(assetNumber)
          .multipliedBy(amount.formValue.value)
          .toString();
        totalPaymentAmount = new BigNumber(totalPaymentAmount)
          .plus(assetNumber)
          .toString();
      }
    }
    let totalAccountAmount = '0';
    for (const amount of this.account.amounts) {
      if (amount.assetName !== 'lumen') {
        let assetNumber = assetToNumber(amount.assetName);
        assetNumber = new BigNumber(assetNumber)
          .multipliedBy(amount.amountNumber)
          .toString();
        totalAccountAmount = new BigNumber(totalAccountAmount)
          .plus(assetNumber)
          .toString();
      }
    }
    this.isLoading = true;
    try {
      await this.privAccService.paymentOnStellar(
        this.account,
        this.deposit.value,
        amounts,
      );
    } catch (e) {
      this.errorMsg = e.message;
      this.isLoading = false;
      return;
    }
    console.log('merge account ', totalAccountAmount, ' ', totalPaymentAmount);
    if (new BigNumber(totalAccountAmount).eq(totalPaymentAmount)) {
      try {
        await this.privAccService.removeTrust(this.account);
        await this.privAccService.mergeAccountToTheState(this.account);
        this.privAccService.remove(this.account.address);
      } catch (e) {
        console.log(e.message);
      }
    }
    this.isLoading = false;
    this.afterPayment.emit();
    modal.close();
  }
}
