// ENHANCED Google Apps Script - Extended Workflow Support v11.0 with RLR Logic - SYNTAX FIXED
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

// Extended question cells and ranges - CORRECTED SYNTAX
const EXTENDED_CELLS = [
  'B106', 'B135', 'B139', 'B142', 'B147', 'B151', 'B154', 
  'B164', 'B167', 'B172', 'B176', 'B180', 'B185', 'B188', 'B191', 'B194'
];

const EXTENDED_RANGES = {
  'B106': "'Media compatibility 2'!$A$7:$A",
  'B135': 'Sheet2!$E$118:$E$127',
  'B139': 'Sheet2!$E$129:$E$137',
  'B142': 'Sheet2!$B$129:$B$132',
  'B147': 'Sheet2!$B$139:$B$140',
  'B151': 'Sheet2!$A$216:$A$220',
  'B154': "'String Builder'!$A$155:$A$163",
  'B164': 'Sheet2!$D$139:$D$155',
  'B167': 'Sheet2!$E$139:$E$145',
  'B172': 'Sheet2!$A$161:$A$162',
  'B176': 'Sheet2!$A$169:$A$191',
  'B180': 'Sheet2!$E$161:$E$166',
  'B185': 'Sheet2!$B$169:$B$171',
  'B188': 'Sheet2!$C$169:$C$171',
  'B191': 'Sheet2!$A$224:$A$226',
  'B194': 'Sheet2!$B$224:$B$226'
};

// Compatibility chart ranges - CORRECTED SYNTAX
const COMPATIBILITY_CHARTS = {
  'B135': "'String Builder'!B107:D119",
  'B139': "'String Builder'!B120:D134"
};

