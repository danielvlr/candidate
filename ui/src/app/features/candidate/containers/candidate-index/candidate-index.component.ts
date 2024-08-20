import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ModalComponent } from '../../../../utils/components/modal/modal.component';
import { PAGINATION_DEFAULT_OPTION } from '../../../../utils/interfaces/global.interface';
import { Paginator } from '../../../../utils/interfaces/page-response.interface';
import { CandidateFilterComponent } from '../../components/candidate-filter/candidate-filter.component';
import { CandidateTableComponent } from '../../components/candidate-table/candidate-table.component';
import { CandidateService } from '../../services/candidate.service';
import { CandidateFormFilterService } from '../../services/forms/candidate-form-filter.service';
import { CandidateInsertComponent } from '../candidate-insert/candidate-insert.component';

@Component({
  selector: 'app-candidate-index',
  standalone: true,
  imports: [
    CommonModule,
    CandidateTableComponent,
    CandidateFilterComponent,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './candidate-index.component.html',
  styleUrl: './candidate-index.component.scss',
})
export class CandidateIndexComponent implements OnInit {
  private readonly _dialog = inject(MatDialog);
  private readonly _service = inject(CandidateService);
  private readonly _formFilter = inject(CandidateFormFilterService);
  private readonly _paginator: Paginator = { page: 0, size: PAGINATION_DEFAULT_OPTION };
  private _statusFilter: string | undefined = undefined;

  get formFilter() {
    return this._formFilter.form;
  }

  get searchLoading() {
    return this._service.searchLoading();
  }

  get dataCandidates() {
    return this._service.dataCandidates();
  }

  get totalCandidates() {
    return this._service.totalCandidates();
  }

  public ngOnInit(): void {
    this._formFilter.queryChanged$.subscribe(res => {
      this.onSearch(res);
    });
  }

  public onSearch(res?: string) {
    this._statusFilter = res;

    this._service.getCandidates(this._paginator, res).catch((err) => console.error(err));
  }

  public openSearchLinkedinModal() {}

  public openDetailsModal(res?: any) {
    let dialogRef = this._dialog.open(ModalComponent<any>, {
      minWidth: '60vw',
      data: {
        title: 'Informações do candidato',
        component: CandidateInsertComponent,
        content: res,
      },
    });

    dialogRef.afterClosed().subscribe(_ => {
      this.onSearch();
    })
  }

  public onPage(page: Paginator) {
    this._service.getCandidates(page, this._statusFilter).catch((err) => console.error(err));
  }
}
