import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { CandidateHistoricDTO } from '../entities/candidate.entity';

@Injectable({
  providedIn: 'any',
})
export class CandidateFormInsertService {
  private _form = new FormGroup({
    id: new FormControl<number | null>(null),
    nome: new FormControl<string | null>(null),
    profissao: new FormControl<string | null>(null),
    habilidades: new FormControl<string | null>(null),
    observacao: new FormControl<string | null>(null),
    pretensaoSalarial: new FormControl<string | null>(null),
    telefone: new FormControl<string | null>(null),
    linkedin: new FormControl<string | null>(null),
    historicoDeContato: new FormControl<CandidateHistoricDTO[] | null>([]),
  });

  get form(): FormGroup {
    return this._form;
  }
}