// RLR auto-population mapping (target cell -> source column)
const RLR_MAPPING = {
  'B96': 'J',  // Model number from J column
  'B99': 'H',  // From H column
  'B101': 'G', // From G column
  'B103': 'BS' // From BS column
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
    const parts = pair.split('=');
    const key = parts[0];
    const value = parts[1];
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
    
    // Handle GET parameters and form data
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
      
      if (!postData && Object.keys(e.parameter).length > 0) {
        postData = e.parameter;
        console.log('Form data parameters:', postData);
      }
    }
    
    // Handle JSON POST data
    if (e.postData && e.postData.contents) {
      try {
        if (e.postData.type === 'application/json') {
          console.log('Processing JSON data');
          postData = JSON.parse(e.postData.contents);
        } else if (e.postData.type === 'application/x-www-form-urlencoded' && !postData) {
          console.log('Processing form data from POST body');
          const formParams = parseFormData(e.postData.contents);
          
          if (formParams.data) {
            postData = JSON.parse(formParams.data);
          } else {
            postData = formParams;
          }
        }
        
        if (!action && postData && postData.action) {
          action = postData.action;
        }
        console.log('POST data processed:', postData);
      } catch (parseError) {
        console.error('Parse Error:', parseError);
        return createCORSResponse(JSON.stringify({
          success: false,
          error: 'Error parsing POST data',
          details: parseError.toString()
        }));
      }
    }
    
    console.log('Final action:', action, 'Final postData:', postData);
    
    if (!action) {
      console.error('No action specified');
      return createCORSResponse(JSON.stringify({ 
        success: false, 
        error: 'No action specified. Use ?action=actionName or include action in POST body',
        availableActions: [
          'getLabels', 'getValues', 'getOptions', 'updateValue', 'getResults', 'testConnection', 
          'clearAllValues', 'getApplicationTypes', 'getCustomRange', 'autoSelectSingleOptions', 
          'checkSingleOption', 'autoSelectCell', 'populateFromReference', 'getSearchableOptions',
          'getMediaCompatibilityChart', 'getFinalResults', 'clearExtendedCells', 'processResultSelection',
          'populateFromRLR', 'getExtendedLabels'
        ],
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
          throw new Error('Both cell and value parameters required for updateValue');
        }
        result = updateDropdownValue(postData.cell, postData.value);
        break;
        
      case 'getResults':
        console.log('Executing getResults - returns result selection options from CE76:CE95');
        result = getResults();
        break;
        
      case 'testConnection':
        console.log('Executing testConnection');
        result = { 
          message: 'Connection successful', 
          timestamp: new Date().toISOString(),
          version: 'Extended Workflow Version - v11.0 with RLR Logic - SYNTAX FIXED',
          method: e.postData ? 'POST' : 'GET',
          hasParams: !!(e.parameter),
          params: e.parameter || {},
          rlrMapping: RLR_MAPPING,
          workflow: 'result_selection → RLR_calculation → auto_populate → extended_questions → final_results',
          syntaxFixed: 'All syntax errors resolved'
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
        console.log('Executing autoSelectSingleOptions (batch)');
        result = autoSelectSingleOptions();
        break;
        
      case 'checkSingleOption':
        console.log('Executing checkSingleOption with data:', postData);
        if (!postData || (!postData.cell && !e.parameter.cell)) {
          throw new Error('Cell parameter required for checkSingleOption');
        }
        result = checkSingleOption(postData.cell || e.parameter.cell);
        break;
        
      case 'autoSelectCell':
        console.log('Executing autoSelectCell with data:', postData);
        if (!postData || (!postData.cell && !e.parameter.cell)) {
          throw new Error('Cell parameter required for autoSelectCell');
        }
        result = autoSelectCell(postData.cell || e.parameter.cell);
        break;
        
      case 'populateFromReference':
        console.log('Executing populateFromReference with data:', postData);
        if (!e.parameter || !e.parameter.targetCell || !e.parameter.sourceCell) {
          throw new Error('Both targetCell and sourceCell parameters required for populateFromReference');
        }
        result = populateFromReference(e.parameter.targetCell, e.parameter.sourceCell);
        break;
        
      case 'getSearchableOptions':
        console.log('Executing getSearchableOptions with data:', postData);
        if (!e.parameter || !e.parameter.range) {
          throw new Error('Range parameter required for getSearchableOptions');
        }
        result = getSearchableOptions(e.parameter.range);
        break;
        
      case 'getMediaCompatibilityChart':
        console.log('Executing getMediaCompatibilityChart with data:', postData);
        if (!e.parameter || !e.parameter.range) {
          throw new Error('Range parameter required for getMediaCompatibilityChart');
        }
        result = getMediaCompatibilityChart(e.parameter.range);
        break;
        
      case 'getFinalResults':
        console.log('Executing getFinalResults - returns A198:W209');
        result = getFinalResults();
        break;
        
      case 'clearExtendedCells':
        console.log('Executing clearExtendedCells');
        result = clearExtendedCells();
        break;
        
      case 'processResultSelection':
        console.log('Executing processResultSelection with data:', postData);
        if (!postData || !postData.selectedValue) {
          throw new Error('selectedValue parameter required for processResultSelection');
        }
        result = processResultSelection(postData.selectedValue, postData.selectedDescription);
        break;
        
      case 'populateFromRLR':
        console.log('Executing populateFromRLR with data:', postData);
        if (!postData || !postData.rlr) {
          throw new Error('RLR parameter required for populateFromRLR');
        }
        result = populateFromRLR(postData.rlr);
        break;
        
      case 'getExtendedLabels':
        console.log('Executing getExtendedLabels');
        result = getExtendedLabels();
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

// ===== NEW RLR WORKFLOW FUNCTIONS =====

// NEW: Process result selection and determine RLR
function processResultSelection(selectedValue, selectedDescription) {
  try {
    console.log('🎯 Processing result selection: "' + selectedValue + '"');
    
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found');
    }
    
    // Get data from CE76:CE95 to find the RLR
    const range = sheet.getRange('CE76:CE95');
    const values = range.getValues();
    
    let rlr = null;
    let foundIndex = -1;
    
    // Find the selected value in the range
    for (let i = 0; i < values.length; i++) {
      const cellValue = values[i][0];
      if (cellValue && cellValue.toString().trim() === selectedValue.toString().trim()) {
        rlr = 76 + i; // Calculate actual row number (CE76 is row 76)
        foundIndex = i;
        break;
      }
    }
    
    if (rlr === null) {
      throw new Error('Selected value "' + selectedValue + '" not found in CE76:CE95 range');
    }
    
    console.log('🎯 Found RLR: ' + rlr + ' (index ' + foundIndex + ') for value "' + selectedValue + '"');
    
    // Now populate the RLR-based cells
    const populationResult = populateFromRLR(rlr);
    
    // Clear extended cells for new question sequence
    const clearResult = clearExtendedCells();
    
    return {
      success: true,
      selectedValue: selectedValue,
      selectedDescription: selectedDescription || '',
      rlr: rlr,
      rowIndex: foundIndex,
      populationResult: populationResult,
      clearResult: clearResult,
      nextStep: 'extended_questions',
      message: 'Result selection processed. RLR: ' + rlr + '. Ready for extended questions.',
      workflow: {
        step: '13th_step_completed',
        next: 'extended_questions_B106_to_B194',
        autoPopulated: Object.keys(RLR_MAPPING),
        clearedCells: EXTENDED_CELLS.length
      }
    };
    
  } catch (error) {
    console.error('❌ Error processing result selection:', error);
    throw new Error('Result selection processing failed: ' + error.toString());
  }
}

// NEW: Populate cells using RLR (Row Location Reference)
function populateFromRLR(rlr) {
  try {
    console.log('📋 Populating cells using RLR: ' + rlr + '...');
    
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found');
    }
    
    const results = {
      populated: [],
      failed: [],
      rlr: rlr
    };
    
    // Populate each mapped cell
    const targetCells = Object.keys(RLR_MAPPING);
    for (let i = 0; i < targetCells.length; i++) {
      const targetCell = targetCells[i];
      try {
        const sourceColumn = RLR_MAPPING[targetCell];
        const sourceCell = sourceColumn + rlr;
        
        console.log('📋 Populating ' + targetCell + ' from ' + sourceCell + '...');
        
        // Get value from source cell
        const sourceValue = sheet.getRange(sourceCell).getValue();
        console.log('📋 Source value from ' + sourceCell + ':', sourceValue);
        
        // Set value to target cell
        sheet.getRange(targetCell).setValue(sourceValue);
        
        // Verify the update
        const updatedValue = sheet.getRange(targetCell).getValue();
        
        results.populated.push({
          targetCell: targetCell,
          sourceCell: sourceCell,
          value: updatedValue ? updatedValue.toString() : '',
          sourceColumn: sourceColumn
        });
        
        console.log('✅ Successfully populated ' + targetCell + ' with "' + updatedValue + '" from ' + sourceCell);
        
      } catch (cellError) {
        console.error('❌ Error populating ' + targetCell + ':', cellError);
        results.failed.push({
          targetCell: targetCell,
          sourceCell: RLR_MAPPING[targetCell] + rlr,
          error: cellError.toString()
        });
      }
    }
    
    console.log('✅ RLR population completed: ' + results.populated.length + ' cells populated, ' + results.failed.length + ' failed');
    
    return {
      success: true,
      populated: results.populated,
      failed: results.failed,
      rlr: results.rlr,
      timestamp: new Date().toISOString(),
      message: 'RLR population completed: ' + results.populated.length + ' cells populated using row ' + rlr,
      mapping: RLR_MAPPING
    };
    
  } catch (error) {
    console.error('❌ Error in RLR population:', error);
    throw new Error('RLR population failed: ' + error.toString());
  }
}

// UPDATED: getResults now returns selection options from CE76:CE95 (13th step)
function getResults() {
  try {
    console.log('📋 Fetching result selection options from CE76:CE95 (13th step)...');
    
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found');
    }
    
    const range = sheet.getRange('CE76:CE95');
    const values = range.getValues();
    
    const results = [];
    
    // Process each row and include row number for RLR calculation
    for (let i = 0; i < values.length; i++) {
      const cellValue = values[i][0]; // CE column value
      if (cellValue && cellValue.toString().trim() !== '') {
        results.push({
          rowNumber: 76 + i,          // Actual row number (RLR)
          column: 'CE',               // Column identifier
          value: cellValue.toString().trim(),
          description: 'Choose most optimum solution for your application: ' + cellValue.toString().trim(),
          index: i,                   // Array index for reference
          cell: 'CE' + (76 + i)       // Full cell reference
        });
      }
    }
    
    console.log('📋 Found ' + results.length + ' result options in CE76:CE95 for 13th step');
    
    return {
      step: '13th_step',
      title: 'Choose most optimum solution for your application',
      options: results,
      count: results.length,
      range: 'CE76:CE95',
      instructions: 'Select one option to proceed with RLR-based auto-population',
      nextActions: ['processResultSelection', 'populateFromRLR', 'clearExtendedCells']
    };
    
  } catch (error) {
    console.error('Error getting results:', error);
    return {
      step: '13th_step',
      title: 'Choose most optimum solution for your application',
      options: [],
      count: 0,
      error: error.toString()
    };
  }
}

// ===== EXISTING FUNCTIONS (UPDATED) =====

// Populate reference cells based on selected result row (legacy function)
function populateFromReference(targetCell, sourceCell) {
  try {
    console.log('📋 Populating ' + targetCell + ' from ' + sourceCell + '...');
    
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found');
    }
    
    // Get value from source cell
    const sourceValue = sheet.getRange(sourceCell).getValue();
    console.log('📋 Source value from ' + sourceCell + ':', sourceValue);
    
    // Set value to target cell
    sheet.getRange(targetCell).setValue(sourceValue);
    
    // Verify the update
    const updatedValue = sheet.getRange(targetCell).getValue();
    
    console.log('✅ Successfully populated ' + targetCell + ' with "' + updatedValue + '"');
    
    return {
      success: true,
      targetCell: targetCell,
      sourceCell: sourceCell,
      value: updatedValue ? updatedValue.toString() : '',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error populating ' + targetCell + ' from ' + sourceCell + ':', error);
    throw new Error('Failed to populate ' + targetCell + ' from ' + sourceCell + ': ' + error.toString());
  }
}

// Get searchable options from a range (for large dropdown lists like B106)
function getSearchableOptions(range) {
  try {
    console.log('🔍 Fetching searchable options from ' + range + '...');
    
    const spreadsheet = getSpreadsheet();
    let sheet, rangeRef;
    
    if (range.includes('!')) {
      const parts = range.split('!');
      const sheetName = parts[0];
      rangeRef = parts[1];
      // Remove quotes from sheet name if present
      const cleanSheetName = sheetName.replace(/'/g, '');
      sheet = spreadsheet.getSheetByName(cleanSheetName);
    } else {
      sheet = spreadsheet.getSheetByName(SHEET_NAME);
      rangeRef = range;
    }
    
    if (!sheet) {
      throw new Error('Sheet not found for range: ' + range);
    }
    
    const values = sheet.getRange(rangeRef).getValues();
    const options = [];
    
    // Extract all non-empty values
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const value = row[0];
      if (value !== null && value !== undefined) {
        const stringValue = value.toString().trim();
        if (stringValue !== '' && stringValue !== '#N/A' && stringValue !== 'N/A') {
          options.push(stringValue);
        }
      }
    }
    
    // Remove duplicates and sort
    const uniqueOptions = [];
    for (let i = 0; i < options.length; i++) {
      if (uniqueOptions.indexOf(options[i]) === -1) {
        uniqueOptions.push(options[i]);
      }
    }
    uniqueOptions.sort();
    
    console.log('🔍 Found ' + uniqueOptions.length + ' searchable options from ' + range);
    
    return uniqueOptions;
    
  } catch (error) {
    console.error('Error getting searchable options from ' + range + ':', error);
    return [];
  }
}

// Get media compatibility chart data
function getMediaCompatibilityChart(range) {
  try {
    console.log('📊 Fetching media compatibility chart from ' + range + '...');
    
    const spreadsheet = getSpreadsheet();
    let sheet, rangeRef;
    
    if (range.includes('!')) {
      const parts = range.split('!');
      const sheetName = parts[0];
      rangeRef = parts[1];
      // Remove quotes from sheet name if present
      const cleanSheetName = sheetName.replace(/'/g, '');
      sheet = spreadsheet.getSheetByName(cleanSheetName);
    } else {
      sheet = spreadsheet.getSheetByName(SHEET_NAME);
      rangeRef = range;
    }
    
    if (!sheet) {
      throw new Error('Sheet not found for range: ' + range);
    }
    
    const values = sheet.getRange(rangeRef).getValues();
    const chartData = [];
    
    // Process each row (assuming 3 columns: Body Material, Media Compatibility, Cost Comparison)
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      if (row.length >= 3 && row[0] && row[0].toString().trim() !== '') {
        chartData.push({
          bodyMaterial: row[0] ? row[0].toString().trim() : '',
          mediaCompatibility: row[1] ? row[1].toString().trim() : '',
          costComparison: row[2] ? row[2].toString().trim() : ''
        });
      }
    }
    
    console.log('📊 Found ' + chartData.length + ' compatibility chart entries from ' + range);
    
    return chartData;
    
  } catch (error) {
    console.error('Error getting media compatibility chart from ' + range + ':', error);
    return [];
  }
}

// UPDATED: Get final results from A198:W209 (final step after extended questions)
function getFinalResults() {
  try {
    console.log('📋 Fetching final results from A198:W209 (final step)...');
    
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found');
    }
    
    const range = sheet.getRange('A198:W209');
    const values = range.getValues();
    
    // Filter out completely empty rows
    const filteredResults = [];
    
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      // Check if row has any non-empty content
      let hasContent = false;
      for (let j = 0; j < row.length; j++) {
        if (row[j] && row[j].toString().trim() !== '') {
          hasContent = true;
          break;
        }
      }
      
      if (hasContent) {
        // Convert all cells to strings
        const stringRow = [];
        for (let j = 0; j < row.length; j++) {
          stringRow.push(row[j] ? row[j].toString() : '');
        }
        
        filteredResults.push({
          rowIndex: i,
          actualRow: 198 + i,
          data: stringRow,
          isHeader: i === 0  // First row is header
        });
      }
    }
    
    console.log('📋 Found ' + filteredResults.length + ' rows with data in final results (A198:W209)');
    
    return {
      step: 'final_results',
      title: 'Final Configuration Results',
      range: 'A198:W209',
      rows: filteredResults,
      count: filteredResults.length,
      headers: filteredResults.length > 0 ? filteredResults[0].data : [],
      dataRows: filteredResults.slice(1)
    };
    
  } catch (error) {
    console.error('Error getting final results:', error);
    return {
      step: 'final_results',
      title: 'Final Configuration Results',
      range: 'A198:W209',
      rows: [],
      count: 0,
      error: error.toString()
    };
  }
}

