import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxAsItemComponent } from './tax-as-item.component';

describe('TaxAsItemComponent', () => {
  let component: TaxAsItemComponent;
  let fixture: ComponentFixture<TaxAsItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaxAsItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxAsItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
