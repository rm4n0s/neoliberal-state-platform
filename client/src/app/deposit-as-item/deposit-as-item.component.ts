import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Deposit } from '../interfaces/deposit.interface';
import { DepositsService } from '../services/deposits.service';

@Component({
  selector: 'app-deposit-as-item',
  templateUrl: './deposit-as-item.component.html',
  styleUrls: ['./deposit-as-item.component.css'],
})
export class DepositAsItemComponent implements OnInit {
  @Input() deposit: Deposit;
  @Output() reloadList = new EventEmitter();
  hash = '';
  constructor(private depService: DepositsService) {}

  ngOnInit() {
    this.hash = this.deposit.hash;
  }

  remove() {
    this.depService.remove(this.deposit.hash);
    this.reloadList.emit();
  }
}
