// HIGH-PERFORMANCE Google Apps Script - Optimized for Speed
// Deploy this as a web app with:
// - Execute as: Me (script owner)
// - Who has access: Anyone (or Anyone with Google account)

const SPREADSHEET_ID = '1rcR-VPUcsqPcwyPrrLFX_s-0kJB8okXit6RwVa0hbww';
const SHEET_NAME = 'String Builder';

// Dropdown cells and their corresponding ranges
const DROPDOWN_CELLS = [
  'B1', 'B11', 'B16', 'B22', 'B25', 'B30', 'B33', 'B36', 'B42', 'B52', 'B56', 'B62', 'B68'
];

const DROPDOWN_RANGES = {
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

// PERFORMANCE: Cache spreadsheet and sheets
let cachedSpreadsheet = null;
let cachedSheets = {};

function getSpreadsheet() {
  if (!cachedSpreadsheet) {
    cachedSpreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return cachedSpreadsheet;
}

function getSheet(sheetName) {
  if (!cachedSheets[sheetName]) {
    cachedSheets[sheetName] = getSpreadsheet().getSheetByName(sheetName);
  }
  return cachedSheets[sheetName];
}

// Create CORS-enabled response
function createCORSResponse(content) {
  const output = ContentService.createTextOutput(content);
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    if (typeof output.setHeaders === 'function') {
      output.setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
    }
  } catch (e) {
    console.log('Headers not supported in this version');
  }
  
  return output;
}

function doOptions(e) {
  return createCORSResponse('');
}

function doGet(e) {
  console.log('GET Request received');
  return handleRequest(e);
}

function doPost(e) {
  console.log('POST Request received');
  console.log('Event object exists:', !!e);
  
  if (e && e.postData) {
    console.log('POST Data type:', e.postData.type);
    console.log('POST Data contents:', e.postData.contents);
  } else {
    console.log('No POST data found');
  }
  
  return handleRequest(e);
}

function parseFormData(formData) {
  const params = {};
  const pairs = formData.split('&');
  
  for (let pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
    }
  }
  
  return params;
}

function handleRequest(e) {
  try {
    if (!e) {
      console.error('No event object received');
      return createCORSResponse(JSON.stringify({ 
        success: false, 
        error: 'No request data received' 
      }));
    }
    
    let action = null;
    let postData = null;
    
    if (e.parameter) {
      if (e.parameter.action) {
        action = e.parameter.action;
        console.log('Action from URL parameter:', action);
      }
      
      if (e.parameter.cell && e.parameter.value) {
        action = 'updateValue';
        postData = {
          cell: e.parameter.cell,
          value: decodeURIComponent(e.parameter.value)
        };
        console.log('GET-based update detected:', postData);
      }
    }
    
    if (e.postData && e.postData.contents) {
      try {
        if (e.postData.type === 'application/x-www-form-urlencoded') {
          console.log('Processing form data');
          const formParams = parseFormData(e.postData.contents);
          
          if (formParams.data) {
            postData = JSON.parse(formParams.data);
          } else {
            postData = formParams;
          }
        } else {
          console.log('Processing JSON data');
          postData = JSON.parse(e.postData.contents);
        }
        
        if (!action && postData.action) {
          action = postData.action;
        }
        console.log('POST data parsed successfully:', postData);
      } catch (parseError) {
        console.error('Parse Error:', parseError);
        console.log('Raw data:', e.postData.contents);
        return createCORSResponse(JSON.stringify({
          success: false,
          error: 'Error parsing POST data',
          details: parseError.toString(),
          dataType: e.postData.type,
          receivedData: e.postData.contents.substring(0, 200) + '...'
        }));
      }
    }
    
    if (!action) {
      console.error('No action specified');
      return createCORSResponse(JSON.stringify({ 
        success: false, 
        error: 'No action specified. Use ?action=actionName or include action in POST body',
        availableActions: ['getLabels', 'getValues', 'getOptions', 'updateValue', 'getResults', 'testConnection', 'clearAllValues', 'getApplicationTypes', 'getCustomRange', 'autoSelectSingleOptions'],
        receivedParams: e.parameter || {},
        hasPostData: !!(e.postData && e.postData.contents)
      }));
    }
    
    let result;
    
    switch (action) {
      case 'getLabels':
        console.log('Executing getLabels');
        result = getDropdownLabels();
        break;
        
      case 'getValues':
        console.log('Executing getValues');
        result = getDropdownValues();
        break;
        
      case 'getOptions':
        console.log('Executing getOptions');
        result = getDropdownOptions();
        break;
        
      case 'updateValue':
        console.log('Executing updateValue with data:', postData);
        if (!postData || !postData.cell || postData.value === undefined) {
          throw new Error('Both cell and value parameters required for updateValue. Received: ' + JSON.stringify(postData || {}) + ', URL params: ' + JSON.stringify(e.parameter || {}));
        }
        result = updateDropdownValue(postData.cell, postData.value);
        break;
        
      case 'getResults':
        console.log('Executing getResults');
        result = getResults();
        break;
        
      case 'testConnection':
        console.log('Executing testConnection');
        result = { 
          message: 'Connection successful', 
          timestamp: new Date().toISOString(),
          version: 'High-Performance Version - Speed Optimized',
          method: e.postData ? 'POST' : 'GET',
          hasParams: !!(e.parameter),
          params: e.parameter || {}
        };
        break;
        
      case 'clearAllValues':
        console.log('Executing clearAllValues');
        result = clearAllDropdownValues();
        break;
        
      case 'getApplicationTypes':
        console.log('Executing getApplicationTypes');
        result = getApplicationTypes();
        break;
        
      case 'getCustomRange':
        console.log('Executing getCustomRange');
        result = getCustomRange();
        break;
        
      case 'autoSelectSingleOptions':
        console.log('Executing autoSelectSingleOptions');
        result = autoSelectSingleOptions();
        break;
        
      default:
        throw new Error('Invalid action: ' + action + '. Available actions: getLabels, getValues, getOptions, updateValue, getResults, testConnection, clearAllValues, getApplicationTypes, getCustomRange, autoSelectSingleOptions');
    }
    
    console.log('Action completed successfully');
    return createCORSResponse(JSON.stringify({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    }));
    
  } catch (error) {
    console.error('Script Error:', error);
    return createCORSResponse(JSON.stringify({
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    }));
  }
}

