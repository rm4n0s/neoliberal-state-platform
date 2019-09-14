import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateAccountAsItemComponent } from './private-account-as-item.component';

describe('PrivateAccountAsItemComponent', () => {
  let component: PrivateAccountAsItemComponent;
  let fixture: ComponentFixture<PrivateAccountAsItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PrivateAccountAsItemComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivateAccountAsItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
