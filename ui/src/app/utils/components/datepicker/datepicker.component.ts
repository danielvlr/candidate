import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MAT_DATE_FORMATS, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxMaskDirective } from 'ngx-mask';

export const _DAY_FORMAT = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'datepicker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgxMaskDirective,
    FormsModule
  ],
  templateUrl: './datepicker.component.html',
  styleUrl: './datepicker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatepickerComponent),
      multi: true
    },
    { provide: MAT_DATE_FORMATS, useValue: _DAY_FORMAT },
  ]
})
export class DatepickerComponent implements ControlValueAccessor {
  public isDisabled: boolean = false;
  public dateControl = new FormControl()

  private _value: string = '';

  @Input() placeholder: string = '';
  @Input() initialValue: string = '';

  get value(): string {
    return this._value;
  }

  set value(val: string) {
    this._value = val;
    this.onChange(val);
    this.onTouched();
  }

  public onChange: any = () => {};
  public onTouched: any = () => {};

  public writeValue(value: any): void {
    this._value = this.formatDate(value);
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  public onInputChange(event: any): void {
    this._value = event.target.value;
    const parsedDate = this._value;
    this.onChange(parsedDate);
    this.onTouched();
  }

  public onDateSelected(): void {
    const parsedDate = this.parseDate(this._value);
    this.onChange(parsedDate);
    this.onTouched();
  }

  public formatDate(date: Date): string {
    if (date) {
      const day = ('0' + new Date(date).getDate()).slice(-2);
      const month = ('0' + (new Date(date).getMonth() + 1)).slice(-2);
      const year = new Date(date).getFullYear();
      return `${day}/${month}/${year}`;
    }
    return '';
  }

  public parseDate(value: string): Date | null {
    if (value) {
      const parts = value?.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    return null;
  }
}