// Clear extended question cells (B106 to B194)
function clearExtendedCells() {
  try {
    console.log('🧹 Clearing extended question cells (B106 to B194)...');
    
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found');
    }
    
    const results = {
      cleared: [],
      failed: [],
      clearedCount: 0,
      totalCells: EXTENDED_CELLS.length
    };
    
    // Clear each extended cell
    for (let i = 0; i < EXTENDED_CELLS.length; i++) {
      const cell = EXTENDED_CELLS[i];
      try {
        const cellRange = sheet.getRange(cell);
        const currentValue = cellRange.getValue();
        
        cellRange.setValue('');
        
        results.cleared.push({
          cell: cell,
          previousValue: currentValue ? currentValue.toString() : ''
        });
        results.clearedCount++;
        console.log('✅ Cleared ' + cell + ' (was: "' + currentValue + '")');
        
      } catch (cellError) {
        console.error('❌ Error clearing ' + cell + ':', cellError);
        results.failed.push({
          cell: cell,
          error: cellError.toString()
        });
      }
    }
    
    console.log('✅ Extended cells clearing completed: ' + results.clearedCount + '/' + results.totalCells + ' cells cleared');
    
    return {
      success: true,
      cleared: results.cleared,
      failed: results.failed,
      clearedCount: results.clearedCount,
      totalCells: results.totalCells,
      timestamp: new Date().toISOString(),
      message: 'Extended cells cleared: ' + results.clearedCount + ' out of ' + results.totalCells + ' cells',
      purpose: 'Prepare for extended questions sequence (B106→B135→B139→...→B194)'
    };
    
  } catch (error) {
    console.error('❌ Error clearing extended cells:', error);
    throw new Error('Extended cells clear failed: ' + error.toString());
  }
}

