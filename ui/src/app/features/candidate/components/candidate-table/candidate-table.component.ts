import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { EnumType, PAGINATION_OPTIONS } from '../../../../utils/interfaces/global.interface';
import { CandidateColumns } from '../../candidate.config';
import { Paginator } from './../../../../utils/interfaces/page-response.interface';
import { CandidateDTO } from './../../services/entities/candidate.entity';


@Component({
  selector: 'app-candidate-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSelectModule],
  templateUrl: './candidate-table.component.html',
  styleUrl: './candidate-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateTableComponent implements OnChanges {
  public columnsEnum: EnumType[] = CandidateColumns;
  public columns: string[] = CandidateColumns.map(col => (col.key));
  public dataSource = new MatTableDataSource<CandidateDTO>();

  @Input() data: CandidateDTO[] = [];
  @Input() total: number = 0;

  @Output() detailsEmit = new EventEmitter<number>();
  @Output() pageEmit = new EventEmitter<Paginator>();

  get pageSizeOptions() {
    return PAGINATION_OPTIONS;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if(changes['data']) {
      this.dataSource.data = changes['data'].currentValue;
    }
  }

  public openDetailModal(id: number) {
    this.detailsEmit.emit(id);
  }

  public pageHandle(page: PageEvent) {
    this.pageEmit.emit(new Paginator(page));
  }
}
