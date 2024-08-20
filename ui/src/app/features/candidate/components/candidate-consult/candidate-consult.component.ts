import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-candidate-consult',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './candidate-consult.component.html',
  styleUrl: './candidate-consult.component.scss'
})
export class CandidateConsultComponent {
  @Output() closeEmit = new EventEmitter<any>();

  public insert() {
    this.closeEmit.emit({ ok: 'deu certo!' })
  }
}
