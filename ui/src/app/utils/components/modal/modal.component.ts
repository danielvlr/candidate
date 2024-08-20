import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DynamicModule } from 'ng-dynamic-component';
import { ModalType } from '../../interfaces/global.interface';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTooltipModule, DynamicModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent<C, O = any> {
  public inputs = {
    content: this.data.content,
  };

  public outputs: any = {
    closeEmit: (data?: O) => this.close(data),
  };

  constructor(
    private readonly _dialogRef: MatDialogRef<ModalComponent<C, O>>,
    @Inject(MAT_DIALOG_DATA) public data: ModalType<C>
  ) {}

  public close(data?: O) {
    this._dialogRef.close(data);
  }
}