// Check if a specific cell has a single option
function checkSingleOption(cell) {
  try {
    console.log('🔍 Checking single option for ' + cell + '...');
    
    // Check if it's a regular dropdown cell or extended cell
    let range;
    if (DROPDOWN_CELLS.indexOf(cell) !== -1) {
      range = DROPDOWN_RANGES[cell];
    } else if (EXTENDED_CELLS.indexOf(cell) !== -1) {
      range = EXTENDED_RANGES[cell];
    } else {
      const allCells = DROPDOWN_CELLS.concat(EXTENDED_CELLS);
      throw new Error('Invalid cell: ' + cell + '. Valid cells are: ' + allCells.join(', '));
    }
    
    if (!range) {
      throw new Error('No range defined for cell: ' + cell);
    }
    
    const spreadsheet = getSpreadsheet();
    let sheet, rangeRef;
    
    if (range.includes('!')) {
      const parts = range.split('!');
      const sheetName = parts[0];
      rangeRef = parts[1];
      // Remove quotes from sheet name if present
      const cleanSheetName = sheetName.replace(/'/g, '');
      sheet = spreadsheet.getSheetByName(cleanSheetName);
    } else {
      sheet = spreadsheet.getSheetByName(SHEET_NAME);
      rangeRef = range;
    }
    
    if (!sheet) {
      throw new Error('Sheet not found for range: ' + range);
    }
    
    const values = sheet.getRange(rangeRef).getValues();
    const nonEmptyValues = [];
    
    if (cell === 'B1') {
      // Special handling for B1
      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        for (let j = 0; j < row.length; j++) {
          const value = row[j];
          if (value !== null && value !== undefined) {
            const stringValue = value.toString().trim();
            if (stringValue !== '' || value === 0 || stringValue === '0') {
              nonEmptyValues.push(stringValue);
            }
          }
        }
      }
    } else {
      // Regular cells - first column only
      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        const value = row[0];
        if (value !== null && value !== undefined) {
          const stringValue = value.toString().trim();
          if (stringValue !== '' || value === 0 || stringValue === '0') {
            nonEmptyValues.push(stringValue);
          }
        }
      }
    }
    
    // Remove duplicates
    const uniqueOptions = [];
    for (let i = 0; i < nonEmptyValues.length; i++) {
      if (uniqueOptions.indexOf(nonEmptyValues[i]) === -1) {
        uniqueOptions.push(nonEmptyValues[i]);
      }
    }
    
    const isSingleOption = uniqueOptions.length === 1;
    const singleOption = isSingleOption ? uniqueOptions[0] : null;
    
    console.log('🔍 ' + cell + ' check result: ' + uniqueOptions.length + ' options, single: ' + isSingleOption + ', option: "' + singleOption + '"');
    
    return {
      cell: cell,
      isSingleOption: isSingleOption,
      optionCount: uniqueOptions.length,
      singleOption: singleOption,
      allOptions: uniqueOptions
    };
    
  } catch (error) {
    console.error('Error checking single option for ' + cell + ':', error);
    return {
      cell: cell,
      isSingleOption: false,
      optionCount: 0,
      singleOption: null,
      error: error.toString()
    };
  }
}

