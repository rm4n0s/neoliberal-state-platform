import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StateAccountAsItemComponent } from './state-account-as-item.component';

describe('StateAccountAsItemComponent', () => {
  let component: StateAccountAsItemComponent;
  let fixture: ComponentFixture<StateAccountAsItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StateAccountAsItemComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateAccountAsItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