// OPTIMIZED: Batch label retrieval
function getDropdownLabels() {
  try {
    const sheet = getSheet(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    // PERFORMANCE: Get all labels in one batch operation
    const rows = DROPDOWN_CELLS.map(cell => parseInt(cell.substring(1)));
    const ranges = rows.map(row => `A${row}`);
    const batchRanges = sheet.getRangeList(ranges).getRanges();
    const batchValues = batchRanges.map(range => range.getValue());
    
    const labels = {};
    DROPDOWN_CELLS.forEach((cell, index) => {
      labels[cell] = batchValues[index] || `Field ${index + 1}`;
    });
    
    return labels;
  } catch (error) {
    console.error('Error getting labels:', error);
    const fallbackLabels = {};
    DROPDOWN_CELLS.forEach((cell, index) => {
      fallbackLabels[cell] = `Field ${index + 1}`;
    });
    return fallbackLabels;
  }
}

// OPTIMIZED: Batch value retrieval
function getDropdownValues() {
  try {
    const sheet = getSheet(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    // PERFORMANCE: Get all values in one batch operation
    const batchRanges = sheet.getRangeList(DROPDOWN_CELLS).getRanges();
    const batchValues = batchRanges.map(range => range.getValue());
    
    const values = {};
    DROPDOWN_CELLS.forEach((cell, index) => {
      const cellValue = batchValues[index];
      values[cell] = cellValue ? cellValue.toString() : '';
    });
    
    return values;
  } catch (error) {
    console.error('Error getting values:', error);
    const emptyValues = {};
    DROPDOWN_CELLS.forEach(cell => {
      emptyValues[cell] = '';
    });
    return emptyValues;
  }
}

function getDropdownOptions() {
  try {
    const options = {};
    
    Object.entries(DROPDOWN_RANGES).forEach(([cell, range]) => {
      try {
        let sheet, rangeRef;
        
        if (range.includes('!')) {
          const [sheetName, rangeAddress] = range.split('!');
          sheet = getSheet(sheetName); // Use cached sheet
          rangeRef = rangeAddress;
        } else {
          sheet = getSheet(SHEET_NAME);
          rangeRef = range;
        }
        
        if (!sheet) {
          throw new Error(`Sheet not found in range: ${range}`);
        }
        
        const values = sheet.getRange(rangeRef).getValues();
        const cellOptions = [];
        
        if (cell === 'B1') {
          values.forEach(row => {
            row.forEach(value => {
              if (value !== null && value !== undefined) {
                const stringValue = value.toString().trim();
                if (stringValue !== '' || value === 0) {
                  cellOptions.push(stringValue);
                }
              }
            });
          });
        } else {
          values.forEach(row => {
            const value = row[0];
            if (value !== null && value !== undefined) {
              const stringValue = value.toString().trim();
              if (stringValue !== '' || value === 0) {
                cellOptions.push(stringValue);
              }
            }
          });
        }
        
        const uniqueOptions = [...new Set(cellOptions)];
        
        if (['B33', 'B36', 'B52'].includes(cell)) {
          try {
            uniqueOptions.sort((a, b) => {
              const numA = parseFloat(a);
              const numB = parseFloat(b);
              if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
              }
              return a.toString().localeCompare(b.toString());
            });
          } catch (sortError) {
            console.log(`${cell} sorting failed, using original order`);
          }
        }
        
        options[cell] = uniqueOptions;
        
      } catch (error) {
        console.error(`Error fetching options for ${cell}:`, error);
        options[cell] = [`Option 1 for ${cell}`, `Option 2 for ${cell}`];
      }
    });
    
    return options;
  } catch (error) {
    console.error('Error getting dropdown options:', error);
    const defaultOptions = {};
    DROPDOWN_CELLS.forEach(cell => {
      defaultOptions[cell] = ['Option 1', 'Option 2', 'Option 3'];
    });
    return defaultOptions;
  }
}

// OPTIMIZED: Fast single update without excessive flushing
function updateDropdownValue(cell, value) {
  try {
    console.log(`Attempting to update ${cell} with value:`, value);
    
    if (!DROPDOWN_CELLS.includes(cell)) {
      throw new Error(`Invalid cell: ${cell}. Valid cells are: ${DROPDOWN_CELLS.join(', ')}`);
    }
    
    const sheet = getSheet(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const cellRange = sheet.getRange(cell);
    
    // PERFORMANCE: Simplified approach - try direct setValue first
    try {
      cellRange.setValue(value);
      const updatedValue = cellRange.getValue();
      
      console.log(`Successfully updated ${cell}. New value:`, updatedValue);
      
      return { 
        success: true, 
        cell: cell, 
        value: value,
        updatedValue: updatedValue ? updatedValue.toString() : '',
        timestamp: new Date().toISOString(),
        method: 'direct_fast'
      };
    } catch (directError) {
      console.log(`Direct update failed for ${cell}, trying validation method`);
      
      // Fallback: validation handling only if needed
      const existingValidation = cellRange.getDataValidation();
      
      if (existingValidation) {
        cellRange.clearDataValidations();
      }
      
      cellRange.setValue(value);
      
      if (existingValidation) {
        cellRange.setDataValidation(existingValidation);
      }
      
      const updatedValue = cellRange.getValue();
      
      return { 
        success: true, 
        cell: cell, 
        value: value,
        updatedValue: updatedValue ? updatedValue.toString() : '',
        timestamp: new Date().toISOString(),
        method: 'validation_fallback'
      };
    }
  } catch (error) {
    console.error('Error updating value:', error);
    throw new Error(`Failed to update ${cell} with value ${value}: ${error.toString()}`);
  }
}

function getResults() {
  try {
    const sheet = getSheet(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const range = sheet.getRange('CE76:CE95');
    const values = range.getValues();
    
    return values.map(row => 
      row.map(cell => cell ? cell.toString() : '')
    );
  } catch (error) {
    console.error('Error getting results:', error);
    return [];
  }
}

// OPTIMIZED: Super-fast bulk clearing
function clearAllDropdownValues() {
  try {
    console.log('Starting optimized clearAllDropdownValues...');
    const sheet = getSheet(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const results = {
      cleared: [],
      failed: [],
      clearedCount: 0,
      totalCells: DROPDOWN_CELLS.length
    };
    
    // PERFORMANCE: Get all current values in one batch operation
    const batchRanges = sheet.getRangeList(DROPDOWN_CELLS).getRanges();
    const currentValues = batchRanges.map(range => range.getValue());
    
    // PERFORMANCE: Clear all cells in one batch operation
    try {
      batchRanges.forEach((range, index) => {
        try {
          range.setValue('');
          results.cleared.push({
            cell: DROPDOWN_CELLS[index],
            previousValue: currentValues[index] ? currentValues[index].toString() : '',
            method: 'batch_clear'
          });
          results.clearedCount++;
          console.log(`✅ Cleared ${DROPDOWN_CELLS[index]} (was: "${currentValues[index]}")`);
        } catch (cellError) {
          console.error(`❌ Error clearing ${DROPDOWN_CELLS[index]}:`, cellError);
          results.failed.push({
            cell: DROPDOWN_CELLS[index],
            error: cellError.toString()
          });
        }
      });
      
      console.log(`✅ Optimized clearing completed: ${results.clearedCount}/${results.totalCells} cells cleared`);
      
      return { 
        success: true, 
        ...results,
        timestamp: new Date().toISOString(),
        message: `Fast clearing: ${results.clearedCount} out of ${results.totalCells} dropdown cells cleared`,
        version: 'optimized_batch_clearing'
      };
      
    } catch (batchError) {
      console.error('Batch clearing failed:', batchError);
      throw batchError;
    }
    
  } catch (error) {
    console.error('❌ Error in optimized clearAllDropdownValues:', error);
    throw new Error(`Optimized clear failed: ${error.toString()}`);
  }
}

// OPTIMIZED: Fast batch auto-selection
function autoSelectSingleOptions() {
  try {
    console.log('Starting optimized autoSelectSingleOptions...');
    const options = getDropdownOptions();
    const results = {
      autoSelected: [],
      skipped: [],
      failed: []
    };
    
    const sheet = getSheet(SHEET_NAME);
    
    // PERFORMANCE: Get all current values in one batch
    const cellsToCheck = [];
    const singleOptionCells = [];
    
    Object.entries(options).forEach(([cell, cellOptions]) => {
      if (cellOptions && cellOptions.length === 1) {
        cellsToCheck.push(cell);
        singleOptionCells.push({
          cell: cell,
          option: cellOptions[0]
        });
      } else {
        results.skipped.push({
          cell: cell,
          reason: 'Multiple options available',
          optionCount: cellOptions ? cellOptions.length : 0
        });
      }
    });
    
    if (cellsToCheck.length > 0) {
      // PERFORMANCE: Batch get current values
      const batchRanges = sheet.getRangeList(cellsToCheck).getRanges();
      const currentValues = batchRanges.map(range => range.getValue());
      
      // PERFORMANCE: Batch set values for empty cells
      singleOptionCells.forEach((cellInfo, index) => {
        const currentValue = currentValues[index];
        
        if (!currentValue || currentValue.toString().trim() === '') {
          try {
            batchRanges[index].setValue(cellInfo.option);
            results.autoSelected.push({
              cell: cellInfo.cell,
              value: cellInfo.option,
              previousValue: currentValue ? currentValue.toString() : ''
            });
            console.log(`✅ Auto-selected ${cellInfo.cell}: "${cellInfo.option}"`);
          } catch (cellError) {
            results.failed.push({
              cell: cellInfo.cell,
              error: cellError.toString(),
              option: cellInfo.option
            });
            console.error(`❌ Error auto-selecting ${cellInfo.cell}:`, cellError);
          }
        } else {
          results.skipped.push({
            cell: cellInfo.cell,
            reason: 'Cell already has value',
            currentValue: currentValue.toString(),
            option: cellInfo.option
          });
          console.log(`⏭️ Skipped ${cellInfo.cell}: already has value "${currentValue}"`);
        }
      });
    }
    
    console.log(`Optimized auto-selection completed: ${results.autoSelected.length} selected, ${results.skipped.length} skipped, ${results.failed.length} failed`);
    
    return {
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
      summary: `Fast auto-selected ${results.autoSelected.length} single-option dropdowns`,
      version: 'optimized_batch_selection'
    };
    
  } catch (error) {
    console.error('Error in optimized autoSelectSingleOptions:', error);
    throw new Error(`Optimized auto-selection failed: ${error.toString()}`);
  }
}

function getCustomRange() {
  try {
    console.log('Fetching custom range C303:D330 from Sheet2...');
    const sheet = getSheet('Sheet2'); // Use cached sheet
    
    if (!sheet) {
      throw new Error('Sheet2 not found');
    }
    
    const range = sheet.getRange('C303:D330');
    const values = range.getValues();
    
    const rows = [];
    values.forEach((row, index) => {
      if (row[0] || row[1]) {
        rows.push({
          rowNumber: 303 + index,
          colC: row[0] ? row[0].toString().trim() : '',
          colD: row[1] ? row[1].toString().trim() : ''
        });
      }
    });
    
    console.log(`Found ${rows.length} rows with data in C303:D330 range`);
    return { 
      success: true,
      rows: rows,
      range: 'C303:D330',
      sheet: 'Sheet2'
    };
  } catch (error) {
    console.error('Error getting custom range C303:D330:', error);
    return { 
      success: false,
      error: error.toString(), 
      rows: [],
      range: 'C303:D330',
      sheet: 'Sheet2'
    };
  }
}

function getApplicationTypes() {
  try {
    console.log('Fetching application types using getCustomRange...');
    const customRangeResult = getCustomRange();
    
    if (customRangeResult.error) {
      throw new Error(customRangeResult.error);
    }
    
    const applicationTypes = [];
    
    customRangeResult.rows.forEach(rowData => {
      const name = rowData.colC;
      const description = rowData.colD;
      
      if (name && name.toString().trim() !== '' && description && description.toString().trim() !== '') {
        applicationTypes.push({
          name: name.toString().trim(),
          description: description.toString().trim()
        });
      }
    });
    
    console.log(`Found ${applicationTypes.length} application types:`, applicationTypes);
    return applicationTypes;
  } catch (error) {
    console.error('Error getting application types:', error);
    return [];
  }
}

// Test functions for debugging
function testPost() {
  console.log('Starting testPost function');
  
  const testEvent = {
    postData: {
      contents: JSON.stringify({
        action: 'updateValue',
        cell: 'B1',
        value: 'Internal Test - ' + new Date().toLocaleTimeString()
      }),
      type: 'application/json'
    }
  };
  
  try {
    const result = doPost(testEvent);
    const content = result.getContent();
    console.log('Test Result:', content);
    return content;
  } catch (error) {
    console.error('Test Error:', error);
    return JSON.stringify({ success: false, error: error.toString() });
  }
}

function testGetUpdate() {
  const testEvent = {
    parameter: {
      action: 'updateValue',
      cell: 'B1',
      value: 'GET Update Test - ' + new Date().toLocaleTimeString()
    }
  };
  
  try {
    const result = doGet(testEvent);
    const content = result.getContent();
    console.log('GET Update Result:', content);
    return content;
  } catch (error) {
    console.error('GET Update Error:', error);
    return JSON.stringify({ success: false, error: error.toString() });
  }
}

function testClearAll() {
  console.log('Testing optimized clearAllValues function');
  
  const testEvent = {
    parameter: {
      action: 'clearAllValues'
    }
  };
  
  try {
    const result = doGet(testEvent);
    const content = result.getContent();
    console.log('Optimized Clear All Test Result:', content);
    return content;
  } catch (error) {
    console.error('Optimized Clear All Test Error:', error);
    return JSON.stringify({ success: false, error: error.toString() });
  }
}

function testAutoSelect() {
  console.log('Testing optimized autoSelectSingleOptions function');
  
  const testEvent = {
    parameter: {
      action: 'autoSelectSingleOptions'
    }
  };
  
  try {
    const result = doGet(testEvent);
    const content = result.getContent();
    console.log('Optimized Auto Select Test Result:', content);
    return content;
  } catch (error) {
    console.error('Optimized Auto Select Test Error:', error);
    return JSON.stringify({ success: false, error: error.toString() });
  }
}

function testGetApplicationTypes() {
  console.log('Testing getApplicationTypes function');
  
  const testEvent = {
    parameter: {
      action: 'getApplicationTypes'
    }
  };
  
  try {
    const result = doGet(testEvent);
    const content = result.getContent();
    console.log('Application Types Test Result:', content);
    return content;
  } catch (error) {
    console.error('Application Types Test Error:', error);
    return JSON.stringify({ success: false, error: error.toString() });
  }
}

function testGetCustomRange() {
  console.log('Testing getCustomRange function');
  
  const testEvent = {
    parameter: {
      action: 'getCustomRange'
    }
  };
  
  try {
    const result = doGet(testEvent);
    const content = result.getContent();
    console.log('Custom Range Test Result:', content);
    return content;
  } catch (error) {
    console.error('Custom Range Test Error:', error);
    return JSON.stringify({ success: false, error: error.toString() });
  }
}