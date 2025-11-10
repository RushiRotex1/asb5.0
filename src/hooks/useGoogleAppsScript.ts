import { useState, useEffect } from 'react';
import { googleAppsScriptService } from '../services/googleAppsScript';
import { GOOGLE_APPS_SCRIPT_URL } from '../constants/googleAppsScript';
import { ApplicationType, ResultOption, ExtendedQuestion } from '../types';

// Optimized helper function to check if options are valid (simplified)
const hasValidOptions = (options: string[]): boolean => {
  return options && options.length > 0 && options.some(option => 
    option && option.toString().trim() !== '' && !option.includes('#N/A')
  );
};

export const useGoogleAppsScript = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState<{ [key: string]: string }>({});
  const [values, setValues] = useState<{ [key: string]: string }>({});
  const [results, setResults] = useState<ResultOption[]>([]);
  const [dropdownOptions, setDropdownOptions] = useState<{ [key: string]: string[] }>({});
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
  const [resultOptions, setResultOptions] = useState<ResultOption[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(null);
  const [selectedResultText, setSelectedResultText] = useState<string>('');
  const [extendedQuestions, setExtendedQuestions] = useState<ExtendedQuestion[]>([]);
  const [currentExtendedStep, setCurrentExtendedStep] = useState(0);
  const [extendedValues, setExtendedValues] = useState<{ [key: string]: string }>({});
  const [finalResults, setFinalResults] = useState<string[][]>([]);
  const [phase, setPhase] = useState<'initial' | 'result-selection' | 'extended' | 'final-solution' | 'additional-questions' | 'final-product'>('initial');
  const [finalSolutionOptions, setFinalSolutionOptions] = useState<any[]>([]);
  const [additionalQuestionStep, setAdditionalQuestionStep] = useState(0);
  const [additionalQuestionValues, setAdditionalQuestionValues] = useState<{ [key: string]: string }>({});
  const [selectedFinalSolutionText, setSelectedFinalSolutionText] = useState<string>('');
  const [finalProductString, setFinalProductString] = useState<string>('');

  const skipToResults = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Skipping directly to final solutions (Question 30)...');
      
      // Fetch final solution options directly without clearing or processing
      const solutionOptions = await googleAppsScriptService.getFinalSolutionOptions();
      console.log('📋 Final solution options from skip:', solutionOptions);
      
      if (solutionOptions && solutionOptions.length > 0) {
        console.log('✅ Skip to final solutions successful:', solutionOptions.length, 'options found');
        setFinalSolutionOptions(solutionOptions);
        setPhase('final-solution');
      } else {
        throw new Error('No valid final solution options found in AF199:AF209 range');
      }
    } catch (err) {
      console.error('❌ Skip to final solutions failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to skip to final solutions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeScript = async () => {
      if (!mounted) return;

      setIsLoading(true);
      setError(null);
      setIsConnected(false);

      try {
        console.log('🚀 Initializing optimized Google Apps Script...');

        if (GOOGLE_APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' || !GOOGLE_APPS_SCRIPT_URL) {
          if (mounted) {
            console.warn('⚠️ Google Apps Script URL not configured');
            setError('Google Apps Script URL not configured. Please update the URL in src/constants/googleAppsScript.js');
            setIsLoading(false);
          }
          return;
        }

        googleAppsScriptService.initialize(GOOGLE_APPS_SCRIPT_URL);

        if (!googleAppsScriptService.isInitialized) {
          if (mounted) {
            setError('Invalid Google Apps Script URL format');
            setIsLoading(false);
          }
          return;
        }

        try {
          console.log('⚡ Testing optimized connection...');
          const testResult = await googleAppsScriptService.testConnection();

          if (!mounted) return;

          console.log('✅ Connection established:', testResult);
          setIsConnected(true);

          console.log('📊 Loading initial data with optimized batch operations...');
          const [labels, values, appTypes] = await Promise.all([
            googleAppsScriptService.getDropdownLabels(),
            googleAppsScriptService.getDropdownValues(),
            googleAppsScriptService.getApplicationTypes()
          ]);

          if (!mounted) return;

          console.log('⚡ Fetching options without validation delays...');
          const options = await googleAppsScriptService.getDropdownOptions();

          if (!mounted) return;

          setLabels(labels);
          setValues(values);
          setDropdownOptions(options);
          setApplicationTypes(appTypes);

          console.log('✅ Fast initialization complete');
          console.log(`📊 Loaded: ${Object.keys(labels).length} labels, ${appTypes.length} app types`);
        } catch (connectionError) {
          if (!mounted) return;

          console.error('Optimized connection failed:', connectionError);
          const errorMessage = connectionError instanceof Error ? connectionError.message : 'Failed to connect to Google Apps Script';
          setError(errorMessage);
          throw connectionError;
        }
      } catch (err) {
        if (!mounted) return;

        console.warn('❌ Script initialization failed:', err);
        setIsLoading(false);
        setIsConnected(false);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeScript();

    return () => {
      mounted = false;
    };
  }, []);

  // Optimized function to fetch options with minimal delay
  const fetchOptionsOptimized = async (currentValues: { [key: string]: string } = values): Promise<{ [key: string]: string[] }> => {
    console.log('⚡ Fast fetching options...');
    const options = await googleAppsScriptService.getDropdownOptions();
    
    // Quick validation - only check if we have some options
    const hasAnyValidOptions = Object.values(options).some(cellOptions => hasValidOptions(cellOptions));
    
    if (!hasAnyValidOptions) {
      console.log('⏳ Options not ready, waiting 500ms...');
      await new Promise(resolve => setTimeout(resolve, 500));
      return googleAppsScriptService.getDropdownOptions();
    }
    
    return options;
  };

  const reinitializeScript = async () => {
    setIsLoading(true);
    setError(null);
    setIsConnected(false);
    
    try {
      console.log('🔄 Re-initializing optimized Google Apps Script...');
      googleAppsScriptService.initialize(GOOGLE_APPS_SCRIPT_URL);
      
      try {
        console.log('⚡ Re-testing optimized connection...');
        const testResult = await googleAppsScriptService.testConnection();
        setIsConnected(true);
        
        console.log('📊 Reloading data with optimized batch operations...');
        const [labels, values, appTypes] = await Promise.all([
          googleAppsScriptService.getDropdownLabels(),
          googleAppsScriptService.getDropdownValues(),
          googleAppsScriptService.getApplicationTypes()
        ]);
        
        // Fetch options with optimized logic
        const options = await fetchOptionsOptimized(values);
        
        setLabels(labels);
        setValues(values);
        setDropdownOptions(options);
        setApplicationTypes(appTypes);
        
      } catch (connectionError) {
        throw connectionError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Google Apps Script';
      console.error('Script initialization failed:', errorMessage);
      setError(errorMessage);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSingleValue = async (cell: string, value: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await googleAppsScriptService.updateDropdownValue(cell, value);
      
      console.log(`⚡ Refreshing options after ${cell} update`);
      setValues(prev => ({ ...prev, [cell]: value }));
      
      // Fetch updated options with optimized logic - much faster
      const updatedOptions = await fetchOptionsOptimized({ ...values, [cell]: value });
      setDropdownOptions(updatedOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update value');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshResults = async (): Promise<ResultOption[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 DEBUG: Starting refreshResults...');
      const rawResults = await googleAppsScriptService.getResults();
      console.log('🔍 DEBUG: Raw results received in hook:', rawResults);
      console.log('🔍 DEBUG: Raw results length:', rawResults.length);
      
      // Convert 2D array to ResultOption format
      const mappedResults: ResultOption[] = rawResults
        .map((row, index) => ({
          text: row[0] || `Option ${index + 1}`,
          rowIndex: index + 76 // CE76 is the starting row
        }))
        .filter(option => {
          const text = option.text;
          return text && 
                 text.trim() !== '' && 
                 !text.includes('#N/A') && 
                 !text.includes('#NA') && 
                 !text.includes('N/A') &&
                 text !== 'undefined' &&
                 text !== 'null' &&
                 !text.startsWith('Option '); // Filter out placeholder options
        });
      
      console.log('🔍 DEBUG: Mapped results:', mappedResults);
      console.log('🔍 DEBUG: Mapped results length:', mappedResults.length);
      
      setResults(mappedResults);
      return mappedResults;
    } catch (err) {
      console.error('❌ DEBUG: Failed to refresh results:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh results');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllValues = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧹 Clearing all values...');
      await googleAppsScriptService.clearAllValues();
      
      // Refresh all data after clearing
      console.log('🔄 Refreshing data after clearing...');
      const [updatedLabels, updatedValues, updatedAppTypes] = await Promise.all([
        googleAppsScriptService.getDropdownLabels(),
        googleAppsScriptService.getDropdownValues(),
        googleAppsScriptService.getApplicationTypes()
      ]);
      
      // Fetch updated options with optimized logic
      const updatedOptions = await fetchOptionsOptimized();
      
      setLabels(updatedLabels);
      setValues(updatedValues);
      setDropdownOptions(updatedOptions);
      setApplicationTypes(updatedAppTypes);
      
      console.log('✅ All data refreshed after clearing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear all values');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const selectResultOption = async (optionIndex: number, selectedApplication: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const selectedOption = resultOptions[optionIndex];
      console.log(`🎯 Processing result selection:`, selectedOption);
      setSelectedResultIndex(optionIndex);
      setSelectedResultText(selectedOption.text);
      
      // Store the result selection for traceability
      setValues(prev => ({ 
        ...prev, 
        'APPLICATION_DESCRIPTION': selectedApplication, // Store the application description as Q1
        'RESULT_SELECTION': selectedOption.text 
      }));
      
      console.log(`🎯 DEBUG: Stored APPLICATION_DESCRIPTION and RESULT_SELECTION in values`);
      
      // Get the selected value and calculate RLR
      const selectedValue = selectedOption.text;
      const rlr = selectedOption.rowIndex; // This is already the correct row number (76+)
      
      console.log(`🎯 Selected: "${selectedValue}" at row ${rlr}`);
      
      // Auto-populate the reference cells using RLR
      console.log('📋 Auto-populating reference cells...');
      await Promise.all([
        googleAppsScriptService.populateFromReference('B96', `J${rlr}`), // Model number
        googleAppsScriptService.populateFromReference('B99', `H${rlr}`),
        googleAppsScriptService.populateFromReference('B101', `G${rlr}`),
        googleAppsScriptService.populateFromReference('B103', `BS${rlr}`)
      ]);
      
      // Clear extended cells for new question sequence
      await googleAppsScriptService.clearExtendedCells();
      
      // ========================================
      // EXTENDED QUESTION LABELS CONFIGURATION
      // ========================================
      // Edit this section to modify labels and descriptions for extended questions (13-28)
      // Format: Cell: "Main Label" ; 'Sub label' *special notes
      
      const EXTENDED_LABELS = {
        B106: {
          label: "Select Media",
          description: "Media which is passing through solenoid valve becomes critical in defining its seals, body material and even design"
        },
        B135: {
          label: "Choose Body Material", 
          description: "Table gives you indication of compatibility of various body material with media. Contact Rotex if your media does not meet our standard offering"
        },
        B139: {
          label: "Choose Seal Material",
          description: "Table gives you indication of compatibility of various seal material with media and their operating temperature range. Contact Rotex if your media and/or operating temperature range do not meet our standard offering"
        },
        B142: {
          label: "Choose Manual Actuation (MA) Type",
          description: "NIL: No Provision for Manual actuation to be provided\nStayput: Provision for Momentary and also provision to lock valve in energized condition manually if needed\nMomentary: No locking type i.e. valve will shift position till lever or knob is pressed and return back to default position on release"
        },
        B147: {
          label: "Do you need Anti Corrosive Operator ?",
          description: "Anti Corrosive operators are recommend for aggressive media as otherwise it will corrode the operator and provide limited operating life",
          tableRange: "'String Builder'!A149:B149"
        },
        B151: {
          label: "Do you need Weather Proof certification at Valve body level ?",
          description: "Only for valve level, relevant for external pilot operated valves without solenoid"
        },
        B154: {
          label: "Any Valve Accessory needed",
          description: "These are addon which you can opt as an option, below mentions the description of available option",
          tableRange: "'String Builder'!A155:B163"
        },
        B164: {
          label: "Select Solenoid Operating Voltage",
          description: "Here AC/DC means such coils can work with either AC or DC voltage i.e. 220V AC/DC can work with 220V DC as well as 220V 50 Hz or even 220V 60 Hz"
        },
        B167: {
          label: "Minimum Ingress Protection requirement",
          description: "also called as weather protection class or IP ratings,\nIP54 ($) : For in-house application, resistance to normal dust but not dust proof and resistance to splashing of water\nIP66 ($$) : For external application, dust proof and resistance to normal rains\nIP67 ($$$): For external application, dust proof and resistance to normal rains & even short duration water submersion\nIP68 ($$$$): For under water or under ground application, dust proof"
        },
        B172: {
          label: "Do you need Flame Proof or explosion proof Solenoid ?",
          description: "Flame Proof Solenoids: They are needed when hazardous environment with flammable media exist in surrounding"
        },
        B176: {
          label: "Choose Solenoid Enclosure Certification needed",
          description: "These are 3rd party certifications provided by external agency to certify our solenoid meeting specific requirements. Here only those certification options are shown where minimum IP requirement are met"
        },
        B180: {
          label: "Choose Type of Enclosure",
          description: "Select Enclosure meeting your specific need,\nPlug-in :Solenoid with DIN connector.\nFlying Lead: Solenoid with wire & no junction\nTerminal Box: Solenoid with inbuilt junction box\nM25 X 1.5 is a $$$ options compare to others"
        },
        B185: {
          label: "Do you need LED indication ?",
          description: "LED provides indication whether supply is connected to solenoid or not. Adds great value during installation and maintenance"
        },
        B188: {
          label: "Do you need Surge Suppressor in the coil ?",
          description: "Surge suppressor are used in ONLY DC coils to avoid a back surge from the coil to protect the power source and other equipment connected to same power source"
        },
        B191: {
          label: "Do you need Timer accessories ?",
          description: "It is an optional accessory available with only coil type 25 where solenoid On time and frequency of operation can be set for auto operation of solenoid valve based on time"
        },
        B194: {
          label: "Do you need Thermal Fuse?",
          description: "Thermal fuse protection for coil overheating"
        }
      };

      const questions: ExtendedQuestion[] = [
        { 
          cell: 'B106', 
          label: EXTENDED_LABELS.B106.label,
          description: EXTENDED_LABELS.B106.description,
          range: "'Media compatibility 2'!A7:A", 
          type: 'searchable' 
        },
        { 
          cell: 'B135', 
          label: EXTENDED_LABELS.B135.label,
          description: EXTENDED_LABELS.B135.description,
          range: 'Sheet2!$E$118:$E$127', 
          type: 'compatibility-chart',
          compatibilityRange: "'String Builder'!B107:D119" 
        },
        { 
          cell: 'B139', 
          label: EXTENDED_LABELS.B139.label,
          description: EXTENDED_LABELS.B139.description,
          range: 'Sheet2!$E$129:$E$137', 
          type: 'compatibility-chart',
          compatibilityRange: "'String Builder'!B120:D134" 
        },
        { 
          cell: 'B142', 
          label: EXTENDED_LABELS.B142.label,
          description: EXTENDED_LABELS.B142.description,
          range: 'Sheet2!$B$129:$B$132', 
          type: 'dropdown' 
        },
        { 
          cell: 'B147', 
          label: EXTENDED_LABELS.B147.label,
          description: EXTENDED_LABELS.B147.description,
          range: 'Sheet2!$B$139:$B$140', 
          type: 'dropdown',
          tableRange: EXTENDED_LABELS.B147.tableRange
        },
        { 
          cell: 'B151', 
          label: EXTENDED_LABELS.B151.label,
          description: EXTENDED_LABELS.B151.description,
          range: 'Sheet2!$A$216:$A$220', 
          type: 'dropdown' 
        },
        { 
          cell: 'B154', 
          label: EXTENDED_LABELS.B154.label,
          description: EXTENDED_LABELS.B154.description,
          range: "'String Builder'!$A$155:$A$163", 
          type: 'dropdown',
          tableRange: EXTENDED_LABELS.B154.tableRange
        },
        { 
          cell: 'B164', 
          label: EXTENDED_LABELS.B164.label,
          description: EXTENDED_LABELS.B164.description,
          range: 'Sheet2!$D$139:$D$155', 
          type: 'dropdown' 
        },
        { 
          cell: 'B167', 
          label: EXTENDED_LABELS.B167.label,
          description: EXTENDED_LABELS.B167.description,
          range: 'Sheet2!$E$139:$E$145', 
          type: 'dropdown' 
        },
        { 
          cell: 'B172', 
          label: EXTENDED_LABELS.B172.label,
          description: EXTENDED_LABELS.B172.description,
          range: 'Sheet2!$A$161:$A$162', 
          type: 'dropdown' 
        },
        { 
          cell: 'B176', 
          label: EXTENDED_LABELS.B176.label,
          description: EXTENDED_LABELS.B176.description,
          range: 'Sheet2!$A$169:$A$191', 
          type: 'dropdown' 
        },
        { 
          cell: 'B180', 
          label: EXTENDED_LABELS.B180.label,
          description: EXTENDED_LABELS.B180.description,
          range: 'Sheet2!$E$161:$E$166', 
          type: 'dropdown' 
        },
        { 
          cell: 'B185', 
          label: EXTENDED_LABELS.B185.label,
          description: EXTENDED_LABELS.B185.description,
          range: 'Sheet2!$B$169:$B$171', 
          type: 'dropdown' 
        },
        { 
          cell: 'B188', 
          label: EXTENDED_LABELS.B188.label,
          description: EXTENDED_LABELS.B188.description,
          range: 'Sheet2!$C$169:$C$171', 
          type: 'dropdown' 
        },
        { 
          cell: 'B191', 
          label: EXTENDED_LABELS.B191.label,
          description: EXTENDED_LABELS.B191.description,
          range: 'Sheet2!$A$224:$A$226', 
          type: 'dropdown' 
        },
        { 
          cell: 'B194', 
          label: EXTENDED_LABELS.B194.label,
          description: EXTENDED_LABELS.B194.description,
          range: 'Sheet2!$B$224:$B$226', 
          type: 'dropdown' 
        }
      ];
      
      setExtendedQuestions(questions);
      
      // Update labels with extended question labels for traceability
      const extendedLabels: { [key: string]: string } = {};
      questions.forEach(q => {
        extendedLabels[q.cell] = q.label;
      });
      setLabels(prev => ({ 
        ...prev, 
        ...extendedLabels,
        'RESULT_SELECTION': 'Select Your Configuration Option'
      }));
      
      console.log(`🎯 DEBUG: Set extended labels:`, extendedLabels);
      
      setCurrentExtendedStep(0);
      setPhase('extended');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select result option');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateExtendedValue = async (cell: string, value: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔧 DEBUG: Updating extended question ${cell} with value: "${value}"`);
      await googleAppsScriptService.updateDropdownValue(cell, value);
      
      // CRITICAL: Store extended values in main values state for traceability
      setValues(prev => ({ ...prev, [cell]: value }));
      setExtendedValues(prev => ({ ...prev, [cell]: value }));
      
      console.log(`🔧 DEBUG: Extended question ${cell} stored in main values state`);
      console.log(`🔧 DEBUG: Updated values state after ${cell}:`, { ...values, [cell]: value });
      console.log(`🔧 DEBUG: Updated extendedValues state after ${cell}:`, { ...extendedValues, [cell]: value });
      
      // Move to next step
      if (currentExtendedStep < extendedQuestions.length - 1) {
        setCurrentExtendedStep(currentExtendedStep + 1);
      } else {
        // All extended questions completed, fetch final solution options
        const solutionOptions = await googleAppsScriptService.getFinalSolutionOptions();
        setFinalSolutionOptions(solutionOptions);
        setPhase('final-solution');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update extended value');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousExtendedStep = () => {
    if (currentExtendedStep > 0) {
      setCurrentExtendedStep(currentExtendedStep - 1);
    }
  };

  const selectFinalSolution = async (selectedIndex: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🎯 Selecting final solution at index ${selectedIndex}`);
      
      // Store the selected final solution text
      if (finalSolutionOptions[selectedIndex]) {
        setSelectedFinalSolutionText(finalSolutionOptions[selectedIndex].text);
        
        // Store the final solution selection for traceability
        setValues(prev => ({ 
          ...prev, 
          'FINAL_SOLUTION_SELECTION': finalSolutionOptions[selectedIndex].text 
        }));
        
        // Update labels for traceability
        setLabels(prev => ({ 
          ...prev, 
          'FINAL_SOLUTION_SELECTION': 'Choose Most Optimum Solenoid Solution'
        }));
      }
      
      // Select the solution and populate B210, clean up other cells
      await googleAppsScriptService.selectFinalSolution(selectedIndex);
      
      // Start additional questions flow
      setAdditionalQuestionStep(0);
      setAdditionalQuestionValues({});
      setPhase('additional-questions');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select final solution');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAdditionalQuestion = async (cell: string, value: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔧 Updating additional question ${cell} with value: "${value}"`);
      
      // CRITICAL FIX: Ensure we're updating the correct cell
      console.log(`🔧 DEBUG: Confirming cell parameter: "${cell}"`);
      console.log(`🔧 DEBUG: Confirming value parameter: "${value}"`);
      
      await googleAppsScriptService.updateAdditionalQuestion(cell, value);
      
      // CRITICAL: Store additional values in main values state for traceability
      console.log(`🔧 DEBUG: Before update - values[${cell}]: "${values[cell]}"`);
      setValues(prev => ({ ...prev, [cell]: value }));
      setAdditionalQuestionValues(prev => ({ ...prev, [cell]: value }));
      console.log(`🔧 DEBUG: After update - should be "${value}" for ${cell}`);
      
      console.log(`🔧 DEBUG: Updated values state after additional ${cell}:`, { ...values, [cell]: value });
      console.log(`🔧 DEBUG: Updated additionalQuestionValues state after ${cell}:`, { ...additionalQuestionValues, [cell]: value });
      
      // Update labels for additional questions for traceability
      const additionalLabels = {
        'B212': 'Do you need SS316/ SS316L solenoid enclosure ?',
        'B216': 'Insulation Class you need ?',
        'B220': 'Accessories for Solenoid valve'
      };
      if (additionalLabels[cell]) {
        setLabels(prev => ({ ...prev, [cell]: additionalLabels[cell] }));
      }
      
      // Move to next additional question or final product
      if (additionalQuestionStep < 2) { // 3 additional questions (B212, B216, B220)
        console.log(`🔧 Moving to next additional question step: ${additionalQuestionStep + 1}`);
        setAdditionalQuestionStep(additionalQuestionStep + 1);
      } else {
        // All additional questions completed, get final product string
        console.log('🔧 All additional questions completed, fetching final product string...');
        
        // Add a delay to ensure all calculations are complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const productResult = await googleAppsScriptService.getFinalProductString();
        console.log('🔧 Final product result:', productResult);
        
        if (productResult && productResult.productString) {
          console.log(`🔧 Setting final product string: "${productResult.productString}"`);
          setFinalProductString(productResult.productString);
          setPhase('final-product');
        } else {
          console.error('🔧 No product string received or empty product string');
          setError('Final product string is not available. Please check cell A234 in the spreadsheet.');
        }
      }
    } catch (err) {
      console.error('🔧 Error in updateAdditionalQuestion:', err);
      setError(err instanceof Error ? err.message : 'Failed to update additional question');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousAdditionalStep = () => {
    if (additionalQuestionStep > 0) {
      setAdditionalQuestionStep(additionalQuestionStep - 1);
    } else {
      // Go back to final solution selection
      setPhase('final-solution');
    }
  };

  const processResults = () => {
    console.log('🔍 DEBUG: processResults called with results:', results);
    console.log('🔍 DEBUG: Results type:', typeof results);
    console.log('🔍 DEBUG: Results is array:', Array.isArray(results));
    console.log('🔍 DEBUG: Results length:', results.length);
    
    // First refresh results to get the latest calculated data
    refreshResults().then((freshResults) => {
      console.log('🔍 DEBUG: Fresh results from refreshResults:', freshResults);
      console.log('🔍 DEBUG: Fresh results length:', freshResults.length);
      
      if (freshResults.length > 0) {
        setResultOptions(freshResults);
        setPhase('result-selection');
      } else {
        console.error('❌ No valid options found in CE76:CE95 after refresh');
        setError('No results available. The calculation may not be complete yet.');
      }
    }).catch(error => {
      console.error('❌ Error refreshing results:', error);
      setError('Failed to fetch results from Google Sheet');
    });
  };

  return {
    isConnected,
    isLoading,
    error,
    labels,
    values,
    results,
    dropdownOptions,
    applicationTypes,
    resultOptions,
    selectedResultIndex,
    extendedQuestions,
    currentExtendedStep,
    extendedValues,
    finalResults,
    phase,
    updateSingleValue,
    refreshResults,
    processResults,
    selectResultOption,
    updateExtendedValue,
    selectFinalSolution,
    updateAdditionalQuestion,
    goToPreviousExtendedStep,
    goToPreviousAdditionalStep,
    finalSolutionOptions,
    additionalQuestionStep,
    additionalQuestionValues,
    finalProductString,
    selectedResultText,
    selectedFinalSolutionText,
    reinitializeScript,
    clearAllValues,
    skipToResults
  };
};