import { Injectable } from '@angular/core';
import {
  InputWithdraw,
  OutputWithdraw,
} from '../interfaces/withdraw.interface';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class WithdrawService {
  constructor(private http: HttpClient) {}

  createWithdraw(input: InputWithdraw) {
    return this.http.post<OutputWithdraw>('/api/withdraws', input);
  }
}