// Auto-select a specific cell if it has a single option and is empty
function autoSelectCell(cell) {
  try {
    console.log('🚀 Auto-selecting cell ' + cell + '...');
    
    // Check if it's a valid cell
    const allCells = DROPDOWN_CELLS.concat(EXTENDED_CELLS);
    if (allCells.indexOf(cell) === -1) {
      throw new Error('Invalid cell: ' + cell + '. Valid cells are: ' + allCells.join(', '));
    }
    
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found');
    }
    
    // Check current value
    const cellRange = sheet.getRange(cell);
    const currentValue = cellRange.getValue();
    
    if (currentValue && currentValue.toString().trim() !== '') {
      console.log('⏭️ ' + cell + ' already has value: "' + currentValue + '"');
      return {
        cell: cell,
        autoSelected: false,
        reason: 'Cell already has value',
        currentValue: currentValue.toString(),
        skipped: true
      };
    }
    
    // Check if single option
    const optionCheck = checkSingleOption(cell);
    
    if (optionCheck.error) {
      throw new Error(optionCheck.error);
    }
    
    if (!optionCheck.isSingleOption) {
      console.log('⏭️ ' + cell + ' has ' + optionCheck.optionCount + ' options, skipping auto-selection');
      return {
        cell: cell,
        autoSelected: false,
        reason: 'Multiple options available',
        optionCount: optionCheck.optionCount,
        skipped: true
      };
    }
    
    // Auto-select the single option
    const singleOption = optionCheck.singleOption;
    
    try {
      cellRange.setValue(singleOption);
      const updatedValue = cellRange.getValue();
      
      console.log('✅ Auto-selected ' + cell + ': "' + singleOption + '"');
      
      return {
        cell: cell,
        autoSelected: true,
        value: singleOption,
        updatedValue: updatedValue ? updatedValue.toString() : '',
        previousValue: '',
        timestamp: new Date().toISOString(),
        method: 'individual_auto_select'
      };
      
    } catch (updateError) {
      console.error('❌ Error updating ' + cell + ':', updateError);
      return {
        cell: cell,
        autoSelected: false,
        reason: 'Update failed',
        error: updateError.toString(),
        failed: true
      };
    }
    
  } catch (error) {
    console.error('Error auto-selecting ' + cell + ':', error);
    return {
      cell: cell,
      autoSelected: false,
      reason: 'Function error',
      error: error.toString(),
      failed: true
    };
  }
}

