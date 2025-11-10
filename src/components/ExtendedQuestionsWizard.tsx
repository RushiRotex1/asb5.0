import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, RefreshCw, Search } from 'lucide-react';
import { ExtendedQuestion, MediaCompatibilityRow } from '../types';
import { googleAppsScriptService } from '../services/googleAppsScript';

interface AdditionalTableRow {
  col1: string;
  col2: string;
}

interface ExtendedQuestionsWizardProps {
  questions: ExtendedQuestion[];
  currentStep: number;
  values: { [key: string]: string };
  onUpdateValue: (cell: string, value: string) => Promise<void>;
  onComplete: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
}

export const ExtendedQuestionsWizard: React.FC<ExtendedQuestionsWizardProps> = ({
  questions,
  currentStep,
  values,
  onUpdateValue,
  onComplete,
  onPrevious,
  isLoading
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [compatibilityChart, setCompatibilityChart] = useState<MediaCompatibilityRow[]>([]);
  const [additionalTable, setAdditionalTable] = useState<AdditionalTableRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 16) / 35) * 100;

  // Load options when step changes
  useEffect(() => {
    if (currentQuestion) {
      loadOptions();
      // Clear search term when moving to a new question
      setSearchTerm('');
    }
  }, [currentStep, currentQuestion]);

  const loadOptions = async () => {
    if (!currentQuestion) return;
    
    setIsLoadingOptions(true);
    try {
      if (currentQuestion.type === 'searchable') {
        const searchableOptions = await googleAppsScriptService.getSearchableOptions(currentQuestion.range);
        setOptions(searchableOptions);
      } else if (currentQuestion.type === 'compatibility-chart') {
        // For compatibility-chart, get options from the specific range
        const searchableOptions = await googleAppsScriptService.getSearchableOptions(currentQuestion.range);
        setOptions(searchableOptions);
        
        if (currentQuestion.compatibilityRange) {
          const chart = await googleAppsScriptService.getMediaCompatibilityChart(currentQuestion.compatibilityRange);
          setCompatibilityChart(chart);
        }
      } else {
        // For regular dropdown, get options from the specific range
        const searchableOptions = await googleAppsScriptService.getSearchableOptions(currentQuestion.range);
        setOptions(searchableOptions);
      }
      
      // Load additional table if specified
      if (currentQuestion.tableRange) {
        try {
          const tableData = await googleAppsScriptService.getAdditionalTable(currentQuestion.tableRange);
          setAdditionalTable(tableData);
          console.log(`📋 Loaded additional table for ${currentQuestion.cell}:`, tableData);
        } catch (tableError) {
          console.error(`Failed to load additional table for ${currentQuestion.cell}:`, tableError);
          setAdditionalTable([]);
        }
      } else {
        setAdditionalTable([]);
      }
      
      console.log(`🔍 Loaded ${options.length} options for ${currentQuestion.cell} from ${currentQuestion.range}`);
    } catch (error) {
      console.error('Failed to load options:', error);
      setOptions([]);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleOptionSelect = async (option: string) => {
    setIsUpdating(true);
    try {
      await onUpdateValue(currentQuestion.cell, option);
    } catch (error) {
      console.error('Error updating value:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      // Move to previous extended question step
      const newStep = currentStep - 1;
      console.log(`Moving to previous extended step: ${newStep}`);
      // This should be handled by parent component
      if (onPrevious) {
        onPrevious();
      }
    }
  };

  // Filter options for searchable dropdown - NO LIMIT for B106
  const filteredOptions = (currentQuestion?.type === 'searchable' || (currentQuestion?.type === 'dropdown' && options.length > 4))
    ? options.filter(option => 
        option.toLowerCase().includes(searchTerm.toLowerCase())
      ) // No limit - show ALL filtered results
    : options;

  const currentAnswer = values[currentQuestion?.cell];

  // Auto-select if only one option
  useEffect(() => {
    if (filteredOptions.length === 1 && !currentAnswer && !isUpdating && !isLoadingOptions) {
      const timer = setTimeout(() => {
        handleOptionSelect(filteredOptions[0]);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [filteredOptions.length, currentAnswer, isUpdating, isLoadingOptions]);

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 16} of 35
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentQuestion.label}</h2>
        <div className="text-gray-600 mb-4">
          <p className="mb-2">
            {currentQuestion.description}
          </p>
        </div>
        
        {/* Additional Table Display */}
        {additionalTable.length > 0 && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Reference Information:</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <tbody>
                    {additionalTable.map((row, index) => (
                      <tr key={index} className="border-b border-blue-200 last:border-b-0">
                        <td className="py-2 px-3 font-medium text-blue-800 w-1/3">{row.col1}</td>
                        <td className="py-2 px-3 text-blue-700">{row.col2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        <p className="text-gray-600 text-sm">
          {currentQuestion.cell} ({currentQuestion.type})
        </p>
      </div>

      {/* Search Input for Searchable Type */}
      {(currentQuestion.type === 'searchable' || (currentQuestion.type === 'dropdown' && options.length > 4)) && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search from ${options.length} media options...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={isLoadingOptions}
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-500 mt-2">
              Found {filteredOptions.length} of {options.length} media options for "{searchTerm}"
            </p>
          )}
          {!searchTerm && options.length > 50 && (
            <p className="text-sm text-gray-500 mt-2">
              {options.length} media options loaded. Use search to filter or scroll through all options.
            </p>
          )}
        </div>
      )}

      {/* Compatibility Chart */}
      {currentQuestion.type === 'compatibility-chart' && compatibilityChart.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Body Material Compatibility Reference</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-3">
              <strong>Reference Table:</strong> Use this table for compatibility information. Material selection buttons below are based on the defined range.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Body Material</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Media Compatibility</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Cost Comparison</th>
                  </tr>
                </thead>
                <tbody>
                  {compatibilityChart.map((row, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-2 px-3 font-medium">{row.bodyMaterial}</td>
                      <td className="py-2 px-3">{row.mediaCompatibility}</td>
                      <td className="py-2 px-3">{row.costComparison}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Regular Options (for non-compatibility-chart questions) */}
      <div className="mb-8">
        {currentQuestion.type === 'compatibility-chart' && (
          <h4 className="text-md font-medium text-gray-900 mb-3">Select Material:</h4>
        )}
        {currentQuestion.type === 'searchable' && (
          <h4 className="text-md font-medium text-gray-900 mb-3">
            {searchTerm ? `Found ${filteredOptions.length} of ${options.length}` : `All ${options.length} Media Options`}:
          </h4>
        )}
        {isLoadingOptions ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-500">Loading options...</p>
          </div>
        ) : filteredOptions.length > 0 ? (
          <div className={`grid gap-2 ${
            currentQuestion.type === 'searchable' && currentQuestion.cell === 'B106'
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6' // Multi-column grid for B106 media
              : currentQuestion.type === 'searchable' || filteredOptions.length > 4
              ? 'grid-cols-1' // Single column for other searchable options
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' // Multi-column for few options
          }`}>
            {filteredOptions.map((option, index) => {
              // For compatibility-chart type, check if this option has chart data
              const hasChartData = currentQuestion.type === 'compatibility-chart' && 
                compatibilityChart.some(row => row.bodyMaterial.toLowerCase().trim() === option.toLowerCase().trim());
              
              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isUpdating || isLoading}
                  className={`w-full text-left border-2 rounded-lg transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    currentQuestion.type === 'searchable' && currentQuestion.cell === 'B106'
                      ? 'p-2 text-xs min-h-[40px]' // Compact for B106 media
                      : 'p-3 text-sm min-h-[60px]' // Regular size for others
                  } ${
                    currentAnswer === option
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : filteredOptions.length === 1
                      ? 'border-blue-300 bg-blue-25 animate-pulse'
                      : 'border-gray-200 bg-white text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className={`font-medium break-words pr-1 ${
                        currentQuestion.type === 'searchable' && currentQuestion.cell === 'B106'
                          ? 'text-xs leading-tight' // Smaller text for B106
                          : 'text-sm' // Regular text for others
                      }`}>{option}</span>
                      {currentQuestion.type === 'searchable' && currentQuestion.cell !== 'B106' && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Media #{options.indexOf(option) + 1}
                          </span>
                        </div>
                      )}
                      {currentQuestion.type === 'compatibility-chart' && (
                        <div className="mt-1">
                          {hasChartData ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Chart data available
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Range option
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center ${
                      currentQuestion.type === 'searchable' && currentQuestion.cell === 'B106'
                        ? 'space-x-0.5' // Tighter spacing for B106
                        : 'space-x-1' // Regular spacing for others
                    }`}>
                      {currentAnswer === option && (
                        <Check className={`text-blue-600 flex-shrink-0 ${
                          currentQuestion.type === 'searchable' && currentQuestion.cell === 'B106'
                            ? 'h-4 w-4' // Smaller check for B106
                            : 'h-5 w-5' // Regular check for others
                        }`} />
                      )}
                      {(isUpdating) && (
                        <RefreshCw className={`text-blue-600 animate-spin flex-shrink-0 ${
                          currentQuestion.type === 'searchable' && currentQuestion.cell === 'B106'
                            ? 'h-4 w-4' // Smaller spinner for B106
                            : 'h-5 w-5' // Regular spinner for others
                        }`} />
                      )}
                      {filteredOptions.length === 1 && !currentAnswer && (
                        <div className="flex items-center space-x-1">
                          <RefreshCw className="h-4 w-4 text-blue-500 animate-pulse" />
                          {currentQuestion.cell !== 'B106' && (
                            <span className="text-xs text-blue-600">Auto-selecting...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No options available for this question.</p>
            {currentQuestion.type === 'searchable' && searchTerm && (
              <p className="text-sm mt-2">Try a different search term.</p>
            )}
          </div>
        )}
      </div>

      {/* Compatibility Chart Options (for compatibility-chart questions that also have dropdown options) - REMOVED */}
      {/* This section is no longer needed as we handle everything in the regular options section above */}
      {false && currentQuestion.type === 'compatibility-chart' && compatibilityChart.length === 0 && (
        <div className="mb-8">
          {/* This section is now handled above */}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0 || isUpdating || isLoading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </button>

        <div className="text-sm text-center">
          {currentAnswer ? (
            <span className="text-green-600 font-medium flex items-center">
              <Check className="h-4 w-4 mr-1" />
              Answered
            </span>
          ) : filteredOptions.length === 1 ? (
            <span className="text-blue-600 font-medium">
              Auto-selecting...
            </span>
          ) : (
            <span className="text-gray-500">Select an option to continue</span>
          )}
        </div>

        {currentStep === questions.length - 1 ? (
          <button
            onClick={onComplete}
            disabled={!currentAnswer || isUpdating || isLoading}
            className="inline-flex items-center px-6 py-2 bg-green-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete
            <Check className="h-4 w-4 ml-1" />
          </button>
        ) : (
          <button
            disabled={!currentAnswer || isUpdating || isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
};