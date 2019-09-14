import { Component, OnInit, Input } from '@angular/core';
import { OutputTax } from '../interfaces/tax.interface';

@Component({
  selector: 'app-tax-as-item',
  templateUrl: './tax-as-item.component.html',
  styleUrls: ['./tax-as-item.component.css'],
})
export class TaxAsItemComponent implements OnInit {
  @Input() tax: OutputTax;
  constructor() {}

  ngOnInit() {}
}
