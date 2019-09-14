import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InputTax, OutputTax } from '../interfaces/tax.interface';
import {
  PaginationI,
  ListPaginatedI,
} from '../interfaces/pagination.interface';

@Injectable({
  providedIn: 'root',
})
export class TaxesService {
  constructor(private http: HttpClient) {}

  addTax(input: InputTax) {
    return this.http.post<OutputTax>('/api/taxes', input);
  }

  getTaxes(pag: PaginationI) {
    return this.http.get<ListPaginatedI<OutputTax>>(
      `/api/taxes?page=${pag.page}&size=${pag.size}`,
    );
  }
}
