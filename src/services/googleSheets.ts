import { GoogleSheetsConfig, DropdownField } from '../types';

const SPREADSHEET_ID = '1rcR-VPUcsqPcwyPrrLFX_s-0kJB8okXit6RwVa0hbww';
const SHEET_NAME = 'String Builder';

// Dropdown cells and their corresponding label cells
const DROPDOWN_CELLS = [
  'B1', 'B11', 'B16', 'B22', 'B25', 'B30', 'B33', 'B36', 'B42', 'B52', 'B56', 'B62', 'B68'
];

class GoogleSheetsService {
  private apiKey: string = '';
  private isInitialized: boolean = false;

  initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.isInitialized = true;
  }

  private getApiUrl(range: string): string {
    return `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!${range}?key=${this.apiKey}`;
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Google Sheets service not initialized. Please provide API key.');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `Google Sheets API error: ${response.statusText}`;
      
      try {
        const errorBody = await response.json();
        if (errorBody.error && errorBody.error.message) {
          errorMessage = `Google Sheets API error: ${errorBody.error.message}`;
        }
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        errorMessage = `Google Sheets API error: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getDropdownLabels(): Promise<{ [key: string]: string }> {
    // Get labels from column A for each dropdown row
    const labelCells = DROPDOWN_CELLS.map(cell => `A${cell.substring(1)}`);
    const range = `A1:A68`;
    
    try {
      const response = await this.makeRequest(this.getApiUrl(range));
      const values = response.values || [];
      
      const labels: { [key: string]: string } = {};
      DROPDOWN_CELLS.forEach((cell, index) => {
        const row = parseInt(cell.substring(1)) - 1;
        labels[cell] = values[row] ? values[row][0] || `Field ${index + 1}` : `Field ${index + 1}`;
      });
      
      return labels;
    } catch (error) {
      console.error('Error fetching labels:', error);
      // Fallback labels
      const fallbackLabels: { [key: string]: string } = {};
      DROPDOWN_CELLS.forEach((cell, index) => {
        fallbackLabels[cell] = `Field ${index + 1}`;
      });
      return fallbackLabels;
    }
  }

  async getDropdownValues(): Promise<{ [key: string]: string }> {
    // Get current values from dropdown cells using batchGet
    const ranges = DROPDOWN_CELLS.map(cell => `${SHEET_NAME}!${cell}`);
    const rangeParam = ranges.join('&ranges=');
    const batchGetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?ranges=${rangeParam}&key=${this.apiKey}`;
    
    try {
      const response = await this.makeRequest(batchGetUrl);
      const values: { [key: string]: string } = {};
      
      DROPDOWN_CELLS.forEach((cell, index) => {
        const valueRange = response.valueRanges && response.valueRanges[index];
        values[cell] = valueRange && valueRange.values && valueRange.values[0] ? valueRange.values[0][0] || '' : '';
      });
      
      return values;
    } catch (error) {
      console.error('Error fetching dropdown values:', error);
      const emptyValues: { [key: string]: string } = {};
      DROPDOWN_CELLS.forEach(cell => {
        emptyValues[cell] = '';
      });
      return emptyValues;
    }
  }

  async updateDropdownValues(values: { [key: string]: string }): Promise<void> {
    // Update multiple cells with new values
    const requests = Object.entries(values).map(([cell, value]) => ({
      range: `${SHEET_NAME}!${cell}`,
      values: [[value]]
    }));

    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate?key=${this.apiKey}`;
    
    await this.makeRequest(batchUpdateUrl, {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: requests
      })
    });
  }

  async getResults(): Promise<string[][]> {
    const range = 'CE76:CE95';
    
    try {
      const response = await this.makeRequest(this.getApiUrl(range));
      return response.values || [];
    } catch (error) {
      console.error('Error fetching results:', error);
      return [];
    }
  }

  async getDropdownOptions(): Promise<{ [key: string]: string[] }> {
    // Define the specific ranges for each dropdown cell based on data validation formulas
    const dropdownRanges: { [key: string]: string } = {
      'B1': 'String Builder!A2:C10',
      'B11': 'Sheet2!D14:D16',
      'B16': 'Sheet2!B19:B22',
      'B22': 'Sheet2!A19:A20',
      'B25': 'Sheet2!E14:E16',
      'B30': 'Sheet2!C27:C39',
      'B33': 'Sheet2!A47:A75',
      'B36': 'Sheet2!C47:C56',
      'B42': 'Sheet2!D47:D48',
      'B52': 'Sheet2!B47:B68',
      'B56': 'Sheet2!C71:C75',
      'B62': 'Sheet2!E47:E52',
      'B68': 'Sheet2!E53:E55'
    };
    
    try {
      const options: { [key: string]: string[] } = {};
      
      // Fetch options for each dropdown cell from its specific range
      for (const [cell, range] of Object.entries(dropdownRanges)) {
        try {
          const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${this.apiKey}`;
          const response = await this.makeRequest(apiUrl);
          const values = response.values || [];
          
          // Extract options from the range
          const cellOptions: string[] = [];
          
          if (cell === 'B1') {
            // For B1, range is A2:C10 - collect all non-empty values from all columns
            values.forEach(row => {
              if (row && Array.isArray(row)) {
                row.forEach(value => {
                  if (value && value.trim() !== '') {
                    cellOptions.push(value.trim());
                  }
                });
              }
            });
          } else {
            // For other cells, collect values from single column ranges
            values.forEach(row => {
              if (row && row[0] && row[0].trim() !== '') {
                cellOptions.push(row[0].trim());
              }
            });
          }
          
          options[cell] = cellOptions;
        } catch (error) {
          console.error(`Error fetching options for ${cell}:`, error);
          options[cell] = [`Option 1 for ${cell}`, `Option 2 for ${cell}`]; // fallback
        }
      }
      
      return options;
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
      // Return default options if fetch fails
      const defaultOptions: { [key: string]: string[] } = {};
      DROPDOWN_CELLS.forEach(cell => {
        defaultOptions[cell] = ['Option 1', 'Option 2', 'Option 3'];
      });
      return defaultOptions;
    }
  }

  getDropdownCells(): string[] {
    return DROPDOWN_CELLS;
  }
}

export const googleSheetsService = new GoogleSheetsService();