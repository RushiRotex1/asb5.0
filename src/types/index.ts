export interface DropdownField {
  cell: string;
  label: string;
  value: string;
  options: string[];
}

export interface SheetData {
  dropdowns: DropdownField[];
  results: string[][];
}

export interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  sheetName: string;
}

export interface ApplicationType {
  name: string;
  description: string;
}

export interface ResultOption {
  text: string;
  rowIndex: number;
}

export interface ExtendedQuestion {
  cell: string;
  label: string;
  description?: string;
  range: string;
  type: 'dropdown' | 'searchable' | 'compatibility-chart';
  compatibilityRange?: string;
  tableRange?: string;
}

export interface MediaCompatibilityRow {
  bodyMaterial: string;
  mediaCompatibility: string;
  costComparison: string;
}

export interface GasResultSelectionOption {
  rowNumber: number;
  column: string;
  value: string;
  description: string;
}

export interface GasResultSelectionResponse {
  step: string;
  title: string;
  options: GasResultSelectionOption[];
}