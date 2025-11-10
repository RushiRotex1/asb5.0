import React, { useState } from 'react';
import { Table, RefreshCw, CheckCircle, Copy, Check, ArrowLeft, Sparkles } from 'lucide-react';
import { openAIService } from '../services/openai';

// Helper function to format text with line breaks and bold remarks
const formatTextWithLineBreaks = (text: string, enhancedText?: string) => {
  // Split by various line break patterns
  const lines = (enhancedText || text).split(/\r?\n|\r/);
  
  return lines.map((line, lineIndex) => (
    <div key={lineIndex} className="mb-1" dangerouslySetInnerHTML={{ 
      __html: line.trim() || '<br/>' 
    }}>
    </div>
  ));
};

// Helper function to make "Remark" lines bold
const makeBoldRemarks = (text: string): string => {
  return text.replace(/(.*Remark.*)/gi, '<strong>$1</strong>');
};

// Helper function to extract price information
const extractPriceInfo = (text: string) => {
  const priceRegex = /(\$[\d,]+\.?\d*|\d+[\.,]\d+\s*(?:USD|EUR|GBP|\$)|price[:\s]*[\$]?[\d,]+\.?\d*)/gi;
  const prices = text.match(priceRegex) || [];
  
  // Convert to numbers for comparison
  const numericPrices = prices.map(price => {
    const cleanPrice = price.replace(/[^\d.,]/g, '');
    return parseFloat(cleanPrice.replace(',', ''));
  }).filter(price => !isNaN(price));
  
  if (numericPrices.length === 0) return null;
  
  return {
    min: Math.min(...numericPrices),
    max: Math.max(...numericPrices),
    all: numericPrices
  };
};

interface SelectableResultsTableProps {
  data: string[][];
  isLoading?: boolean;
  onRefresh: () => void;
  onBackToWizard: () => void;
}

