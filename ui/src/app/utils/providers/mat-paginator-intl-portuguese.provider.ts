import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable()
export class MatPaginatorIntlPortuguese extends MatPaginatorIntl {
  public override itemsPerPageLabel: string = 'Itens por página';
  public override nextPageLabel: string     = 'Próxima página';
  public override previousPageLabel: string = 'Página anterior';
  public override firstPageLabel: string    = 'Primeira página';
  public override lastPageLabel: string     = 'Última página';

  public override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `0 de ${length}`;
    }
    const startIndex = page * pageSize;
    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex = startIndex < length ?
        Math.min(startIndex + pageSize, length) :
        startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} de ${length}`;
  }
}
