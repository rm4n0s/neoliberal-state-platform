import { Component, OnInit } from '@angular/core';
import { Deposit } from '../interfaces/deposit.interface';
import { DepositsService } from '../services/deposits.service';

@Component({
  selector: 'app-deposits',
  templateUrl: './deposits.component.html',
  styleUrls: ['./deposits.component.css'],
})
export class DepositsComponent implements OnInit {
  deposits: Deposit[] = [];
  currentDepositsPage = 1;
  sizeDepositsPage = 10;
  totalDeposits = 10;
  constructor(private depService: DepositsService) {}

  ngOnInit() {
    this.reloadList();
  }

  async reloadList() {
    const deposits = await this.depService.getDeposits();
    const pageNumber = this.currentDepositsPage - 1;
    this.totalDeposits = deposits.length;

    for (const deposit of deposits) {
      await this.depService.reloadDeposit(deposit);
    }
    this.deposits = deposits.slice(
      pageNumber * this.sizeDepositsPage,
      (pageNumber + 1) * this.sizeDepositsPage,
    );
  }

  pageDepositChange(page: number) {
    this.currentDepositsPage = page;
    this.reloadList();
  }
}
