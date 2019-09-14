import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StateAccountsComponent } from './state-accounts.component';

describe('StateAccountsComponent', () => {
  let component: StateAccountsComponent;
  let fixture: ComponentFixture<StateAccountsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StateAccountsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
