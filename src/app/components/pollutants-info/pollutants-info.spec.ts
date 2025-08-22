import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PollutantsInfo } from './pollutants-info';

describe('PollutantsInfo', () => {
  let component: PollutantsInfo;
  let fixture: ComponentFixture<PollutantsInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PollutantsInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PollutantsInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
