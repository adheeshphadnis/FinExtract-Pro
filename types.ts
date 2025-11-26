export interface TableData {
  sheetName: string;
  rows: (string | number | null)[][];
  description?: string;
}

export interface ExtractionResult {
  tables: TableData[];
  reportTitle?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface FileState {
  file: File | null;
  previewUrl: string | null;
}
