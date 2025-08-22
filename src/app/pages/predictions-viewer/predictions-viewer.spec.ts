import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionsViewer } from './predictions-viewer';

describe('PredictionsViewer', () => {
  let component: PredictionsViewer;
  let fixture: ComponentFixture<PredictionsViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionsViewer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredictionsViewer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
