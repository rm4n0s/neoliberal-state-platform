import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { StorageServiceModule } from 'ngx-webstorage-service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ConfigurationComponent } from './configuration/configuration.component';
import { StateAccountsComponent } from './state-accounts/state-accounts.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { NavbarComponent } from './navbar/navbar.component';
import { CreateAccountFormComponent } from './create-account-form/create-account-form.component';
import { StateAccountAsItemComponent } from './state-account-as-item/state-account-as-item.component';
import { IndivindualStateAccountComponent } from './indivindual-state-account/indivindual-state-account.component';
import { TransferFormComponent } from './transfer-form/transfer-form.component';
import { PrivateAccountsComponent } from './private-accounts/private-accounts.component';
import { PrivateAccountAsItemComponent } from './private-account-as-item/private-account-as-item.component';
import { PaymentFormComponent } from './payment-form/payment-form.component';
import { DepositsComponent } from './deposits/deposits.component';
import { DepositFormComponent } from './deposit-form/deposit-form.component';
import { DepositAsItemComponent } from './deposit-as-item/deposit-as-item.component';
import { WithdrawFormComponent } from './withdraw-form/withdraw-form.component';
import { TaxesComponent } from './taxes/taxes.component';
import { taxRevenueReducer } from './reducers/reducer';
import { TaxAsItemComponent } from './tax-as-item/tax-as-item.component';
import { TransferAsItemComponent } from './transfer-as-item/transfer-as-item.component';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
const socketIoConfig: SocketIoConfig = {
  url: 'http://' + window.location.hostname + ':' + window.location.port,
  options: {},
};
console.log(socketIoConfig.url);

const appRoutes: Routes = [
  { path: 'state-accounts', component: StateAccountsComponent },
  { path: 'deposits', component: DepositsComponent },
  {
    path: 'state-accounts/:address',
    component: IndivindualStateAccountComponent,
  },
  { path: 'private-accounts', component: PrivateAccountsComponent },
  { path: 'taxes', component: TaxesComponent },
  { path: 'configuration', component: ConfigurationComponent },
  { path: '', redirectTo: '/state-accounts', pathMatch: 'full' },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    ConfigurationComponent,
    StateAccountsComponent,
    PageNotFoundComponent,
    NavbarComponent,
    CreateAccountFormComponent,
    StateAccountAsItemComponent,
    IndivindualStateAccountComponent,
    TransferFormComponent,
    PrivateAccountsComponent,
    PrivateAccountAsItemComponent,
    PaymentFormComponent,
    DepositsComponent,
    DepositFormComponent,
    DepositAsItemComponent,
    WithdrawFormComponent,
    TaxesComponent,
    TaxAsItemComponent,
    TransferAsItemComponent,
  ],
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { useHash: true },
      // { enableTracing: true }, // <-- debugging purposes only
    ),
    StoreModule.forRoot({ taxRevenueReducer }),
    NgbModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    StorageServiceModule,
    SocketIoModule.forRoot(socketIoConfig),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor() {
    // Add an icon to the library for convenient access in other components
    // https://fontawesome.com/icons?d=gallery
    library.add(faCheck, faTimes, faSpinner);
  }
}
