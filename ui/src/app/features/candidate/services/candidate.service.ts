import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { lastValueFrom, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { removeNullAndUndefined } from '../../../utils/helpers/remove-null-and-undefined.helper';
import { toPageResponse } from '../../../utils/helpers/to-page-response.helper';
import { PageResponse } from '../../../utils/interfaces/page-response.interface';
import { CandidateDTO } from './entities/candidate.entity';

@Injectable({
  providedIn: 'any',
})
export class CandidateService {
  public searchLoading = signal<boolean>(false);
  public getByIDLoading = signal<boolean>(false);
  public editLoading = signal<boolean>(false);
  public addLoading = signal<boolean>(false);

  public dataCandidates = signal<CandidateDTO[]>([]);
  public dataCandidate = signal<CandidateDTO | null>(null);

  public totalCandidates = signal<number>(0);

  private readonly _http = inject(HttpClient);

  public getCandidates(page: any, query?: string): Promise<PageResponse<CandidateDTO>> {
    let queryString = {
      ...page,
      q: query ?? ''
    };

    this.searchLoading.set(true);

    return lastValueFrom(
      this._http
        .get(`${environment.API}/candidato?${ new URLSearchParams(queryString).toString() }`)
        .pipe(map((res) => toPageResponse<CandidateDTO>(res)))
        .pipe(tap((res) => this.dataCandidates.set(res.content)))
        .pipe(tap((res) => this.totalCandidates.set(res.metadata.totalElements)))
    ).finally(() => this.searchLoading.set(false));
  }

  public getCandidateByID(id: number): Promise<CandidateDTO> {
    this.getByIDLoading.set(true);

    return lastValueFrom(
      this._http
        .get<CandidateDTO>(`${ environment.API }/candidato/${ id }`)
        .pipe(tap((res) => this.dataCandidate.set(res)))
    ).finally(() => this.getByIDLoading.set(false));
  }

  public addCandidate(item: CandidateDTO) {
    this.addLoading.set(true);

    return lastValueFrom(
      this._http.post<CandidateDTO>(`${environment.API}/candidato/`, removeNullAndUndefined<CandidateDTO>(item))
    ).finally(() => this.addLoading.set(false));
  }

  public editCandidate(item: CandidateDTO): Promise<CandidateDTO> {
    this.editLoading.set(true);

    return lastValueFrom(
      this._http.put<CandidateDTO>(`${ environment.API }/candidato/${ item.id }`, item )
    ).finally(() => this.editLoading.set(false))
  }
}
