import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateHistoricComponent } from './candidate-historic.component';

describe('CandidateHistoricComponent', () => {
  let component: CandidateHistoricComponent;
  let fixture: ComponentFixture<CandidateHistoricComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateHistoricComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CandidateHistoricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
