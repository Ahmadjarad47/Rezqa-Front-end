export interface ExportOptions {
  download?: boolean;
  lineDelimiter?: string;
  columnDelimiter?: string;
  filename?: string;
  tableName?: string;
  space?: number;
}

export interface DataTableOptions {
  classes: {
    top: string;
    dropdown: string;
    selector: string;
    search: string;
    input: string;
    container: string;
    bottom: string;
    info: string;
    pagination: string;
  };
  paging?: boolean;
  perPageSelect?: boolean;
  searchable?: boolean;
  scrollY: string;
  labels: {
    perPage: string;
    placeholder: string;
    searchTitle: string;
  };
}
