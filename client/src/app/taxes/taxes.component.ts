import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Keypair } from 'stellar-sdk';
import { TaxesService } from '../services/taxes.service';
import { InputTax, InputDataTax, OutputTax } from '../interfaces/tax.interface';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-taxes',
  templateUrl: './taxes.component.html',
  styleUrls: ['./taxes.component.css'],
})
export class TaxesComponent implements OnInit {
  errorMessage = '';
  isLoading = false;
  tax = new FormControl('');
  requesterSecret = new FormControl('');
  taxes: OutputTax[] = [];
  currentTaxesPage = 1;
  sizeTaxesPage = 10;
  totalTaxes = 10;
  constructor(private taxService: TaxesService) {}

  ngOnInit() {
    this.pageTaxesChange(1);
  }

  pageTaxesChange(page: number) {
    this.currentTaxesPage = page;
    this.taxService
      .getTaxes({
        page: this.currentTaxesPage - 1,
        size: this.sizeTaxesPage,
      })
      .subscribe(lp => {
        this.taxes = lp.data;
        this.totalTaxes = lp.total;
      });
  }

  async submit() {
    try {
      const requesterPair = Keypair.fromSecret(this.requesterSecret
        .value as string);
      const inputData: InputDataTax = {
        nonce: uuid(),
        taxNumber: this.tax.value as string,
        requester: requesterPair.publicKey(),
      };
      const input: InputTax = {
        data: inputData,
        stringifiedData: JSON.stringify(inputData),
        signature: '',
      };
      input.signature = requesterPair
        .sign(Buffer.from(input.stringifiedData))
        .toString('base64');

      await this.taxService.addTax(input).toPromise();
      this.pageTaxesChange(1);
    } catch (e) {
      this.errorMessage = 'UI Error: ' + e.message;
      this.isLoading = false;
      console.log('error ', e);
    }
  }
}
