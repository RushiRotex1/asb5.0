import { useState, useEffect } from 'react';
import { googleSheetsService } from '../services/googleSheets';

const API_KEY = 'AIzaSyDE7hkprUIn9Kb5qDRJDwfllyE7GkrGff4';
export const useGoogleSheets = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState<{ [key: string]: string }>({});
  const [values, setValues] = useState<{ [key: string]: string }>({});
  const [results, setResults] = useState<string[][]>([]);
  const [dropdownOptions, setDropdownOptions] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    const initializeApi = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        googleSheetsService.initialize(API_KEY);
        await loadInitialData();
        setIsConnected(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to Google Sheets');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApi();
  }, []);

  const reinitializeApi = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      googleSheetsService.initialize(API_KEY);
      await loadInitialData();
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Google Sheets');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const [labelsData, valuesData, resultsData, optionsData] = await Promise.all([
        googleSheetsService.getDropdownLabels(),
        googleSheetsService.getDropdownValues(),
        googleSheetsService.getResults(),
        googleSheetsService.getDropdownOptions()
      ]);
      
      setLabels(labelsData);
      setValues(valuesData);
      setResults(resultsData);
      setDropdownOptions(optionsData);
    } catch (err) {
      throw new Error('Failed to load initial data from Google Sheets');
    }
  };

  const updateValues = async (newValues: { [key: string]: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await googleSheetsService.updateDropdownValues(newValues);
      setValues(newValues);
      
      // Refresh results after update
      const updatedResults = await googleSheetsService.getResults();
      setResults(updatedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update values');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSingleValue = async (cell: string, value: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await googleSheetsService.updateDropdownValues({ [cell]: value });
      setValues(prev => ({ ...prev, [cell]: value }));
      
      // Refresh dropdown options to get updated options for next questions
      const updatedOptions = await googleSheetsService.getDropdownOptions();
      setDropdownOptions(updatedOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update value');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshResults = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedResults = await googleSheetsService.getResults();
      setResults(updatedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh results');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    isLoading,
    error,
    labels,
    values,
    results,
    dropdownOptions,
    reinitializeApi,
    updateValues,
    updateSingleValue,
    refreshResults
  };
};