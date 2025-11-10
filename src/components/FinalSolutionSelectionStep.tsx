import React, { useState } from 'react';
import { ChevronRight, CheckCircle, Copy, Check, ArrowLeft, Target } from 'lucide-react';

interface FinalSolutionOption {
  text: string;
  rowIndex: number;
  arrayIndex: number;
}

interface FinalSolutionSelectionStepProps {
  options: FinalSolutionOption[];
  onSelect: (optionIndex: number) => void;
  onBackToWizard: () => void;
  isLoading?: boolean;
}

export const FinalSolutionSelectionStep: React.FC<FinalSolutionSelectionStepProps> = ({
  options,
  onSelect,
  onBackToWizard,
  isLoading
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [copiedOption, setCopiedOption] = useState<string>('');

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleCopyOption = async (optionText: string) => {
    try {
      await navigator.clipboard.writeText(optionText);
      setCopiedOption(optionText);
      setTimeout(() => setCopiedOption(''), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleNext = () => {
    if (selectedOption !== null) {
      onSelect(selectedOption);
    }
  };

  if (options.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Choose Most Optimum Solenoid Solution
          </h2>
          <button
            onClick={onBackToWizard}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
        </div>
        <div className="text-center py-12 text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No solutions available</p>
          <p className="text-sm">Please check if the results range (AF199:AF209) has data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Step 32 of 35</span>
            <span className="text-sm text-gray-500">91% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" style={{ width: '91%' }}></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Question 32: Choose Most Optimum Solenoid Solution
        </h2>
        <h3 className="text-lg text-gray-700 mb-4 flex items-center">
          <Target className="h-6 w-6 mr-2 text-blue-600" />
        </h3>
        <p className="text-gray-600">
          Based on your complete configuration, here are the final solenoid solutions. Choose the most optimum one:
        </p>
      </div>

      {/* Options */}
      <div className="mb-8">
        <div className="grid grid-cols-1 gap-3">
          {options.map((option, index) => (
            <div
              key={index}
              className={`relative p-4 border-2 rounded-lg transition-all duration-200 cursor-pointer hover:border-blue-500 hover:bg-blue-50 ${
                selectedOption === index
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-900'
              }`}
              onClick={() => handleOptionSelect(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === index
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedOption === index && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-sm">Solution {index + 1}</span>
                    <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                      {option.text}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Row AF{option.rowIndex}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {selectedOption === index && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyOption(option.text);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedOption === option.text ? (
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

      {/* Selected Option Confirmation */}
      {selectedOption !== null && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Selected Solution</h3>
              <p className="text-sm text-green-700 mt-1">Solution {selectedOption + 1}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBackToWizard}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </button>

        <div className="text-sm text-center">
          {selectedOption !== null ? (
            <span className="text-green-600 font-medium">✓ Solution Selected</span>
          ) : (
            <span className="text-gray-500">Select a solution to continue</span>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={selectedOption === null || isLoading}
          className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Continue'}
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        Found {options.length} final solution{options.length !== 1 ? 's' : ''} for your configuration
      </div>
    </div>
  );
};