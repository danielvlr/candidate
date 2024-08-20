import { PageEvent } from "@angular/material/paginator";

export type PageResponse<T> = {
  content: T[],
  metadata: {
    totalPages: number,
    totalElements: number,
    number: number,
  }
}

export class Paginator {
  page: number;
  size: number;

  constructor(page: PageEvent) {
    this.page = page.pageIndex;
    this.size = page.pageSize
  }
}
