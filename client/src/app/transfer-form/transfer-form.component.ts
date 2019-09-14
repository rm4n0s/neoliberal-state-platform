import {
  Component,
  OnInit,
  Input,
  OnChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { Keypair } from 'stellar-sdk';
import { BigNumber } from 'bignumber.js';

import { HttpErrorResponse } from '@angular/common/http';
import {
  OutputTransfer,
  InputDataTransfer,
  InputTransfer,
} from '../interfaces/transfer.interface';
import { TransfersService } from '../services/transfers.service';

@Component({
  selector: 'app-transfer-form',
  templateUrl: './transfer-form.component.html',
  styleUrls: ['./transfer-form.component.css'],
})
export class TransferFormComponent implements OnInit, OnChanges {
  @Input() address: string;
  @Input() assets: string[] = [];
  @Output() afterSuccess: EventEmitter<OutputTransfer> = new EventEmitter<
    OutputTransfer
  >();
  receiver = new FormControl('');
  secret = new FormControl('');
  reason = new FormControl('');
  source = new FormControl('printer');
  includeLumens = new FormControl('0');
  amounts: { [key: string]: FormControl } = {};
  isLoading = false;
  errorMsg = '';
  constructor(
    private modalService: NgbModal,
    private tranServ: TransfersService,
  ) {}

  open(content) {
    this.modalService
      .open(content, { ariaLabelledBy: 'modal-basic-title' })
      .result.then(result => {}, reason => {});
  }
  closeError() {
    this.errorMsg = '';
  }
  cleanValues() {
    this.secret = new FormControl('');
    this.reason = new FormControl('');
    this.includeLumens = new FormControl('0');
    this.amounts = {};
    for (const asset of this.assets) {
      if (!(asset in this.amounts)) {
        this.amounts[asset] = new FormControl('0');
      }
    }
  }
  submit(modal) {
    const masterSecret = this.secret.value as string;
    const receiver = this.receiver.value;
    const reason = this.reason.value;
    const amounts = Object.keys(this.amounts)
      .map(amKey => {
        const val = this.amounts[amKey].value as string;
        return { assetName: amKey, amountNumber: val };
      })
      .filter(am => new BigNumber(am.amountNumber).gt('0'));
    const includeLumens = this.includeLumens.value;
    const source = this.source.value === 'printer' ? 'printer' : 'taxes';
    this.isLoading = true;
    try {
      this.tranServ
        .createTransfer(
          masterSecret,
          receiver,
          includeLumens,
          reason,
          amounts,
          source,
        )
        .subscribe(
          trans => {
            this.isLoading = false;
            this.afterSuccess.emit(trans);
            modal.close();
            this.cleanValues();
            this.errorMsg = '';
          },
          (err: Error) => {
            this.errorMsg = err.message;
            this.isLoading = false;
          },
        );
    } catch (e) {
      this.errorMsg = e.message;
      this.isLoading = false;
    }
  }

  ngOnInit() {
    this.receiver.setValue(this.address);
  }

  ngOnChanges() {
    for (const asset of this.assets) {
      if (!(asset in this.amounts)) {
        this.amounts[asset] = new FormControl('0');
      }
    }
  }
}
