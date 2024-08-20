import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { map } from 'rxjs';
import { DatepickerComponent } from '../../../../utils/components/datepicker/datepicker.component';
import { removeNullAndUndefined } from '../../../../utils/helpers/remove-null-and-undefined.helper';
import { EnumType } from '../../../../utils/interfaces/global.interface';
import {
  CandidateHistoricColumns,
  FeedbackHistoricTableEditableEnum,
  IconsHistoricTableEditableEnum,
} from '../../candidate.config';
import { CandidateHistoricService } from '../../services/candidate-historic.service';
import { CandidateHistoricDTO } from '../../services/entities/candidate.entity';

@Component({
  selector: 'app-candidate-historic',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    DatePipe,
    MatNativeDateModule,
    MatDatepickerModule,
    DatepickerComponent
  ],
  templateUrl: './candidate-historic.component.html',
  styleUrl: './candidate-historic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateHistoricComponent implements OnChanges {
  private readonly _historicService = inject(CandidateHistoricService);

  public columnsEnum: EnumType[] = CandidateHistoricColumns;
  public columns: string[] = CandidateHistoricColumns.map((col) => col.key);
  public form = new FormGroup<any>({
    rows: new FormArray([]),
  });
  public formArray = this.form.get('rows') as FormArray;
  public dataSource = new MatTableDataSource(this.formArray.controls);

  get feedbackHistoricTableEditable() {
    return FeedbackHistoricTableEditableEnum as any;
  }

  get iconsHistoricTableEditable() {
    return IconsHistoricTableEditableEnum as any;
  }

  @Input() list: CandidateHistoricDTO[] = [];
  @Input() candidateID: number | null = null;

  @Output() historicUpdateEmit = new EventEmitter();

  constructor() {
    this.formArray
      .valueChanges
      .pipe(map(val => val.map((item: any) => {
        delete item.origin;

        return removeNullAndUndefined(item)
      })))
      .subscribe(res => {
        this.historicUpdateEmit.emit(res);
      })
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['list'].currentValue.length) {
      changes['list']
        .currentValue
        .forEach((res: any) => {
          this.formArray.push(this._createForm(false, res))
        })

        this._updateTable();
    }
  }

  public addItem() {
    this.formArray.push(this._createForm(true));

    this._updateTable();
  }

  public editItem(index: number) {
    this.formArray.at(index).enable();
  }

  public removeItem(index: number) {
    this.formArray.removeAt(index);
    this._updateTable();
  }

  public saveEdit(index: number) {
    if (this.candidateID) this._addHistoricItem(this.candidateID, index);
    else this.formArray.at(index).disable();
  }

  public cancelEdit(index: number) {
    let origin = this.formArray.at(index)?.get('origin')?.value;

    this.formArray.at(index)?.patchValue({
      id: origin.id,
      data: origin.data,
      headhunter: origin.headhunter,
      descricao: origin.descricao,
    });

    this.saveEdit(index);
  }

  public isEnable(index: number) {
    return this.formArray.at(index).enabled;
  }

  private _createForm(enable: boolean = false, list?: CandidateHistoricDTO) {
    return new FormGroup({
      id: new FormControl({ value: list?.id ?? null, disabled: !enable }),
      data: new FormControl({ value: list?.data ?? null, disabled: !enable }),
      headhunter: new FormControl({ value: list?.headhunter ?? null, disabled: !enable }),
      descricao: new FormControl({ value: list?.descricao ?? null, disabled: !enable }),
      origin: new FormControl({ value: list ?? null, disabled: !enable }),
    })
  }

  private _updateTable() {
    this.dataSource.data = this.formArray.controls;
  }

  private _getHistoricList(candidateID: number) {
    this._historicService
      .getHistoricItems(candidateID)
      .then(res => this.list = res)
      .catch(err => console.error(err))
  }

  private _addHistoricItem(candidateID: number, index: number) {
    this._historicService
      .addHistoricItem(candidateID!, this.formArray.at(index).value)
      .then(_ => {
        this.formArray.at(index).disable();
        this._getHistoricList(this.candidateID!)
      })
      .catch(err => console.error(err))
  }

  private _removeHistoricItem(candidateID: number, historicID: number) {
    this._historicService
      .removeHistoricItem(candidateID, historicID)
      .then(_ => this._getHistoricList(candidateID))
      .catch(err => console.error(err))
  }
}
