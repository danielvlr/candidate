import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'any',
})
export class CandidateFormHistoricService {
  private _form = new FormGroup({
    id: new FormControl<number | null>(null),
    data: new FormControl<string | null>(null),
    headhunter: new FormControl<string | null>(null),
    descricao: new FormControl<string | null>(null),
  });

  get form(): FormGroup {
    return this._form;
  }
}
