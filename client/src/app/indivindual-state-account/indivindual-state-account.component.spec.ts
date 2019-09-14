import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IndivindualStateAccountComponent } from './indivindual-state-account.component';

describe('IndivindualStateAccountComponent', () => {
  let component: IndivindualStateAccountComponent;
  let fixture: ComponentFixture<IndivindualStateAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [IndivindualStateAccountComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IndivindualStateAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
