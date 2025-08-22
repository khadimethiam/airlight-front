import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorAnalysis } from './sensor-analysis';

describe('SensorAnalysis', () => {
  let component: SensorAnalysis;
  let fixture: ComponentFixture<SensorAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensorAnalysis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SensorAnalysis);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
