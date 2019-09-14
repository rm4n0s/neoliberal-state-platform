import { Component, OnInit, Input } from '@angular/core';
import { OutputTransfer } from '../interfaces/transfer.interface';

@Component({
  selector: 'app-transfer-as-item',
  templateUrl: './transfer-as-item.component.html',
  styleUrls: ['./transfer-as-item.component.css'],
})
export class TransferAsItemComponent implements OnInit {
  @Input() transfer: OutputTransfer;
  constructor() {}

  ngOnInit() {}
}
