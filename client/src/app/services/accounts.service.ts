import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  PaginationI,
  ListPaginatedI,
} from '../interfaces/pagination.interface';
import { InputAccount, OutputAccount } from '../interfaces/account.interface';
import { Balance } from '../interfaces/balance.interface';

@Injectable({
  providedIn: 'root',
})
export class AccountsService {
  constructor(private http: HttpClient) {}

  createAccount(input: InputAccount) {
    return this.http.post<OutputAccount>('/api/accounts', input);
  }

  getAccounts(pag: PaginationI) {
    return this.http.get<ListPaginatedI<OutputAccount>>(
      `/api/accounts?page=${pag.page}&size=${pag.size}`,
    );
  }

  getAccount(address: string) {
    return this.http.get<OutputAccount>(`/api/accounts/${address}`);
  }

  getBalances(address: string) {
    return this.http.get<Balance[]>(`/api/accounts/${address}/balances`);
  }
}
