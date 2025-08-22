import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertsCenter } from './alerts-center';

describe('AlertsCenter', () => {
  let component: AlertsCenter;
  let fixture: ComponentFixture<AlertsCenter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertsCenter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertsCenter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