// COMPATIBILITY: Simplified but still optimized label retrieval
function getDropdownLabels() {
  try {
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found');
    }
    
    const labels = {};
    
    // COMPATIBILITY: Use traditional approach but batch the operations
    for (let i = 0; i < DROPDOWN_CELLS.length; i++) {
      const cell = DROPDOWN_CELLS[i];
      try {
        const row = parseInt(cell.substring(1));
        const labelValue = sheet.getRange('A' + row).getValue();
        labels[cell] = labelValue || ('Field ' + (i + 1));
      } catch (cellError) {
        console.error('Error getting label for ' + cell + ':', cellError);
        labels[cell] = 'Field ' + (i + 1);
      }
    }
    
    return labels;
  } catch (error) {
    console.error('Error getting labels:', error);
    const fallbackLabels = {};
    for (let i = 0; i < DROPDOWN_CELLS.length; i++) {
      const cell = DROPDOWN_CELLS[i];
      fallbackLabels[cell] = 'Field ' + (i + 1);
    }
    return fallbackLabels;
  }
}

// COMPATIBILITY: Simplified but still optimized value retrieval
function getDropdownValues() {
  try {
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found');
    }
    
    const values = {};
    
    // COMPATIBILITY: Use traditional approach
    for (let i = 0; i < DROPDOWN_CELLS.length; i++) {
      const cell = DROPDOWN_CELLS[i];
      try {
        const cellValue = sheet.getRange(cell).getValue();
        values[cell] = cellValue ? cellValue.toString() : '';
      } catch (cellError) {
        console.error('Error getting value for ' + cell + ':', cellError);
        values[cell] = '';
      }
    }
    
    return values;
  } catch (error) {
    console.error('Error getting values:', error);
    const emptyValues = {};
    for (let i = 0; i < DROPDOWN_CELLS.length; i++) {
      const cell = DROPDOWN_CELLS[i];
      emptyValues[cell] = '';
    }
    return emptyValues;
  }
}

