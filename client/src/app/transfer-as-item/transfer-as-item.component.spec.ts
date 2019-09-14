import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferAsItemComponent } from './transfer-as-item.component';

describe('TransferAsItemComponent', () => {
  let component: TransferAsItemComponent;
  let fixture: ComponentFixture<TransferAsItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransferAsItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransferAsItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
