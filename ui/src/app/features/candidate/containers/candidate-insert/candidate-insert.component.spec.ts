import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateInsertComponent } from './candidate-insert.component';

describe('CandidateInsertComponent', () => {
  let component: CandidateInsertComponent;
  let fixture: ComponentFixture<CandidateInsertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateInsertComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CandidateInsertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
