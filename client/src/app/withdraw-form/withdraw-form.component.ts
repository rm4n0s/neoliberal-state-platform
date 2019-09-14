import { Keypair } from 'stellar-sdk';
import * as lodash from 'lodash';
import { Component, OnInit, Input } from '@angular/core';
import { InputAsset, PrivateAsset } from '../interfaces/asset.interface';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfigurationService } from '../services/configuration.service';
import { FormControl } from '@angular/forms';
import BigNumber from 'bignumber.js';
import { assetToNumber } from '../utils/asset.math.util';
import { Deposit } from '../interfaces/deposit.interface';
import { InputWithdraw } from '../interfaces/withdraw.interface';
import { WithdrawService } from '../services/withdraw.service';
import { PrivateAccount } from '../interfaces/private.account.interface';
import { AmountI } from '../interfaces/amount.interface';
import { PrivateAccountService } from '../services/private.account.service';

@Component({
  selector: 'app-withdraw-form',
  templateUrl: './withdraw-form.component.html',
  styleUrls: ['./withdraw-form.component.css'],
})
export class WithdrawFormComponent implements OnInit {
  @Input() deposit: Deposit;
  assetMap: Map<string, PrivateAsset> = new Map<string, PrivateAsset>();
  assets: PrivateAsset[] = [];
  units: string[] = [];
  amount = new FormControl('1');
  selectedUnit = new FormControl('1');
  secret = new FormControl('');
  amountToReceive = '0';
  totalAmount = '0';
  isLoading = false;
  errorMsg = '';

  constructor(
    private modalService: NgbModal,
    private configService: ConfigurationService,
    private withdrawService: WithdrawService,
    private privateAccService: PrivateAccountService,
  ) {}

  async ngOnInit() {
    const config = await this.configService.getConfig().toPromise();
    this.units = config.currencyUnits;
    this.selectedUnit.setValue(this.units[0]);
    this.totalAmount = '0';
    this.assets = [];
    this.assetMap = new Map<string, PrivateAsset>();
    this.amountToReceive = this.deposit.untaxedNumber;
  }

  generateSecret() {
    const key = Keypair.random();
    this.secret.setValue(key.secret());
  }

  removeAsset(index: number) {
    console.log('remove asset ', index);
    lodash.pullAt(this.assets, index);
    console.log(this.assets);
    this.assetMap = new Map<string, PrivateAsset>();
    for (const asset of this.assets) {
      this.assetMap[asset.address] = asset;
    }
    this.calculateTotal();
  }

  async addAsset() {
    if (this.secret.value.length === 0) {
      this.errorMsg = 'The secret is empty';
      return;
    }
    if (new BigNumber(this.amount.value).eq('0')) {
      this.errorMsg = 'The amount can not be 0';
      return;
    }
    const privateAsset: PrivateAsset = {
      masterPublicKey: Keypair.fromSecret(this.secret.value).publicKey(),
      amountNumber: this.amount.value,
      masterSecret: this.secret.value,
      address: '',
      assetName: this.selectedUnit.value,
    };
    this.assetMap[privateAsset.masterPublicKey] = privateAsset;
    this.assets.push(privateAsset);
    this.calculateTotal();
  }

  calculateTotal() {
    this.totalAmount = '0';
    for (const asset of this.assets) {
      let assetNumber = assetToNumber(asset.assetName);
      assetNumber = new BigNumber(assetNumber)
        .multipliedBy(asset.amountNumber)
        .toString();
      this.totalAmount = new BigNumber(this.totalAmount)
        .plus(assetNumber)
        .toString();
    }
  }

  open(content) {
    this.modalService
      .open(content, { size: 'lg', ariaLabelledBy: 'modal-basic-title' })
      .result.then(result => {}, reason => {});
  }

  closeError() {
    this.errorMsg = '';
  }

  async submit(modal) {
    const inputAssets: InputAsset[] = [];
    for (const asset of this.assets) {
      inputAssets.push({
        amountNumber: asset.amountNumber,
        assetName: asset.assetName,
        masterKey: asset.masterPublicKey,
      });
    }
    const input: InputWithdraw = {
      assets: inputAssets,
      password: this.deposit.password,
      depositHash: this.deposit.hash,
    };
    this.isLoading = true;
    try {
      const output = await this.withdrawService
        .createWithdraw(input)
        .toPromise();
      console.log(output);
      for (const asset of output.assets) {
        const amount: AmountI = {
          amountNumber: asset.amountNumber,
          assetName: asset.assetName,
        };
        const privateAccount: PrivateAccount = {
          address: asset.address,
          masterSecret: this.assetMap[asset.masterKey].masterSecret,
          amounts: [amount],
        };
        this.privateAccService.save(privateAccount);
      }
      modal.close();
    } catch (e) {
      this.errorMsg = e.message;
    }
    this.isLoading = false;
  }
}
