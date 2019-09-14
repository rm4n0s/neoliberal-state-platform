export interface PaginationI {
  page: number;
  size: number;
}

export interface ListPaginatedI<T> {
  page: number;
  totalPages: number;
  total: number;
  size: number;
  data: T[];
}
