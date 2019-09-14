import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, Observer } from 'rxjs';
import { reloadTaxRevenueAction } from '../actions/tax.revenue.action';
import { ConfigurationService } from '../services/configuration.service';
import { TaxRevenueWsService } from '../services/tax-revenue-ws.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  taxRevenue$: Observable<string>;
  constructor(
    private store: Store<{ taxRevenueReducer: { taxRevenue: string } }>,
    private configSrv: ConfigurationService,
    private taxRevenueSrv: TaxRevenueWsService,
  ) {
    this.taxRevenue$ = this.store.select(
      state => state.taxRevenueReducer.taxRevenue,
    );
    this.taxRevenue$.subscribe(num => console.log(num));
  }
  ngOnInit() {
    this.reloadTaxRevenue();
    this.taxRevenueSrv.onNewTaxRevenue$().subscribe(taxRevenue => {
      this.store.dispatch(reloadTaxRevenueAction({ taxRevenue }));
    });
  }

  reloadTaxRevenue() {
    this.configSrv.getState().subscribe(state => {
      this.store.dispatch(
        reloadTaxRevenueAction({ taxRevenue: state.taxRevenueNumber }),
      );
    });
  }
}
