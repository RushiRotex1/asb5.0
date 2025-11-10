// COMPATIBILITY-OPTIMIZED Google Apps Script - Fast + Stable
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

// COMPATIBILITY: Use simpler caching approach
var cachedSpreadsheet = null;

function getSpreadsheet() {
  if (!cachedSpreadsheet) {
    cachedSpreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return cachedSpreadsheet;
}

// Enhanced CORS response for better compatibility
function createCORSResponse(content) {
  const output = ContentService.createTextOutput(content);
  output.setMimeType(ContentService.MimeType.JSON);
  
  // COMPATIBILITY: More robust header setting
  try {
    if (typeof output.setHeaders === 'function') {
      output.setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
      });
    }
  } catch (e) {
    console.log('Headers not supported in this version');
  }
  
  return output;
}

function doOptions(e) {
  console.log('OPTIONS request received');
  return createCORSResponse(JSON.stringify({"status": "ok"}));
}

function doGet(e) {
  console.log('GET Request received');
  return handleRequest(e);
}

function doPost(e) {
  console.log('POST Request received');
  if (e && e.postData) {
    console.log('POST Data type:', e.postData.type);
    console.log('POST Data contents:', e.postData.contents);
  }
  return handleRequest(e);
}

function parseFormData(formData) {
  const params = {};
  const pairs = formData.split('&');
  
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
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
    let requestData = {};
    
    // Handle GET parameters
    if (e.parameter) {
      // Copy all GET parameters to requestData
      for (const key in e.parameter) {
        requestData[key] = e.parameter[key];
      }
      
      if (e.parameter.action) {
        action = e.parameter.action;
        console.log('Action from URL parameter:', action);
      }
      
      if (e.parameter.cell && e.parameter.value) {
        action = 'updateValue';
        requestData = {
          ...requestData,
          cell: e.parameter.cell,
          value: decodeURIComponent(e.parameter.value)
        };
        console.log('GET-based update detected:', requestData);
      }
      
      // Handle targetCell and sourceCell parameters for populateFromReference
      if (e.parameter.targetCell && e.parameter.sourceCell) {
        action = 'populateFromReference';
        requestData = {
          ...requestData,
          targetCell: e.parameter.targetCell,
          sourceCell: e.parameter.sourceCell
        };
        console.log('GET-based populate detected:', requestData);
      }
    }
    
    // Handle POST data
    if (e.postData && e.postData.contents) {
      try {
        let postData = null;
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
        
        // Merge POST data into requestData
        if (postData) {
          requestData = { ...requestData, ...postData };
        }
        
        if (!action && requestData && requestData.action) {
          action = requestData.action;
        }
        console.log('Request data consolidated successfully:', requestData);
      } catch (parseError) {
        console.error('Parse Error:', parseError);
        return createCORSResponse(JSON.stringify({
          success: false,
          error: 'Error parsing POST data',
          details: parseError.toString()
        }));
      }
    }
    
    if (!action) {
      console.error('No action specified');
      return createCORSResponse(JSON.stringify({ 
        success: false, 
        error: 'No action specified. Use ?action=actionName or include action in POST body',
        availableActions: ['getLabels', 'getValues', 'getOptions', 'updateValue', 'getResults', 'testConnection', 'clearAllValues', 'getApplicationTypes', 'getCustomRange', 'autoSelectSingleOptions', 'getAdditionalTable', 'getSearchableOptions', 'getMediaCompatibilityChart', 'getFinalResults', 'clearExtendedCells', 'getExtendedLabels', 'populateFromReference'],
        receivedParams: e.parameter || {},
        hasPostData: !!(e.postData && e.postData.contents),
        consolidatedData: requestData
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
        console.log('Executing updateValue with data:', requestData);
        if (!requestData || !requestData.cell || requestData.value === undefined) {
          throw new Error('Both cell and value parameters required for updateValue');
        }
        result = updateDropdownValue(requestData.cell, requestData.value);
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
          version: 'Compatibility-Optimized Version - Stable + Fast + Table Support',
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
        
      case 'getAdditionalTable':
        console.log('Executing getAdditionalTable');
        if (!requestData || !requestData.range) {
          throw new Error('Range parameter required for getAdditionalTable');
        }
        result = getAdditionalTable(requestData.range);
        break;
        
      case 'getSearchableOptions':
        console.log('Executing getSearchableOptions');
        if (!requestData || !requestData.range) {
          throw new Error('Range parameter required for getSearchableOptions');
        }
        result = getSearchableOptions(requestData.range);
        break;
        
      case 'getMediaCompatibilityChart':
        console.log('Executing getMediaCompatibilityChart');
        if (!requestData || !requestData.range) {
          throw new Error('Range parameter required for getMediaCompatibilityChart');
        }
        result = getMediaCompatibilityChart(requestData.range);
        break;
        
      case 'getFinalResults':
        console.log('Executing getFinalResults');
        result = getFinalResults();
        break;
        
      case 'clearExtendedCells':
        console.log('Executing clearExtendedCells');
        result = clearExtendedCells();
        break;
        
      case 'getExtendedLabels':
        console.log('Executing getExtendedLabels');
        result = getExtendedLabels();
        break;
        
      case 'populateFromReference':
        console.log('Executing populateFromReference');
        if (!requestData || !requestData.targetCell || !requestData.sourceCell) {
          throw new Error('Both targetCell and sourceCell parameters required for populateFromReference');
        }
        result = populateFromReference(requestData.targetCell, requestData.sourceCell);
        break;
        
      case 'getFinalSolutionOptions':
        console.log('Executing getFinalSolutionOptions');
        result = getFinalSolutionOptions();
        break;
        
      case 'selectFinalSolution':
        console.log('Executing selectFinalSolution');
        if (!requestData || requestData.selectedIndex === undefined) {
          throw new Error('selectedIndex parameter required for selectFinalSolution');
        }
        result = selectFinalSolution(parseInt(requestData.selectedIndex));
        break;
        
      case 'getAdditionalQuestionOptions':
        console.log('Executing getAdditionalQuestionOptions');
        if (!requestData || !requestData.range) {
          throw new Error('range parameter required for getAdditionalQuestionOptions');
        }
        result = getAdditionalQuestionOptions(requestData.range);
        break;
        
      case 'updateAdditionalQuestion':
        console.log('Executing updateAdditionalQuestion');
        if (!requestData || !requestData.cell || requestData.value === undefined) {
          throw new Error('Both cell and value parameters required for updateAdditionalQuestion');
        }
        result = updateAdditionalQuestion(requestData.cell, requestData.value);
        break;
        
      case 'getFinalProductString':
        console.log('Executing getFinalProductString');
        result = getFinalProductString();
        break;
        
      default:
        throw new Error('Invalid action: ' + action);
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

// COMPATIBILITY: Simplified but still optimized label retrieval
function getDropdownLabels() {
  try {
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const labels = {};
    
    // COMPATIBILITY: Use traditional approach but batch the operations
    for (let i = 0; i < DROPDOWN_CELLS.length; i++) {
      const cell = DROPDOWN_CELLS[i];
      try {
        const row = parseInt(cell.substring(1));
        const labelValue = sheet.getRange(`A${row}`).getValue();
        labels[cell] = labelValue || `Field ${i + 1}`;
      } catch (cellError) {
        console.error(`Error getting label for ${cell}:`, cellError);
        labels[cell] = `Field ${i + 1}`;
      }
    }
    
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

// COMPATIBILITY: Simplified but still optimized value retrieval
function getDropdownValues() {
  try {
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const values = {};
    
    // COMPATIBILITY: Use traditional approach
    for (let i = 0; i < DROPDOWN_CELLS.length; i++) {
      const cell = DROPDOWN_CELLS[i];
      try {
        const cellValue = sheet.getRange(cell).getValue();
        values[cell] = cellValue ? cellValue.toString() : '';
      } catch (cellError) {
        console.error(`Error getting value for ${cell}:`, cellError);
        values[cell] = '';
      }
    }
    
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
    const spreadsheet = getSpreadsheet();
    const options = {};
    
    for (let cellIndex = 0; cellIndex < DROPDOWN_CELLS.length; cellIndex++) {
      const cell = DROPDOWN_CELLS[cellIndex];
      const range = DROPDOWN_RANGES[cell];
      
      try {
        let sheet, rangeRef;
        
        if (range.includes('!')) {
          const [sheetName, rangeAddress] = range.split('!');
          sheet = spreadsheet.getSheetByName(sheetName);
          rangeRef = rangeAddress;
        } else {
          sheet = spreadsheet.getSheetByName(SHEET_NAME);
          rangeRef = range;
        }
        
        if (!sheet) {
          throw new Error(`Sheet not found in range: ${range}`);
        }
        
        const values = sheet.getRange(rangeRef).getValues();
        const cellOptions = [];
        
        if (cell === 'B1') {
          // Special handling for B1 - get all non-empty values from all columns
          for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
            const row = values[rowIndex];
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
              const value = row[colIndex];
              if (value !== null && value !== undefined) {
                const stringValue = value.toString().trim();
                if (stringValue !== '' || value === 0) {
                  cellOptions.push(stringValue);
                }
              }
            }
          }
        } else {
          // For other cells, get first column values only
          for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
            const value = values[rowIndex][0];
            if (value !== null && value !== undefined) {
              const stringValue = value.toString().trim();
              if (stringValue !== '' || value === 0) {
                cellOptions.push(stringValue);
              }
            }
          }
        }
        
        // Remove duplicates and sort if needed
        const uniqueOptions = [];
        for (let i = 0; i < cellOptions.length; i++) {
          if (uniqueOptions.indexOf(cellOptions[i]) === -1) {
            uniqueOptions.push(cellOptions[i]);
          }
        }
        
        // Special sorting for numerical cells
        if (cell === 'B33' || cell === 'B36' || cell === 'B52') {
          try {
            uniqueOptions.sort(function(a, b) {
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
    }
    
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

// COMPATIBILITY: Simplified but reliable update
function updateDropdownValue(cell, value) {
  try {
    console.log(`Attempting to update ${cell} with value:`, value);
    
    if (DROPDOWN_CELLS.indexOf(cell) === -1) {
      // Check if it's an extended cell
      const extendedCells = ['B106', 'B135', 'B139', 'B142', 'B147', 'B151', 'B154', 'B164', 'B167', 'B172', 'B176', 'B180', 'B185', 'B188', 'B191', 'B194'];
      // Check if it's an additional question cell
      const additionalCells = ['B212', 'B216', 'B220'];
      if (extendedCells.indexOf(cell) === -1) {
        if (additionalCells.indexOf(cell) === -1) {
          throw new Error(`Invalid cell: ${cell}. Valid cells are: ${DROPDOWN_CELLS.concat(extendedCells).concat(additionalCells).join(', ')}`);
        }
      }
    }
    
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const cellRange = sheet.getRange(cell);
    
    // COMPATIBILITY: Simple, reliable approach
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
        method: 'compatible_direct'
      };
    } catch (directError) {
      console.log(`Direct update failed for ${cell}, trying validation method`);
      
      // Fallback with validation handling
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
        method: 'compatible_validation_fallback'
      };
    }
  } catch (error) {
    console.error('Error updating value:', error);
    throw new Error(`Failed to update ${cell} with value ${value}: ${error.toString()}`);
  }
}

function getResults() {
  try {
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const range = sheet.getRange('CE76:CE95');
    const values = range.getValues();
    
    const results = [];
    for (let i = 0; i < values.length; i++) {
      const row = [];
      for (let j = 0; j < values[i].length; j++) {
        row.push(values[i][j] ? values[i][j].toString() : '');
      }
      results.push(row);
    }
    
    return results;
  } catch (error) {
    console.error('Error getting results:', error);
    return [];
  }
}

// COMPATIBILITY: Reliable bulk clearing
function clearAllDropdownValues() {
  try {
    console.log('Starting compatible clearAllDropdownValues...');
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const results = {
      cleared: [],
      failed: [],
      clearedCount: 0,
      totalCells: DROPDOWN_CELLS.length
    };
    
    // COMPATIBILITY: Clear cells one by one but efficiently
    for (let i = 0; i < DROPDOWN_CELLS.length; i++) {
      const cell = DROPDOWN_CELLS[i];
      try {
        const cellRange = sheet.getRange(cell);
        const currentValue = cellRange.getValue();
        
        cellRange.setValue('');
        
        results.cleared.push({
          cell: cell,
          previousValue: currentValue ? currentValue.toString() : '',
          method: 'compatible_clear'
        });
        results.clearedCount++;
        console.log(`✅ Cleared ${cell} (was: "${currentValue}")`);
        
      } catch (cellError) {
        console.error(`❌ Error clearing ${cell}:`, cellError);
        results.failed.push({
          cell: cell,
          error: cellError.toString()
        });
      }
    }
    
    console.log(`✅ Compatible clearing completed: ${results.clearedCount}/${results.totalCells} cells cleared`);
    
    return { 
      success: true, 
      ...results,
      timestamp: new Date().toISOString(),
      message: `Compatible clearing: ${results.clearedCount} out of ${results.totalCells} dropdown cells cleared`,
      version: 'compatible_clearing'
    };
    
  } catch (error) {
    console.error('❌ Error in compatible clearAllDropdownValues:', error);
    throw new Error(`Compatible clear failed: ${error.toString()}`);
  }
}

// COMPATIBILITY: Reliable auto-selection
function autoSelectSingleOptions() {
  try {
    console.log('Starting compatible autoSelectSingleOptions...');
    const options = getDropdownOptions();
    const results = {
      autoSelected: [],
      skipped: [],
      failed: []
    };
    
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // COMPATIBILITY: Process each cell individually for reliability
    for (let i = 0; i < DROPDOWN_CELLS.length; i++) {
      const cell = DROPDOWN_CELLS[i];
      const cellOptions = options[cell] || [];
      
      try {
        if (cellOptions && cellOptions.length === 1) {
          const singleOption = cellOptions[0];
          const currentValue = sheet.getRange(cell).getValue();
          
          if (!currentValue || currentValue.toString().trim() === '') {
            try {
              sheet.getRange(cell).setValue(singleOption);
              results.autoSelected.push({
                cell: cell,
                value: singleOption,
                previousValue: currentValue ? currentValue.toString() : ''
              });
              console.log(`✅ Auto-selected ${cell}: "${singleOption}"`);
            } catch (cellError) {
              results.failed.push({
                cell: cell,
                error: cellError.toString(),
                option: singleOption
              });
              console.error(`❌ Error auto-selecting ${cell}:`, cellError);
            }
          } else {
            results.skipped.push({
              cell: cell,
              reason: 'Cell already has value',
              currentValue: currentValue.toString(),
              option: singleOption
            });
            console.log(`⏭️ Skipped ${cell}: already has value "${currentValue}"`);
          }
        } else {
          results.skipped.push({
            cell: cell,
            reason: 'Multiple options available',
            optionCount: cellOptions ? cellOptions.length : 0
          });
        }
      } catch (cellError) {
        results.failed.push({
          cell: cell,
          error: cellError.toString()
        });
        console.error(`❌ Error processing ${cell}:`, cellError);
      }
    }
    
    console.log(`Compatible auto-selection completed: ${results.autoSelected.length} selected, ${results.skipped.length} skipped, ${results.failed.length} failed`);
    
    return {
      success: true,
      autoSelected: results.autoSelected,
      skipped: results.skipped,
      failed: results.failed,
      timestamp: new Date().toISOString(),
      summary: `Compatible auto-selected ${results.autoSelected.length} single-option dropdowns`,
      version: 'compatible_selection'
    };
    
  } catch (error) {
    console.error('Error in compatible autoSelectSingleOptions:', error);
    throw new Error(`Compatible auto-selection failed: ${error.toString()}`);
  }
}

function getCustomRange() {
  try {
    console.log('Fetching custom range C303:D330 from Sheet2...');
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName('Sheet2');
    
    if (!sheet) {
      throw new Error('Sheet2 not found');
    }
    
    const range = sheet.getRange('C303:D330');
    const values = range.getValues();
    
    const rows = [];
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      if (row[0] || row[1]) {
        rows.push({
          rowNumber: 303 + i,
          colC: row[0] ? row[0].toString().trim() : '',
          colD: row[1] ? row[1].toString().trim() : ''
        });
      }
    }
    
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
    
    if (!customRangeResult.success) {
      throw new Error(customRangeResult.error);
    }
    
    const applicationTypes = [];
    
    for (let i = 0; i < customRangeResult.rows.length; i++) {
      const rowData = customRangeResult.rows[i];
      const name = rowData.colC;
      const description = rowData.colD;
      
      if (name && name.toString().trim() !== '' && description && description.toString().trim() !== '') {
        applicationTypes.push({
          name: name.toString().trim(),
          description: description.toString().trim()
        });
      }
    }
    
    console.log(`Found ${applicationTypes.length} application types`);
    return applicationTypes;
  } catch (error) {
    console.error('Error getting application types:', error);
    return [];
  }
}

// NEW: Get additional table data for extended questions
function getAdditionalTable(range) {
  try {
    console.log(`Fetching additional table from range: ${range}`);
    
    const spreadsheet = getSpreadsheet();
    let sheet, rangeRef;
    
    if (range.includes('!')) {
      const [sheetName, rangeAddress] = range.split('!');
      sheet = spreadsheet.getSheetByName(sheetName.replace(/'/g, ''));
      rangeRef = rangeAddress;
    } else {
      sheet = spreadsheet.getSheetByName(SHEET_NAME);
      rangeRef = range;
    }
    
    if (!sheet) {
      throw new Error(`Sheet not found in range: ${range}`);
    }
    
    const values = sheet.getRange(rangeRef).getValues();
    const tableData = [];
    
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      // Only include rows that have content in at least the first column
      if (row[0] && row[0].toString().trim() !== '') {
        const rowData = {
          col1: row[0] ? row[0].toString().trim() : '',
          col2: row[1] ? row[1].toString().trim() : ''
        };
        tableData.push(rowData);
      }
    }
    
    console.log(`Found ${tableData.length} rows in additional table`);
    return tableData;
  } catch (error) {
    console.error('Error getting additional table:', error);
    throw new Error(`Failed to get additional table from ${range}: ${error.toString()}`);
  }
}

// NEW: Get searchable options from a range
function getSearchableOptions(range) {
  try {
    console.log(`Fetching searchable options from range: ${range}`);
    
    const spreadsheet = getSpreadsheet();
    let sheet, rangeRef;
    
    if (range.includes('!')) {
      const [sheetName, rangeAddress] = range.split('!');
      sheet = spreadsheet.getSheetByName(sheetName.replace(/'/g, ''));
      rangeRef = rangeAddress;
    } else {
      sheet = spreadsheet.getSheetByName(SHEET_NAME);
      rangeRef = range;
    }
    
    if (!sheet) {
      throw new Error(`Sheet not found in range: ${range}`);
    }
    
    // Handle open-ended ranges like A7:A (entire column from row 7)
    let values;
    if (rangeRef.match(/^[A-Z]+\d+:[A-Z]+$/)) {
      // Open-ended range like A7:A - get from start row to last row with data
      const columnMatch = rangeRef.match(/^([A-Z]+)(\d+):([A-Z]+)$/);
      if (columnMatch) {
        const startCol = columnMatch[1];
        const startRow = parseInt(columnMatch[2]);
        const endCol = columnMatch[3];
        
        // Get the last row with data in this column
        const lastRow = sheet.getLastRow();
        
        if (lastRow >= startRow) {
          const dynamicRange = `${startCol}${startRow}:${endCol}${lastRow}`;
          console.log(`Expanding range ${rangeRef} to ${dynamicRange} (last row: ${lastRow})`);
          values = sheet.getRange(dynamicRange).getValues();
        } else {
          values = [];
        }
      } else {
        values = sheet.getRange(rangeRef).getValues();
      }
    } else {
      values = sheet.getRange(rangeRef).getValues();
    }
    const options = [];
    
    for (let i = 0; i < values.length; i++) {
      const value = values[i][0];
      if (value !== null && value !== undefined) {
        const stringValue = value.toString().trim();
        if (stringValue !== '' && stringValue !== 'undefined' && stringValue !== 'null') {
          options.push(stringValue);
        }
      }
    }
    
    // Remove duplicates
    const uniqueOptions = [];
    for (let i = 0; i < options.length; i++) {
      if (uniqueOptions.indexOf(options[i]) === -1) {
        uniqueOptions.push(options[i]);
      }
    }
    
    console.log(`Found ${uniqueOptions.length} searchable options from ${values.length} total rows`);
    return uniqueOptions;
  } catch (error) {
    console.error('Error getting searchable options:', error);
    throw new Error(`Failed to get searchable options from ${range}: ${error.toString()}`);
  }
}

// NEW: Get media compatibility chart
function getMediaCompatibilityChart(range) {
  try {
    console.log(`Fetching media compatibility chart from range: ${range}`);
    
    const spreadsheet = getSpreadsheet();
    let sheet, rangeRef;
    
    if (range.includes('!')) {
      const [sheetName, rangeAddress] = range.split('!');
      sheet = spreadsheet.getSheetByName(sheetName.replace(/'/g, ''));
      rangeRef = rangeAddress;
    } else {
      sheet = spreadsheet.getSheetByName(SHEET_NAME);
      rangeRef = range;
    }
    
    if (!sheet) {
      throw new Error(`Sheet not found in range: ${range}`);
    }
    
    const values = sheet.getRange(rangeRef).getValues();
    const chartData = [];
    
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      if (row[0] && row[0].toString().trim() !== '') {
        const rowData = {
          bodyMaterial: row[0] ? row[0].toString().trim() : '',
          mediaCompatibility: row[1] ? row[1].toString().trim() : '',
          costComparison: row[2] ? row[2].toString().trim() : ''
        };
        chartData.push(rowData);
      }
    }
    
    console.log(`Found ${chartData.length} rows in compatibility chart`);
    return chartData;
  } catch (error) {
    console.error('Error getting media compatibility chart:', error);
    throw new Error(`Failed to get compatibility chart from ${range}: ${error.toString()}`);
  }
}

// NEW: Get final results from A198:W209
function getFinalResults() {
  try {
    console.log('Fetching final results from A198:W209...');
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const range = sheet.getRange('A198:W209');
    const values = range.getValues();
    
    const results = [];
    for (let i = 0; i < values.length; i++) {
      const row = [];
      for (let j = 0; j < values[i].length; j++) {
        row.push(values[i][j] ? values[i][j].toString() : '');
      }
      results.push(row);
    }
    
    console.log(`Found ${results.length} rows in final results`);
    return results;
  } catch (error) {
    console.error('Error getting final results:', error);
    return [];
  }
}

// NEW: Clear extended question cells
function clearExtendedCells() {
  try {
    console.log('Clearing extended question cells...');
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const extendedCells = ['B106', 'B135', 'B139', 'B142', 'B147', 'B151', 'B154', 'B164', 'B167', 'B172', 'B176', 'B180', 'B185', 'B188', 'B191', 'B194'];
    const results = {
      cleared: [],
      failed: [],
      clearedCount: 0,
      totalCells: extendedCells.length
    };
    
    for (let i = 0; i < extendedCells.length; i++) {
      const cell = extendedCells[i];
      try {
        const cellRange = sheet.getRange(cell);
        const currentValue = cellRange.getValue();
        
        cellRange.setValue('');
        
        results.cleared.push({
          cell: cell,
          previousValue: currentValue ? currentValue.toString() : ''
        });
        results.clearedCount++;
        console.log(`✅ Cleared extended cell ${cell}`);
        
      } catch (cellError) {
        console.error(`❌ Error clearing ${cell}:`, cellError);
        results.failed.push({
          cell: cell,
          error: cellError.toString()
        });
      }
    }
    
    console.log(`✅ Extended cells clearing completed: ${results.clearedCount}/${results.totalCells} cells cleared`);
    
    return {
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
      message: `Extended cells cleared: ${results.clearedCount} out of ${results.totalCells} cells`
    };
    
  } catch (error) {
    console.error('❌ Error clearing extended cells:', error);
    throw new Error(`Extended cells clear failed: ${error.toString()}`);
  }
}

// NEW: Get extended labels (for future use if needed)
function getExtendedLabels() {
  try {
    console.log('Fetching extended labels...');
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const extendedCells = ['B106', 'B135', 'B139', 'B142', 'B147', 'B151', 'B154', 'B164', 'B167', 'B172', 'B176', 'B180', 'B185', 'B188', 'B191', 'B194'];
    const labels = {};
    
    for (let i = 0; i < extendedCells.length; i++) {
      const cell = extendedCells[i];
      try {
        const row = parseInt(cell.substring(1));
        const labelValue = sheet.getRange(`A${row}`).getValue();
        labels[cell] = labelValue || `Extended Field ${i + 1}`;
      } catch (cellError) {
        console.error(`Error getting extended label for ${cell}:`, cellError);
        labels[cell] = `Extended Field ${i + 1}`;
      }
    }
    
    return labels;
  } catch (error) {
    console.error('Error getting extended labels:', error);
    const fallbackLabels = {};
    const extendedCells = ['B106', 'B135', 'B139', 'B142', 'B147', 'B151', 'B154', 'B164', 'B167', 'B172', 'B176', 'B180', 'B185', 'B188', 'B191', 'B194'];
    extendedCells.forEach((cell, index) => {
      fallbackLabels[cell] = `Extended Field ${index + 1}`;
    });
    return fallbackLabels;
  }
}

// NEW: Populate cell from reference
function populateFromReference(targetCell, sourceCell) {
  try {
    console.log(`Populating ${targetCell} from ${sourceCell}...`);
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const sourceValue = sheet.getRange(sourceCell).getValue();
    sheet.getRange(targetCell).setValue(sourceValue);
    
    console.log(`✅ Populated ${targetCell} with value from ${sourceCell}: "${sourceValue}"`);
    
    return {
      success: true,
      targetCell: targetCell,
      sourceCell: sourceCell,
      value: sourceValue ? sourceValue.toString() : '',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`Error populating ${targetCell} from ${sourceCell}:`, error);
    throw new Error(`Failed to populate ${targetCell} from ${sourceCell}: ${error.toString()}`);
  }
}

// NEW: Get final solution options from AF199:AF209
function getFinalSolutionOptions() {
  try {
    console.log('Fetching final solution options from AF199:AF209...');
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const range = sheet.getRange('AF199:AF209');
    const values = range.getValues();
    
    const options = [];
    for (let i = 0; i < values.length; i++) {
      const value = values[i][0];
      if (value && value.toString().trim() !== '') {
        options.push({
          text: value.toString().trim(),
          rowIndex: 199 + i,
          arrayIndex: i
        });
      }
    }
    
    console.log(`Found ${options.length} final solution options`);
    return options;
  } catch (error) {
    console.error('Error getting final solution options:', error);
    throw new Error(`Failed to get final solution options: ${error.toString()}`);
  }
}

// NEW: Select final solution and populate B210
function selectFinalSolution(selectedIndex) {
  try {
    console.log(`Selecting final solution at index ${selectedIndex}...`);
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    const sheet2 = spreadsheet.getSheetByName('Sheet2');
    
    if (!sheet || !sheet2) {
      throw new Error('Required sheets not found');
    }
    
    // Get the corresponding value from Sheet2!D169:D179 (same sequence)
    const referenceRange = sheet2.getRange('D169:D179');
    const referenceValues = referenceRange.getValues();
    
    if (selectedIndex < referenceValues.length && referenceValues[selectedIndex][0]) {
      const valueToFill = referenceValues[selectedIndex][0].toString().trim();
      
      // Fill B210 with the corresponding value
      sheet.getRange('B210').setValue(valueToFill);
      
      // Clean up cells B212, B216, B220
      sheet.getRange('B212').setValue('');
      sheet.getRange('B216').setValue('');
      sheet.getRange('B220').setValue('');
      
      console.log(`✅ Selected solution ${selectedIndex}, filled B210 with "${valueToFill}", cleaned B212/B216/B220`);
      
      return {
        success: true,
        selectedIndex: selectedIndex,
        filledValue: valueToFill,
        cleanedCells: ['B212', 'B216', 'B220']
      };
    } else {
      throw new Error(`No corresponding value found at index ${selectedIndex} in Sheet2!D169:D179`);
    }
  } catch (error) {
    console.error('Error selecting final solution:', error);
    throw new Error(`Failed to select final solution: ${error.toString()}`);
  }
}

// NEW: Get options for additional questions
function getAdditionalQuestionOptions(range) {
  try {
    console.log(`Fetching additional question options from range: ${range}`);
    const spreadsheet = getSpreadsheet();
    let sheet, rangeRef;
    
    if (range.includes('!')) {
      const [sheetName, rangeAddress] = range.split('!');
      sheet = spreadsheet.getSheetByName(sheetName.replace(/'/g, ''));
      rangeRef = rangeAddress;
    } else {
      sheet = spreadsheet.getSheetByName(SHEET_NAME);
      rangeRef = range;
    }
    
    if (!sheet) {
      throw new Error(`Sheet not found in range: ${range}`);
    }
    
    const values = sheet.getRange(rangeRef).getValues();
    console.log(`Raw values from ${range}:`, values);
    const options = [];
    
    for (let i = 0; i < values.length; i++) {
      const value = values[i][0];
      if (value !== null && value !== undefined) {
        const stringValue = value.toString().trim();
        if (stringValue !== '' && stringValue !== 'undefined' && stringValue !== 'null') {
          options.push(stringValue);
        }
      }
    }
    
    // Remove duplicates
    const uniqueOptions = [];
    for (let i = 0; i < options.length; i++) {
      if (uniqueOptions.indexOf(options[i]) === -1) {
        uniqueOptions.push(options[i]);
      }
    }
    
    console.log(`Found ${uniqueOptions.length} unique options from ${range}:`, uniqueOptions);
    return uniqueOptions;
  } catch (error) {
    console.error('Error getting additional question options:', error);
    throw new Error(`Failed to get options from ${range}: ${error.toString()}`);
  }
}

// NEW: Update additional question cell
function updateAdditionalQuestion(cell, value) {
  try {
    console.log(`Updating additional question ${cell} with value: ${value}`);
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    const cellRange = sheet.getRange(cell);
    cellRange.setValue(value);
    
    const updatedValue = cellRange.getValue();
    console.log(`✅ Updated ${cell} with value: ${updatedValue}`);
    
    return {
      success: true,
      cell: cell,
      value: value,
      updatedValue: updatedValue ? updatedValue.toString() : ''
    };
  } catch (error) {
    console.error(`Error updating ${cell}:`, error);
    throw new Error(`Failed to update ${cell}: ${error.toString()}`);
  }
}

// NEW: Get final product string from A234
function getFinalProductString() {
  try {
    console.log('Fetching final product string from A234...');
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }
    
    // Add delay to ensure calculations are complete
    Utilities.sleep(1000);
    
    const value = sheet.getRange('A234').getValue();
    const productString = value ? value.toString().trim() : '';
    
    console.log(`Final product string from A234: "${productString}"`);
    console.log(`Product string length: ${productString.length}`);
    console.log(`Product string is empty: ${productString === ''}`);
    
    return {
      productString: productString,
      cell: 'A234',
      timestamp: new Date().toISOString(),
      success: productString !== ''
    };
  } catch (error) {
    console.error('Error getting final product string:', error);
    throw new Error(`Failed to get final product string: ${error.toString()}`);
  }
}