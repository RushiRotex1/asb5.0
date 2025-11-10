// Google Apps Script service
import { GOOGLE_APPS_SCRIPT_URL } from '../constants/googleAppsScript';

// Verify URL format
const verifyUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'script.google.com' && 
           urlObj.pathname.includes('/macros/s/') && 
           url.endsWith('/exec');
  } catch {
    return false;
  }
};

export class GoogleAppsScriptService {
  private baseUrl: string;
  public isInitialized: boolean = false;

  constructor() {
    this.baseUrl = GOOGLE_APPS_SCRIPT_URL;
    
    // Verify URL format on initialization
    if (!verifyUrl(this.baseUrl)) {
      console.error('Invalid Google Apps Script URL format:', this.baseUrl);
      console.error('URL should be: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
      console.warn(`Invalid Google Apps Script URL format: ${this.baseUrl}`);
      console.warn('URL should be: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
      this.isInitialized = false;
      return;
    } else {
      this.isInitialized = true;
    }
  }

  initialize(scriptUrl: string): void {
    this.baseUrl = scriptUrl;
    
    // Verify URL format on initialization
    if (!verifyUrl(this.baseUrl)) {
      console.error('Invalid Google Apps Script URL format:', this.baseUrl);
      console.error('URL should be: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
      this.isInitialized = false;
    } else {
      this.isInitialized = true;
    }
    
    console.log('🚀 Initialized with optimized Google Apps Script');
  }

  private async makeRequest(action: string, data?: any, retries = 3): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Google Apps Script service not initialized. Please provide script URL.');
    }

    console.log('🔍 DEBUG: Making request for action:', action);
    if (data) {
      console.log('🔍 DEBUG: Request data:', data);
    }

    // Retry logic for network issues
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.attemptRequest(action, data, false, attempt);
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt} failed:`, error);
        
          console.warn('Network error detected. Possible causes:');
          console.warn('1. Google Apps Script not deployed as web app');
          console.warn('2. Deployment permissions not set to "Anyone"');
          console.warn('3. Incorrect URL - should end with /exec');
          console.warn('4. Network connectivity issues');
          console.warn('Current URL:', this.baseUrl);
      }
    }
    
    // If all retries failed, provide detailed troubleshooting information
    throw new Error('Google Apps Script connection failed');
  }

  private async attemptRequest(action: string, data?: any, useFormData: boolean = false, attempt: number = 1): Promise<any> {
    try {
      let response;
      
      // Use GET request for ALL actions - no POST requests
      console.log(`⚡ Attempt ${attempt}: GET request for ${action}`);
      const url = new URL(this.baseUrl);
      url.searchParams.append('action', action);
      
      // Add data as URL parameters for GET requests
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          url.searchParams.append(key, encodeURIComponent(String(value)));
        });
      }
      
      try {
        response = await fetch(url.toString(), {
          method: 'GET',
          mode: 'cors',
          redirect: 'follow',
          cache: 'no-cache',
          headers: {
            'Accept': 'application/json',
          }
        });
      } catch (getError) {
        console.error(`GET request failed: ${getError}`);
        throw getError;
      }
      
      if (!data) {
        console.log(`⚡ Attempt ${attempt}: GET request for ${action}`);
        const url = new URL(this.baseUrl);
        url.searchParams.append('action', action);
        
        try {
          response = await fetch(url.toString(), {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow',
            cache: 'no-cache',
            headers: {
              'Accept': 'application/json',
            }
          });
        } catch (getError) {
          console.log(`GET failed, trying POST: ${getError}`);
          // Fallback to POST with FormData
          const formData = new FormData();
          formData.append('action', action);
          
          response = await fetch(this.baseUrl, {
            method: 'POST',
            body: formData,
            mode: 'cors',
            redirect: 'follow',
            cache: 'no-cache'
          });
        }
      } else {
        // Use POST with FormData for requests with data
        console.log(`⚡ Attempt ${attempt}: POST request for ${action}`);
        const formData = new FormData();
        formData.append('action', action);
        if (data) {
          Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
          });
        }
        
        response = await fetch(this.baseUrl, {
          method: 'POST',
          body: formData,
          mode: 'cors',
          redirect: 'follow',
          cache: 'no-cache'
        });
      }
      
      console.log(`🔍 DEBUG: Response ${response.status} for ${action}`);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log(`🔍 DEBUG: Raw response text for ${action}:`, responseText.substring(0, 500) + '...');
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log(`🔍 DEBUG: Parsed JSON result for ${action}:`, result);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error(`Invalid JSON response from Google Apps Script: ${responseText.substring(0, 200)}...`);
      }
      
      if (!result.success) {
        throw new Error(`Optimized Script error: ${result.error || 'Unknown error occurred'}`);
      }
      
      console.log(`🔍 DEBUG: Returning result.data for ${action}:`, result.data);
      return result.data;
    } catch (error) {
      console.error(`Google Apps Script request failed (attempt ${attempt}):`, error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Network error detected - Google Apps Script deployment issue
        throw new Error('Failed to fetch');
      }
      
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Request failed: ${String(error)}`);
      }
    }
  }

  private getDetailedErrorMessage(error: any): string {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return `Google Apps Script deployment not accessible. Please check:

1. Go to script.google.com and open your project
2. Click "Deploy" → "Manage deployments"
3. Ensure deployment type is "Web app"
4. Set "Execute as: Me (your email)"
5. Set "Who has access: Anyone"
6. Copy the Web app URL and update GOOGLE_APPS_SCRIPT_URL
7. The URL should end with '/exec'

Current URL: ${this.baseUrl}`;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return `Connection failed: ${String(error)}`;
  }

  async testConnection(): Promise<any> {
    try {
      console.log('🚀 Testing optimized Google Apps Script connection...');
      const result = await this.makeRequest('testConnection');
      console.log('✅ Optimized connection successful:', result.version || result.message);
      return result;
    } catch (error) {
      console.error('Test connection failed:', error);
      throw new Error(this.getDetailedErrorMessage(error));
    }
  }

  async getDropdownLabels(): Promise<{ [key: string]: string }> {
    try {
      console.log('⚡ Fetching labels with optimized batch retrieval...');
      const result = await this.makeRequest('getLabels');
      return result;
    } catch (error) {
      console.error('Failed to fetch labels:', error);
      throw error;
    }
  }

  async getDropdownValues(): Promise<{ [key: string]: string }> {
    try {
      console.log('⚡ Fetching values with optimized batch retrieval...');
      const result = await this.makeRequest('getValues');
      return result;
    } catch (error) {
      console.error('Failed to fetch values:', error);
      throw error;
    }
  }

  async getDropdownOptions(): Promise<{ [key: string]: string[] }> {
    try {
      console.log('⚡ Fetching options with ultra-fast processing...');
      const result = await this.makeRequest('getOptions');
      
      // Filter out #N/A values from all options
      const filteredResult: { [key: string]: string[] } = {};
      Object.entries(result).forEach(([cell, options]) => {
        if (Array.isArray(options)) {
          filteredResult[cell] = options.filter(option => 
            option && 
            option.toString().trim() !== '' && 
            !option.toString().includes('#N/A') && 
            !option.toString().includes('#NA') &&
            !option.toString().includes('N/A')
          );
        } else {
          filteredResult[cell] = [];
        }
      });
      
      const singleOptions = Object.entries(result).filter(([_, options]) => options.length === 1).length;
      const totalCells = Object.keys(result).length;
      console.log(`📊 Ultra-fast options loaded: ${singleOptions}/${totalCells} cells have single options`);
      
      return filteredResult;
    } catch (error) {
      console.error('Failed to fetch options:', error);
      throw error;
    }
  }

  async updateDropdownValue(cell: string, value: string): Promise<void> {
    try {
      console.log(`⚡ Ultra-fast update ${cell}:`, value);
      
      const result = await this.makeRequest('updateValue', { cell, value });
      
      return result;
    } catch (error) {
      console.error(`Failed to update ${cell}:`, error);
      throw error;
    }
  }

  async clearAllValues(): Promise<void> {
    try {
      console.log('⚡ Ultra-fast batch clearing all values...');
      const result = await this.makeRequest('clearAllValues');
      console.log(`✅ Ultra-fast batch clear: ${result.clearedCount}/${result.totalCells} cells in ${result.executionTime || 'N/A'}ms`);
    } catch (error) {
      console.error('Failed to clear values:', error);
      throw error;
    }
  }
  
  async getResults(): Promise<string[][]> {
    try {
      console.log('🔍 DEBUG: Fetching result selection options from CE76:CE95...');
      
      // Add a small delay to ensure calculations are complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await this.makeRequest('getResults');
      
      console.log('🔍 DEBUG: Raw result from Google Apps Script:', result);
      console.log('🔍 DEBUG: Result type:', typeof result);
      console.log('🔍 DEBUG: Is array:', Array.isArray(result));
      
      // Check if it's the new structured format
      if (result && typeof result === 'object' && result.options && Array.isArray(result.options)) {
        console.log('🔍 DEBUG: Structured result format detected with', result.options.length, 'options');
        
        // Convert structured format to 2D array for compatibility
        const arrayResult = result.options.map((option: any) => [option.value || '']);
        console.log('🔍 DEBUG: Converted to array format:', arrayResult);
        return arrayResult;
      }
      
      // Handle legacy array format
      if (Array.isArray(result)) {
        console.log('🔍 DEBUG: Legacy array format detected:', result.length, 'rows');
        return result;
      }
      
      // Handle wrapped data format
      if (result && typeof result === 'object' && result.data && Array.isArray(result.data)) {
        console.log('🔍 DEBUG: Wrapped data format detected');
        return result.data;
      }
      
      console.error('❌ DEBUG: Unexpected result format:', result);
      throw new Error('Unexpected result format from Google Apps Script');
    } catch (error) {
      console.error('❌ DEBUG: Failed to fetch results:', error);
      throw error;
    }
  }

  async getApplicationTypes(): Promise<{ name: string; description: string }[]> {
    try {
      console.log('⚡ Fetching application types with ultra-fast range processing...');
      const result = await this.makeRequest('getApplicationTypes');
      
      if (Array.isArray(result)) {
        return result;
      }
      
      console.warn('Unexpected application types structure:', result);
      return [];
    } catch (error) {
      console.error('Failed to fetch application types:', error);
      // Return empty array with fallback data to prevent app crash
      return [];
    }
  }

  // NEW: Individual auto-selection methods
  async checkSingleOption(cell: string): Promise<any> {
    try {
      console.log(`🔍 Google Apps Script: Checking if ${cell} has single option...`);
      const result = await this.makeRequest('checkSingleOption', { cell });
      console.log(`🔍 Google Apps Script result for ${cell}:`, result);
      return result;
    } catch (error) {
      console.error(`Failed to check single option for ${cell}:`, error);
      throw error;
    }
  }

  async autoSelectCell(cell: string): Promise<any> {
    try {
      console.log(`🚀 Google Apps Script: Auto-selecting ${cell}...`);
      const result = await this.makeRequest('autoSelectCell', { cell });
      console.log(`🚀 Google Apps Script auto-select result for ${cell}:`, result);
      return result;
    } catch (error) {
      console.error(`Failed to auto-select ${cell}:`, error);
      throw error;
    }
  }

  // Optimized: Ultra-fast auto-selection method
  async autoSelectSingleOptions(): Promise<any> {
    try {
      console.log('🚀 Triggering ultra-fast batch auto-selection...');
      const result = await this.makeRequest('autoSelectSingleOptions');
      console.log(`✅ Ultra-fast auto-selection: ${result.autoSelected.length} selected in ${result.executionTime}ms`);
      return result;
    } catch (error) {
      throw error;
    }
  }

  getDropdownCells(): string[] {
    return ['B1', 'B11', 'B16', 'B22', 'B25', 'B30', 'B33', 'B36', 'B42', 'B52', 'B56', 'B62', 'B68'];
  }

  async processResultSelection(selectedValue: string, selectedDescription?: string): Promise<any> {
    try {
      console.log(`⚡ Processing result selection: "${selectedValue}"`);
      const result = await this.makeRequest('processResultSelection', { 
        selectedValue, 
        selectedDescription 
      });
      console.log('✅ Result selection processed:', result);
      return result;
    } catch (error) {
      console.error('Failed to process result selection:', error);
      throw error;
    }
  }

  async populateFromRLR(rlr: number): Promise<any> {
    try {
      console.log(`⚡ Populating cells using RLR: ${rlr}...`);
      const result = await this.makeRequest('populateFromRLR', { rlr });
      console.log('✅ RLR population completed:', result);
      return result;
    } catch (error) {
      console.error('Failed to populate from RLR:', error);
      throw error;
    }
  }

  async populateFromReference(targetCell: string, sourceCell: string): Promise<any> {
    try {
      console.log(`⚡ Populating ${targetCell} from ${sourceCell}...`);
      const result = await this.makeRequest('populateFromReference', { targetCell, sourceCell });
      console.log(`✅ Population completed: ${targetCell} ← ${sourceCell}`);
      return result;
    } catch (error) {
      console.error(`Failed to populate ${targetCell} from ${sourceCell}:`, error);
      throw error;
    }
  }

  async getSearchableOptions(range: string): Promise<string[]> {
    try {
      console.log(`⚡ Fetching searchable options from ${range}...`);
      
      // Use GET request with URL parameters
      const url = new URL(this.baseUrl);
      url.searchParams.append('action', 'getSearchableOptions');
      url.searchParams.append('range', range);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (!result.success) {
        throw new Error(`Script error: ${result.error}`);
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch searchable options:', error);
      throw error;
    }
  }

  async getMediaCompatibilityChart(range: string): Promise<any[]> {
    try {
      console.log(`⚡ Fetching media compatibility chart from ${range}...`);
      
      // Use GET request with URL parameters
      const url = new URL(this.baseUrl);
      url.searchParams.append('action', 'getMediaCompatibilityChart');
      url.searchParams.append('range', range);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (!result.success) {
        throw new Error(`Script error: ${result.error}`);
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch media compatibility chart:', error);
      throw error;
    }
  }

  async getFinalResults(): Promise<string[][]> {
    try {
      console.log('⚡ Fetching final results from A198:W209...');
      const result = await this.makeRequest('getFinalResults');
      return result;
    } catch (error) {
      console.error('Failed to fetch final results:', error);
      throw error;
    }
  }

  async clearExtendedCells(): Promise<void> {
    try {
      console.log('⚡ Clearing extended question cells...');
      const result = await this.makeRequest('clearExtendedCells');
      console.log('✅ Extended cells cleared');
    } catch (error) {
      console.error('Failed to clear extended cells:', error);
      throw error;
    }
  }

  async getExtendedLabels(): Promise<{ [key: string]: string }> {
    try {
      console.log('⚡ Fetching extended question labels from A column...');
      const result = await this.makeRequest('getExtendedLabels');
      return result;
    } catch (error) {
      console.error('Failed to fetch extended labels:', error);
      throw error;
    }
  }

  async getFinalSolutionOptions(): Promise<any[]> {
    try {
      console.log('⚡ Fetching final solution options from AF199:AF209...');
      const result = await this.makeRequest('getFinalSolutionOptions');
      return result;
    } catch (error) {
      console.error('Failed to fetch final solution options:', error);
      throw error;
    }
  }

  async selectFinalSolution(selectedIndex: number): Promise<any> {
    try {
      console.log(`⚡ Selecting final solution at index ${selectedIndex}...`);
      
      // Use GET request with URL parameters
      const url = new URL(this.baseUrl);
      url.searchParams.append('action', 'selectFinalSolution');
      url.searchParams.append('selectedIndex', selectedIndex.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (!result.success) {
        throw new Error(`Script error: ${result.error}`);
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to select final solution:', error);
      throw error;
    }
  }

  async getAdditionalQuestionOptions(range: string): Promise<string[]> {
    try {
      console.log(`⚡ Fetching additional question options from ${range}...`);
      
      // Use GET request with URL parameters
      const url = new URL(this.baseUrl);
      url.searchParams.append('action', 'getAdditionalQuestionOptions');
      url.searchParams.append('range', range);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (!result.success) {
        throw new Error(`Script error: ${result.error}`);
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch additional question options:', error);
      throw error;
    }
  }

  async updateAdditionalQuestion(cell: string, value: string): Promise<any> {
    try {
      console.log(`⚡ Updating additional question ${cell} with value: ${value}`);
      console.log(`⚡ DEBUG GoogleAppsScript: Confirming parameters - cell: "${cell}", value: "${value}"`);
      
      // Use GET request with URL parameters
      const url = new URL(this.baseUrl);
      url.searchParams.append('action', 'updateAdditionalQuestion');
      url.searchParams.append('cell', cell);
      url.searchParams.append('value', value);
      
      console.log(`⚡ DEBUG GoogleAppsScript: Final URL: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (!result.success) {
        throw new Error(`Script error: ${result.error}`);
      }
      
      console.log(`⚡ DEBUG GoogleAppsScript: Update successful for ${cell}:`, result.data);
      
      return result.data;
    } catch (error) {
      console.error(`Failed to update additional question ${cell}:`, error);
      throw error;
    }
  }

  async getFinalProductString(): Promise<any> {
    try {
      console.log('⚡ Fetching final product string from A234...');
      const result = await this.makeRequest('getFinalProductString');
      return result;
    } catch (error) {
      console.error('Failed to fetch final product string:', error);
      throw error;
    }
  }

  async getAdditionalTable(range: string): Promise<any[]> {
    try {
      console.log(`⚡ Fetching additional table from ${range}...`);
      
      // Use GET request with URL parameters
      const url = new URL(this.baseUrl);
      url.searchParams.append('action', 'getAdditionalTable');
      url.searchParams.append('range', range);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (!result.success) {
        throw new Error(`Script error: ${result.error}`);
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch additional table:', error);
      throw error;
    }
  }
}

export const googleAppsScriptService = new GoogleAppsScriptService();