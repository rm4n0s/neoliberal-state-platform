import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { Keypair } from 'stellar-sdk';
import { HttpErrorResponse } from '@angular/common/http';
import {
  OutputAccount,
  InputDataAccount,
  InputAccount,
} from '../interfaces/account.interface';
import { AccountsService } from '../services/accounts.service';

@Component({
  selector: 'app-create-account-form',
  templateUrl: './create-account-form.component.html',
  styleUrls: ['./create-account-form.component.css'],
})
export class CreateAccountFormComponent implements OnInit {
  @Output() afterSuccess: EventEmitter<OutputAccount> = new EventEmitter<
    OutputAccount
  >();
  errorMessage = '';
  isLoading = false;
  name = new FormControl('');
  description = new FormControl('');
  masterKey = new FormControl('');
  masterSecret = '';
  includeLumens = new FormControl(0);
  nonce = uuid();
  secret = new FormControl('');
  constructor(private accountServ: AccountsService) {}

  ngOnInit() {}
  createKey() {
    const k = Keypair.random();
    this.masterKey.setValue(k.publicKey());
    this.masterSecret = k.secret();
  }
  closeError() {
    this.errorMessage = '';
  }

  cleanForm() {
    this.errorMessage = '';
    this.isLoading = false;
    this.name = new FormControl('');
    this.description = new FormControl('');
    this.masterKey = new FormControl('');
    this.masterSecret = '';
    this.includeLumens = new FormControl(0);
    this.nonce = uuid();
    this.secret = new FormControl('');
  }
  submit() {
    const { name, description, masterKey, includeLumens, nonce, secret } = this;
    try {
      const requesterPair = Keypair.fromSecret(secret.value as string);
      const inputData: InputDataAccount = {
        name: name.value as string,
        description: description.value as string,
        masterKey: masterKey.value as string,
        requester: requesterPair.publicKey(),
        includeLumens: includeLumens.value as string,
        nonce,
      };
      this.isLoading = true;
      const stringifiedData = JSON.stringify(inputData);
      const input: InputAccount = {
        data: inputData,
        stringifiedData,
        signature: '',
      };
      this.closeError();

      input.signature = requesterPair
        .sign(Buffer.from(stringifiedData))
        .toString('base64');

      this.accountServ.createAccount(input).subscribe(
        out => {
          this.isLoading = false;
          this.afterSuccess.emit(out);
          this.cleanForm();
        },
        (err: HttpErrorResponse) => {
          this.errorMessage = err.error.message;
          this.isLoading = false;
        },
      );
    } catch (e) {
      this.errorMessage = 'UI Error: ' + e.message;
      this.isLoading = false;
      console.log('error ', e);
    }
  }
}