function getDropdownOptions() {
  try {
    console.log('Starting optimized getDropdownOptions with batch fetching...');
    const spreadsheet = getSpreadsheet();
    
    // Group ranges by sheet for batch fetching
    const sheetRanges = {};
    const cellToRangeMap = {};
    
    // First pass: organize ranges by sheet
    for (let i = 0; i < DROPDOWN_CELLS.length; i++) {
      const cell = DROPDOWN_CELLS[i];
      const range = DROPDOWN_RANGES[cell];
      let sheetName, rangeAddress;
      
      if (range.includes('!')) {
        const parts = range.split('!');
        sheetName = parts[0];
        rangeAddress = parts[1];
      } else {
        sheetName = SHEET_NAME;
        rangeAddress = range;
      }
      
      if (!sheetRanges[sheetName]) {
        sheetRanges[sheetName] = [];
      }
      
      sheetRanges[sheetName].push(rangeAddress);
      cellToRangeMap[cell] = { 
        sheetName: sheetName, 
        rangeAddress: rangeAddress, 
        rangeIndex: sheetRanges[sheetName].length - 1 
      };
    }
    
    // Second pass: batch fetch all ranges per sheet
    const sheetData = {};
    
    const sheetNames = Object.keys(sheetRanges);
    for (let i = 0; i < sheetNames.length; i++) {
      const sheetName = sheetNames[i];
      try {
        const sheet = spreadsheet.getSheetByName(sheetName);
        if (!sheet) {
          console.error('Sheet "' + sheetName + '" not found');
          continue;
        }
        
        const ranges = sheetRanges[sheetName];
        console.log('Batch fetching ' + ranges.length + ' ranges from ' + sheetName);
        
        // Use batch fetching for multiple ranges
        if (ranges.length > 1) {
          const rangeList = sheet.getRangeList(ranges);
          const batchRanges = rangeList.getRanges();
          const batchValues = [];
          for (let j = 0; j < batchRanges.length; j++) {
            batchValues.push(batchRanges[j].getValues());
          }
          sheetData[sheetName] = batchValues;
        } else {
          // Single range
          const values = sheet.getRange(ranges[0]).getValues();
          sheetData[sheetName] = [values];
        }
        
      } catch (sheetError) {
        console.error('Error fetching data from sheet ' + sheetName + ':', sheetError);
        sheetData[sheetName] = [];
      }
    }
    
    // Third pass: process fetched data into options
    const options = {};
    
    for (let i = 0; i < DROPDOWN_CELLS.length; i++) {
      const cell = DROPDOWN_CELLS[i];
      try {
        const cellMap = cellToRangeMap[cell];
        const sheetName = cellMap.sheetName;
        const rangeIndex = cellMap.rangeIndex;
        const values = sheetData[sheetName] && sheetData[sheetName][rangeIndex] ? sheetData[sheetName][rangeIndex] : [];
        
        const cellOptions = [];
        
        if (cell === 'B1') {
          // Special handling for B1 - get all non-empty values from all columns
          for (let j = 0; j < values.length; j++) {
            const row = values[j];
            for (let k = 0; k < row.length; k++) {
              const value = row[k];
              if (value !== null && value !== undefined) {
                const stringValue = value.toString().trim();
                if (stringValue !== '' || value === 0 || stringValue === '0') {
                  cellOptions.push(stringValue);
                }
              }
            }
          }
        } else {
          // For other cells, get first column values only
          for (let j = 0; j < values.length; j++) {
            const row = values[j];
            const value = row[0];
            if (value !== null && value !== undefined) {
              const stringValue = value.toString().trim();
              if (stringValue !== '' || value === 0 || stringValue === '0') {
                cellOptions.push(stringValue);
              }
            }
          }
        }
        
        // Remove duplicates
        const uniqueOptions = [];
        for (let j = 0; j < cellOptions.length; j++) {
          const option = cellOptions[j];
          if (uniqueOptions.indexOf(option) === -1) {
            uniqueOptions.push(option);
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
            console.log(cell + ' sorting failed, using original order');
          }
        }
        
        options[cell] = uniqueOptions;
        
      } catch (cellError) {
        console.error('Error processing options for ' + cell + ':', cellError);
        options[cell] = ['Option 1 for ' + cell, 'Option 2 for ' + cell];
      }
    }
    
    console.log('Optimized getDropdownOptions completed successfully');
    
    return options;
  } catch (error) {
    console.error('Error getting dropdown options:', error);
    const defaultOptions = {};
    for (let i = 0; i < DROPDOWN_CELLS.length; i++) {
      const cell = DROPDOWN_CELLS[i];
      defaultOptions[cell] = ['Option 1', 'Option 2', 'Option 3'];
    }
    return defaultOptions;
  }
}

// COMPATIBILITY: Simplified but reliable update
function updateDropdownValue(cell, value) {
  try {
    console.log('Attempting to update ' + cell + ' with value:', value);
    
    // Check if it's a valid cell (either dropdown or extended)
    const allCells = DROPDOWN_CELLS.concat(EXTENDED_CELLS);
    if (allCells.indexOf(cell) === -1) {
      throw new Error('Invalid cell: ' + cell + '. Valid cells are: ' + allCells.join(', '));
    }
    
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found');
    }
    
    const cellRange = sheet.getRange(cell);
    
    // COMPATIBILITY: Simple, reliable approach
    try {
      cellRange.setValue(value);
      const updatedValue = cellRange.getValue();
      
      console.log('Successfully updated ' + cell + '. New value:', updatedValue);
      
      return { 
        success: true, 
        cell: cell, 
        value: value,
        updatedValue: updatedValue ? updatedValue.toString() : '',
        timestamp: new Date().toISOString(),
        method: 'compatible_direct'
      };
    } catch (directError) {
      console.log('Direct update failed for ' + cell + ', trying validation method');
      
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
    throw new Error('Failed to update ' + cell + ' with value ' + value + ': ' + error.toString());
  }
}

