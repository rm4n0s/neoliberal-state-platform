import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TaxRevenueWsService {
  constructor(private socket: Socket) {}

  onNewTaxRevenue$() {
    return this.socket
      .fromEvent<any>('newTaxRevenue')
      .pipe(map((x: { taxRevenueNumber: string }) => x.taxRevenueNumber));
  }
}
