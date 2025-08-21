import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthTips } from './health-tips';

describe('HealthTips', () => {
  let component: HealthTips;
  let fixture: ComponentFixture<HealthTips>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthTips]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HealthTips);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
