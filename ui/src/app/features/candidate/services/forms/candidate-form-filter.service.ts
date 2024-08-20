import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  filter,
} from 'rxjs';

@Injectable({
  providedIn: 'any',
})
export class CandidateFormFilterService {
  public queryChanged$ = new BehaviorSubject<string>('');

  private _form = new FormGroup({
    q: new FormControl<string | null>(null),
  });

  get form(): FormGroup {
    return this._form;
  }

  constructor() {
    this._form.valueChanges
      .pipe(
        debounceTime(300),
        filter((value) => value.q!.length >= 3 || value.q === ''),
        distinctUntilChanged()
      )
      .subscribe((res) => this.queryChanged$.next(res.q ?? ''));
  }
}