export const SelectableResultsTable: React.FC<SelectableResultsTableProps> = ({ 
  data, 
  isLoading, 
  onRefresh,
  onBackToWizard 
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [copiedOption, setCopiedOption] = useState<string>('');
  const [enhancedOptions, setEnhancedOptions] = useState<{ [key: string]: string }>({});
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Extract non-empty values from the single column data
  const extractOptions = (data: string[][]): string[] => {
    const options: string[] = [];
    
    if (!data || data.length === 0) return options;
    
    // Since it's a single column (CE76:CE95), we iterate through all rows
    data.forEach(row => {
      if (row && row[0] && row[0].toString().trim() !== '') {
        const value = row[0].toString().trim();
        // Filter out common error values
        if (!value.includes('#N/A') && !value.includes('#NA') && !value.includes('N/A')) {
          options.push(value);
        }
      }
    });
    
    return options;
  };

  const options = extractOptions(data);

  // Enhanced formatting with LLM analysis
  const enhanceOptionsWithLLM = async () => {
    if (options.length < 2 || isEnhancing) return;
    
    setIsEnhancing(true);
    
    try {
      console.log('🤖 Analyzing options for feature comparison...');
      
      // First, apply basic bold formatting for remarks
      const basicEnhanced: { [key: string]: string } = {};
      options.forEach((option, index) => {
        basicEnhanced[`option-${index}`] = makeBoldRemarks(option);
      });
      
      // Try to identify price ranges and use LLM for feature comparison
      const priceAnalysis = options.map((option, index) => ({
        index,
        option,
        priceInfo: extractPriceInfo(option)
      }));
      
      // Find cheapest and most expensive options
      const optionsWithPrices = priceAnalysis.filter(item => item.priceInfo);
      
      if (optionsWithPrices.length >= 2) {
        const cheapest = optionsWithPrices.reduce((prev, current) => 
          (prev.priceInfo!.min < current.priceInfo!.min) ? prev : current
        );
        
        const mostExpensive = optionsWithPrices.reduce((prev, current) => 
          (prev.priceInfo!.max > current.priceInfo!.max) ? prev : current
        );
        
        console.log(`💰 Found price range: Cheapest at index ${cheapest.index}, Most expensive at index ${mostExpensive.index}`);
        
        // Use LLM to identify and highlight differences
        const prompt = `Compare these two product options and identify the key features that make the expensive version different from the cheap version. Return the expensive version text with the differentiating features wrapped in <strong> tags.

CHEAP VERSION:
${cheapest.option}

EXPENSIVE VERSION:
${mostExpensive.option}

Instructions:
1. Keep all the original text of the expensive version
2. Wrap ONLY the features/specifications that are better/different from the cheap version in <strong> tags
3. Don't bold basic information like model names or prices
4. Focus on technical specifications, features, or capabilities that justify the higher price
5. Also make any lines containing "Remark" bold
6. Return only the enhanced expensive version text, maintaining all original formatting and line breaks`;

        try {
          const enhancedExpensive = await openAIService.enhanceProductComparison(prompt);
          
          if (enhancedExpensive && enhancedExpensive.trim()) {
            basicEnhanced[`option-${mostExpensive.index}`] = enhancedExpensive;
            console.log('✅ LLM enhancement successful for expensive option');
          }
        } catch (llmError) {
          console.warn('LLM enhancement failed, using basic formatting:', llmError);
        }
      } else {
        console.log('📊 No clear price differentiation found, using basic remark formatting only');
      }
      
      setEnhancedOptions(basicEnhanced);
      
    } catch (error) {
      console.error('Error enhancing options:', error);
      // Fallback to basic remark formatting
      const basicEnhanced: { [key: string]: string } = {};
      options.forEach((option, index) => {
        basicEnhanced[`option-${index}`] = makeBoldRemarks(option);
      });
      setEnhancedOptions(basicEnhanced);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Auto-enhance options when they load
  React.useEffect(() => {
    if (options.length > 0 && Object.keys(enhancedOptions).length === 0) {
      enhanceOptionsWithLLM();
    }
  }, [options.length]);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleCopyOption = async (option: string) => {
    try {
      await navigator.clipboard.writeText(option);
      setCopiedOption(option);
      setTimeout(() => setCopiedOption(''), 2000); // Clear after 2 seconds
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (options.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Table className="h-5 w-5 mr-2" />
            Results
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={onBackToWizard}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Questions
            </button>
            <button
              onClick={enhanceOptionsWithLLM}
              disabled={isLoading || isEnhancing}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              <Sparkles className={`h-4 w-4 mr-1 ${isEnhancing ? 'animate-spin' : ''}`} />
              {isEnhancing ? 'Analyzing...' : 'Enhance Comparison'}
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        <div className="text-center py-12 text-gray-500">
          <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No results available. Please refresh to see options.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Table className="h-5 w-5 mr-2" />
          Select Your Option
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={onBackToWizard}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Questions
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Based on your selections, here are the available options. Select one to proceed:
        </p>
        
        <div className="grid grid-cols-1 gap-3">
          {options.map((option, index) => (
            <div
              key={index}
              className={`relative p-4 border-2 rounded-lg transition-all duration-200 cursor-pointer hover:border-blue-500 hover:bg-blue-50 ${
                selectedOption === option
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-900'
              }`}
              onClick={() => handleOptionSelect(option)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === option
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedOption === option && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-sm">Option {index + 1}</span>
                    <div className="text-sm text-gray-600 mt-1">
                      {formatTextWithLineBreaks(
                        option, 
                        enhancedOptions[`option-${index}`]
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {selectedOption === option && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyOption(option);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedOption === option ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedOption && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Selected Option</h3>
              <p className="text-sm text-green-700 mt-1">{selectedOption}</p>
            </div>
          </div>
        </div>
      )}

      {isEnhancing && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Sparkles className="h-4 w-4 mr-2 animate-spin" />
            🤖 AI is analyzing options to highlight key differences...
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        Found {options.length} option{options.length !== 1 ? 's' : ''} from your configuration
      </div>
    </div>
  );
};