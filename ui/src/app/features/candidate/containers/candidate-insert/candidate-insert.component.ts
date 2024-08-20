import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxCurrencyDirective } from 'ngx-currency';
import { NgxMaskDirective } from 'ngx-mask';
import { forkJoin, lastValueFrom } from 'rxjs';
import { InputGroupComponent } from '../../../../utils/components/input-group/input-group.component';
import { CandidateHistoricComponent } from '../../components/candidate-historic/candidate-historic.component';
import { CandidateHistoricService } from '../../services/candidate-historic.service';
import { CandidateService } from '../../services/candidate.service';
import {
  CandidateDTO,
  CandidateHistoricDTO,
} from '../../services/entities/candidate.entity';
import { CandidateFormInsertService } from '../../services/forms/candidate-form-insert.service';

@Component({
  selector: 'app-candidate-insert',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CandidateHistoricComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    InputGroupComponent,
    NgxMaskDirective,
    NgxCurrencyDirective
  ],
  templateUrl: './candidate-insert.component.html',
  styleUrl: './candidate-insert.component.scss',
  providers: [CandidateFormInsertService],
})
export class CandidateInsertComponent implements OnInit {
  private readonly _formService = inject(CandidateFormInsertService);
  private readonly _service = inject(CandidateService);
  private readonly _historicService = inject(CandidateHistoricService);

  public historicList: CandidateHistoricDTO[] = [];

  get formGroup(): FormGroup {
    return this._formService.form;
  }

  get historicControl() {
    return this.formGroup.get('historicoDeContato')!;
  }

  @Input() content: number | null = null;

  @Output() closeEmit = new EventEmitter<void>();

  constructor() {
    effect(() => {
      if (this._service.dataCandidate())
        this._formService.form.setValue(this._service.dataCandidate()!);

      console.log(this._service.dataCandidate());
    });
  }

  public ngOnInit(): void {
    if (this.content) {
      this._service
        .getCandidateByID(this.content)
        .catch((err) => console.error(err));
    }
  }

  public onSave(item: CandidateDTO) {
    if (item.id)
      this._service
        .editCandidate(item)
        .then((_) => this.closeEmit.emit())
        .catch((err) => console.error(err.message));
    else this._addCandidate(item);
  }

  public historicUpdate(event: CandidateHistoricDTO[]) {
    this.historicList = event
  }

  private _addCandidate(item: CandidateDTO) {
    this._service
      .addCandidate(item)
      .then((res) => {
        if (!item.id)
          this._addHistoricItem(res.id!, this.historicList)?.then((_) =>
            this.closeEmit.emit()
          );
      })
      .catch((err) => console.error(err.message));
  }

  private _addHistoricItem(
    candidateID: number,
    historic: CandidateHistoricDTO[]
  ) {
    console.log(historic);

    if (historic.length === 0) return;

    let requests = historic.map((res) =>
      this._historicService.addHistoricItem(candidateID, res)
    );

    return lastValueFrom(forkJoin(requests));
  }
}
