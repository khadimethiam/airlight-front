import { TestBed } from '@angular/core/testing';

import { CurrentSensorService } from './current-sensor.service';

describe('CurrentSensorService', () => {
  let service: CurrentSensorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurrentSensorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