// COMPATIBILITY: Reliable bulk clearing
function clearAllDropdownValues() {
  try {
    console.log('Starting compatible clearAllDropdownValues...');
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found');
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
        console.log('✅ Cleared ' + cell + ' (was: "' + currentValue + '")');
        
      } catch (cellError) {
        console.error('❌ Error clearing ' + cell + ':', cellError);
        results.failed.push({
          cell: cell,
          error: cellError.toString()
        });
      }
    }
    
    console.log('✅ Compatible clearing completed: ' + results.clearedCount + '/' + results.totalCells + ' cells cleared');
    
    return { 
      success: true, 
      cleared: results.cleared,
      failed: results.failed,
      clearedCount: results.clearedCount,
      totalCells: results.totalCells,
      timestamp: new Date().toISOString(),
      message: 'Compatible clearing: ' + results.clearedCount + ' out of ' + results.totalCells + ' dropdown cells cleared',
      version: 'compatible_clearing'
    };
    
  } catch (error) {
    console.error('❌ Error in compatible clearAllDropdownValues:', error);
    throw new Error('Compatible clear failed: ' + error.toString());
  }
}

// COMPATIBILITY: Reliable auto-selection (batch - kept for backward compatibility)
function autoSelectSingleOptions() {
  try {
    console.log('Starting batch autoSelectSingleOptions...');
    const startTime = new Date().getTime();
    
    const results = {
      autoSelected: [],
      skipped: [],
      failed: [],
      executionTime: 0
    };
    
    // Process each cell individually
    for (let i = 0; i < DROPDOWN_CELLS.length; i++) {
      const cell = DROPDOWN_CELLS[i];
      try {
        const result = autoSelectCell(cell);
        
        if (result.autoSelected) {
          results.autoSelected.push({
            cell: result.cell,
            value: result.value,
            previousValue: result.previousValue || ''
          });
        } else if (result.skipped) {
          results.skipped.push({
            cell: result.cell,
            reason: result.reason,
            currentValue: result.currentValue,
            optionCount: result.optionCount
          });
        } else if (result.failed) {
          results.failed.push({
            cell: result.cell,
            error: result.error
          });
        }
        
      } catch (error) {
        console.error('Error processing ' + cell + ':', error);
        results.failed.push({
          cell: cell,
          error: error.toString()
        });
      }
    }
    
    const endTime = new Date().getTime();
    results.executionTime = endTime - startTime;
    
    console.log('Batch auto-selection completed in ' + results.executionTime + 'ms: ' + results.autoSelected.length + ' selected, ' + results.skipped.length + ' skipped, ' + results.failed.length + ' failed');
    
    return {
      success: true,
      autoSelected: results.autoSelected,
      skipped: results.skipped,
      failed: results.failed,
      executionTime: results.executionTime,
      timestamp: new Date().toISOString(),
      summary: 'Batch auto-selected ' + results.autoSelected.length + ' single-option dropdowns in ' + results.executionTime + 'ms',
      version: 'extended_workflow_v11.0_with_rlr_syntax_fixed'
    };
    
  } catch (error) {
    console.error('Error in batch autoSelectSingleOptions:', error);
    throw new Error('Batch auto-selection failed: ' + error.toString());
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
    
    console.log('Found ' + rows.length + ' rows with data in C303:D330 range');
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

// Get extended question labels from A column cells
function getExtendedLabels() {
  try {
    console.log('Fetching extended question labels from A column...');
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found');
    }
    
    // Map B cells to corresponding A cells for labels
    const labelCells = ['A106', 'A135', 'A139', 'A142', 'A147', 'A151', 'A154', 'A164', 'A167', 'A172', 'A176', 'A180', 'A185', 'A188', 'A191', 'A194'];
    const bCells = ['B106', 'B135', 'B139', 'B142', 'B147', 'B151', 'B154', 'B164', 'B167', 'B172', 'B176', 'B180', 'B185', 'B188', 'B191', 'B194'];
    const labels = {};
    
    // Fetch all labels in batch
    for (let i = 0; i < labelCells.length; i++) {
      const aCell = labelCells[i];
      const bCell = bCells[i];
      try {
        const labelValue = sheet.getRange(aCell).getValue();
        labels[bCell] = labelValue ? labelValue.toString().trim() : ('Extended Question ' + (i + 1));
        console.log('Label for ' + bCell + ' from ' + aCell + ':', labels[bCell]);
      } catch (cellError) {
        console.error('Error getting label for ' + aCell + ':', cellError);
        labels[bCell] = 'Extended Question ' + (i + 1);
      }
    }
    
    console.log('Extended labels fetched successfully');
    return {
      success: true,
      labels: labels,
      timestamp: new Date().toISOString(),
      message: 'Extended labels fetched from A column cells'
    };
  } catch (error) {
    console.error('Error getting extended labels:', error);
    return {
      success: false,
      error: error.toString(),
      labels: {},
      timestamp: new Date().toISOString()
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
    
    console.log('Found ' + applicationTypes.length + ' application types');
    return applicationTypes;
  } catch (error) {
    console.error('Error getting application types:', error);
    return [];
  }
}