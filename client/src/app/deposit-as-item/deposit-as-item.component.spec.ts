import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositAsItemComponent } from './deposit-as-item.component';

describe('DepositAsItemComponent', () => {
  let component: DepositAsItemComponent;
  let fixture: ComponentFixture<DepositAsItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DepositAsItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositAsItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
