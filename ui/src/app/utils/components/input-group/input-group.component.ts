import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'input-group',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './input-group.component.html',
  styleUrl: './input-group.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputGroupComponent),
      multi: true
    }
  ]
})
export class InputGroupComponent implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() inputLabel: string | null = null;
  @Input() prefix: boolean = false;
  @Input() sufix: boolean = false;
  @Input() prefixIcon: string | null = null;
  @Input() sufixIcon: string | null = null;

  onChange: any = () => {};
  onTouched: any = () => {};

  public writeValue(obj: any): void {
    throw new Error('Method not implemented.');
  }
  public registerOnChange(fn: any): void {
    throw new Error('Method not implemented.');
  }
  public registerOnTouched(fn: any): void {
    throw new Error('Method not implemented.');
  }
  public setDisabledState?(isDisabled: boolean): void {
    throw new Error('Method not implemented.');
  }
}
