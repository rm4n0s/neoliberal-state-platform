import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DepositsService } from '../services/deposits.service';

@Component({
  selector: 'app-deposit-form',
  templateUrl: './deposit-form.component.html',
  styleUrls: ['./deposit-form.component.css'],
})
export class DepositFormComponent implements OnInit {
  @Output() reloadList = new EventEmitter();
  password = new FormControl('');
  hash = '';
  errorMsg = '';

  constructor(
    private modalService: NgbModal,
    private depService: DepositsService,
  ) {}

  ngOnInit() {
    this.password.valueChanges.subscribe(async val => {
      if (val === '') {
        this.hash = '';
      } else {
        this.hash = await this.depService.hashPassword(val);
      }
    });
  }

  async random() {
    const length = 255;
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*():;<>,.`~';
    const charactersLength = characters.length;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    this.password.setValue(result);
  }
  closeError() {
    this.errorMsg = '';
  }

  async submit(modal) {
    if (this.password.value.length === 0) {
      this.errorMsg = 'The password is empty.';
      return;
    }
    await this.depService.save(this.password.value);
    this.reloadList.emit();
    this.password.setValue('');
    this.hash = '';
    modal.close();
  }

  open(content) {
    this.modalService
      .open(content, { size: 'lg', ariaLabelledBy: 'modal-basic-title' })
      .result.then(result => {}, reason => {});
  }
}
