import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateAccountsComponent } from './private-accounts.component';

describe('PrivateAccountsComponent', () => {
  let component: PrivateAccountsComponent;
  let fixture: ComponentFixture<PrivateAccountsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PrivateAccountsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivateAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
