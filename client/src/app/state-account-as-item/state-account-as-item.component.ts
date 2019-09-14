import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-state-account-as-item',
  templateUrl: './state-account-as-item.component.html',
  styleUrls: ['./state-account-as-item.component.css'],
})
export class StateAccountAsItemComponent implements OnInit {
  @Input() name: string;
  @Input() description: string;
  @Input() address: string;

  constructor() {}

  ngOnInit() {}
}
