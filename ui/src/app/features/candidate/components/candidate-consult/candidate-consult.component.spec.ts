import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateConsultComponent } from './candidate-consult.component';

describe('CandidateConsultComponent', () => {
  let component: CandidateConsultComponent;
  let fixture: ComponentFixture<CandidateConsultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateConsultComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CandidateConsultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
