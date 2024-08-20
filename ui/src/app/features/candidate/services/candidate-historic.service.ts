import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { removeNullAndUndefined } from '../../../utils/helpers/remove-null-and-undefined.helper';
import { CandidateHistoricDTO } from './entities/candidate.entity';

@Injectable({
  providedIn: 'any',
})
export class CandidateHistoricService {
  private readonly _http = inject(HttpClient);

  private addHistoricLoading = signal<boolean>(false);

  public addHistoricItem(
    candidateID: number,
    item: CandidateHistoricDTO
  ): Promise<CandidateHistoricDTO> {
    this.addHistoricLoading.set(true);

    return lastValueFrom(
      this._http.post<CandidateHistoricDTO>(
        `${environment.API}/candidato/${candidateID}/historico-de-contato/`,
        removeNullAndUndefined(item)
      )
    ).finally(() => this.addHistoricLoading.set(false));
  }

  public getHistoricItems(
    candidateID: number
  ): Promise<CandidateHistoricDTO[]> {
    return lastValueFrom(
      this._http.get<CandidateHistoricDTO[]>(
        `${environment.API}/candidato/${candidateID}/historico-de-contato`
      )
    );
  }

  public removeHistoricItem(
    candidateID: number,
    historicID: number
  ): Promise<void> {
    return lastValueFrom(
      this._http.get<void>(
        `${environment.API}/candidato/${candidateID}/historico-de-contato/${historicID}`
      )
    );
  }
}
