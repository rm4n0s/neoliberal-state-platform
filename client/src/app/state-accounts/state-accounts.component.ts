import { Component, OnInit } from '@angular/core';
import { OutputAccount } from '../interfaces/account.interface';
import { AccountsService } from '../services/accounts.service';

@Component({
  selector: 'app-state-accounts',
  templateUrl: './state-accounts.component.html',
  styleUrls: ['./state-accounts.component.css'],
})
export class StateAccountsComponent implements OnInit {
  accounts: OutputAccount[];
  currentAccountsPage = 1;
  sizeAccountsPage = 10;
  totalAccounts = 10;
  constructor(private accServ: AccountsService) {}

  pageAccountChange(page: number) {
    this.currentAccountsPage = page;
    this.accServ
      .getAccounts({
        page: this.currentAccountsPage - 1,
        size: this.sizeAccountsPage,
      })
      .subscribe(lp => {
        this.accounts = lp.data;
        this.totalAccounts = lp.total;
      });
  }
  afterAccountCreation(newAcc: OutputAccount) {
    this.pageAccountChange(1);
  }
  ngOnInit() {
    this.pageAccountChange(1);
  }
}
