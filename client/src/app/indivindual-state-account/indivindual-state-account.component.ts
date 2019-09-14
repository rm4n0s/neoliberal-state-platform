import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ConfigurationService } from '../services/configuration.service';
import { OutputAccount } from '../interfaces/account.interface';
import { Balance } from '../interfaces/balance.interface';
import { OutputTransfer } from '../interfaces/transfer.interface';
import { AccountsService } from '../services/accounts.service';
import { TransfersService } from '../services/transfers.service';

@Component({
  selector: 'app-indivindual-state-account',
  templateUrl: './indivindual-state-account.component.html',
  styleUrls: ['./indivindual-state-account.component.css'],
})
export class IndivindualStateAccountComponent implements OnInit {
  account: OutputAccount;
  balances: Balance[];
  assets: string[] = [];
  address = '';
  transfers: OutputTransfer[] = [];
  totalTransfers = 10;
  currentTransfersPage = 1;
  sizeTransfersPage = 10;

  pageTransferChange(page: number) {
    this.currentTransfersPage = page;
    this.transServ
      .getTransfersByAccount(
        { page: page - 1, size: this.sizeTransfersPage },
        this.address,
      )
      .subscribe(out => {
        this.transfers = out.data;
        this.totalTransfers = out.total;
      });
  }

  constructor(
    private accServ: AccountsService,
    private configServ: ConfigurationService,
    private transServ: TransfersService,
    private route: ActivatedRoute,
  ) {}

  receiveAccountData() {
    this.accServ.getAccount(this.address).subscribe(acc => {
      this.account = acc;
    });
    this.accServ.getBalances(this.address).subscribe(bals => {
      this.balances = bals;
    });
  }

  afterNewTransfer(transfer: OutputTransfer) {
    this.receiveAccountData();
    this.pageTransferChange(1);
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.address = params.get('address');
      this.receiveAccountData();
      this.pageTransferChange(1);
    });

    this.configServ.getConfig().subscribe(config => {
      this.assets = config.currencyUnits;
    });
  }
}
