import { Injectable, Inject } from '@angular/core';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';
import {
  Deposit,
  OutputDeposit,
  InputDepositInfo,
} from '../interfaces/deposit.interface';
import { HttpClient } from '@angular/common/http';
const STORAGE_KEY = 'local_deposit_list';

@Injectable({
  providedIn: 'root',
})
export class DepositsService {
  constructor(
    @Inject(LOCAL_STORAGE) private storage: StorageService,
    private http: HttpClient,
  ) {}

  getDeposits(): Deposit[] {
    return this.storage.get(STORAGE_KEY) || [];
  }

  async hashPassword(password: string) {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  }

  async save(password: string) {
    const hash = await this.hashPassword(password);
    const depositList: Deposit[] = this.storage.get(STORAGE_KEY) || [];
    const len = depositList.filter(v => v.hash === hash).length;
    if (len === 0) {
      depositList.unshift({
        hash,
        password,
        untaxedNumber: '0',
        taxedNumber: '0',
        totalNumber: '0',
        withdraws: [],
      });
    }
    this.storage.set(STORAGE_KEY, depositList);
  }

  async reloadDeposit(deposit: Deposit) {
    const input: InputDepositInfo = {
      hash: deposit.hash,
      password: deposit.password,
    };
    try {
      const res = this.http.post<OutputDeposit>('/api/deposits/info', input);
      const out = await res.toPromise();
      const newDeposits = this.getDeposits().map(v => {
        if (v.hash === out.hash) {
          v.taxedNumber = out.taxedNumber;
          v.totalNumber = out.totalNumber;
          v.untaxedNumber = out.untaxedNumber;
          return v;
        }
        return v;
      });
      this.storage.set(STORAGE_KEY, newDeposits);
    } catch (e) {}
  }

  remove(hash: string) {
    const newList = this.getDeposits().filter(v => v.hash !== hash);
    this.storage.set(STORAGE_KEY, newList);
  }
}
