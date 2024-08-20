import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateIndexComponent } from './candidate-index.component';

describe('CandidateIndexComponent', () => {
  let component: CandidateIndexComponent;
  let fixture: ComponentFixture<CandidateIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateIndexComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CandidateIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
