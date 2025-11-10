import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, RefreshCw, Target } from 'lucide-react';
import { ApplicationDescriptionStep } from './ApplicationDescriptionStep';
import { ApplicationType } from '../types';

interface StepWizardProps {
  labels: { [key: string]: string };
  values: { [key: string]: string };
  dropdownOptions: { [key: string]: string[] };
  applicationTypes: ApplicationType[];
  onUpdateValue: (cell: string, value: string) => Promise<void>;
  onComplete: () => void;
  isLoading?: boolean;
  onClearAllValues?: () => Promise<void>;
  onSkipToResults?: () => Promise<void>;
}

export const StepWizard: React.FC<StepWizardProps> = ({
  labels,
  values,
  dropdownOptions,
  applicationTypes,
  onUpdateValue,
  onComplete,
  isLoading,
  onClearAllValues,
  onSkipToResults,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDescriptionStep, setShowDescriptionStep] = useState(true);
  const [hasClearedAll, setHasClearedAll] = useState(false);
  const [isProcessingAutoSelection, setIsProcessingAutoSelection] = useState(false);

  // Define dropdown cells (excluding B1 which is handled in description step)
  const dropdownCells = ['B11', 'B16', 'B22', 'B25', 'B30', 'B33', 'B36', 'B42', 'B52', 'B56', 'B62', 'B68'];

  // Update answers when values change
  useEffect(() => {
    setAnswers(values);
  }, [values]);

  const handleDescriptionComplete = async (selectedApplication: string) => {
    setIsUpdating(true);
    try {
      // First, clear all values to start fresh
      if (onClearAllValues && !hasClearedAll) {
        console.log('🧹 Clearing all values before starting...');
        await onClearAllValues();
        setHasClearedAll(true);
        console.log('✅ All values cleared, starting fresh');
      }
      
      // Update B1 with the selected application
      await onUpdateValue('B1', selectedApplication);
      setAnswers(prev => ({ ...prev, 'B1': selectedApplication }));
      
      setShowDescriptionStep(false);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error updating application selection:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOptionSelect = async (option: string) => {
    const currentCell = dropdownCells[currentStep];
    setIsUpdating(true);
    setIsProcessingAutoSelection(false); // Stop any auto-selection processing
    
    try {
      await onUpdateValue(currentCell, option);
      setAnswers(prev => ({ ...prev, [currentCell]: option }));
      
      // Move to next step after successful update
      if (currentStep < dropdownCells.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // All questions answered, show results
        onComplete();
      }
    } catch (error) {
      console.error('Error updating value:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Simplified auto-selection logic
  useEffect(() => {
    if (showDescriptionStep || isUpdating || isLoading || !hasClearedAll || currentStep >= dropdownCells.length) {
      return;
    }

    const currentCell = dropdownCells[currentStep];
    const currentOptions = dropdownOptions[currentCell] || [];
    const currentAnswer = answers[currentCell];

    // Auto-select if single option and no current answer - with faster processing
    if (!currentAnswer && currentOptions.length === 1 && currentOptions[0] && currentOptions[0].trim() !== '') {
      console.log(`🚀 Auto-selecting ${currentCell}: "${currentOptions[0]}"`);
      setIsProcessingAutoSelection(true);
      
      const timer = setTimeout(async () => {
        try {
          setIsProcessingAutoSelection(false);
          await handleOptionSelect(currentOptions[0]);
        } catch (error) {
          console.error(`❌ Auto-selection failed for ${currentCell}:`, error);
          setIsProcessingAutoSelection(false);
        }
      }, 100); // Reduced from 500ms to 100ms for faster auto-selection

      return () => clearTimeout(timer);
    }
  }, [currentStep, dropdownOptions, answers, isUpdating, isLoading, showDescriptionStep, hasClearedAll]);

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentCell = dropdownCells[currentStep];
  const currentLabel = labels[currentCell] || `Question ${currentStep + 1}`;
  const currentOptions = dropdownOptions[currentCell] || [];
  const currentAnswer = answers[currentCell];

  // Calculate progress out of total 33 steps (1-13 are initial questions)
  const totalSteps = 35; // 1 description + 13 initial + 1 result + 16 extended + 1 final + 3 additional
  const currentStepNumber = currentStep + 2; // +2 because step 1 is description, steps 2-13 are dropdowns
  const progress = (currentStepNumber / totalSteps) * 100;

  // Show description step first
  if (showDescriptionStep) {
    return (
      <div>
        {/* Quick Actions Bar */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Quick Actions</span>
            </div>
            <button
              onClick={onSkipToResults}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Target className="h-4 w-4 mr-1" />
              Skip to Final Solutions (Q30)
            </button>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Skip directly to Question 30 (Final Solution Selection) for fast validation without clearing existing values
          </p>
        </div>

        <ApplicationDescriptionStep
          availableApplications={applicationTypes}
          onNext={handleDescriptionComplete}
          isLoading={isUpdating}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStepNumber} of 35
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentLabel}</h2>
        <p className="text-gray-600">
          {currentOptions.length === 1 && !currentAnswer ? (
            <span className="text-blue-600 font-medium flex items-center">
              <RefreshCw className={`h-4 w-4 mr-1 ${isProcessingAutoSelection ? 'animate-spin' : 'animate-pulse'}`} />
              Auto-selecting single option...
            </span>
          ) : (
            <>
              Select one of the options below to continue
              <span className="ml-2 text-xs text-gray-500">({currentCell})</span>
            </>
          )}
        </p>
      </div>

      {/* Options */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {currentOptions.length > 0 ? (
          currentOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(option)}
              disabled={isUpdating || isLoading}
              className={`w-full p-3 text-left border-2 rounded-lg transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[60px] ${
                answers[currentCell] === option
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : currentOptions.length === 1
                  ? 'border-blue-300 bg-blue-25 animate-pulse ring-2 ring-blue-200'
                  : 'border-gray-200 bg-white text-gray-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm break-words">{option}</span>
                {answers[currentCell] === option && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
                {(isUpdating || isProcessingAutoSelection) && (
                  <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                )}
                {currentOptions.length === 1 && !answers[currentCell] && (
                  <div className="flex items-center space-x-1">
                    <RefreshCw className={`h-4 w-4 text-blue-500 ${isProcessingAutoSelection ? 'animate-spin' : 'animate-pulse'}`} />
                    <span className="text-xs text-blue-600">Auto-selecting...</span>
                  </div>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full">
            <div className="text-center py-8 text-gray-500">
              <p>No options available for this question ({currentCell}).</p>
              <p className="text-sm mt-2">Please check the sheet configuration for range data.</p>
            </div>
          </div>
        )}
        </div>
      </div>

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

        <div className="text-sm text-gray-500">
          {answers[currentCell] ? (
            <span className="text-green-600 font-medium">✓ Answered</span>
          ) : currentOptions.length === 1 ? (
            <span className="text-blue-600 font-medium">
              {isProcessingAutoSelection ? '⚡ Processing...' : '⏳ Auto-selecting...'}
            </span>
          ) : (
            <span>Select an option to continue</span>
          )}
        </div>

        {currentStep === dropdownCells.length - 1 && answers[currentCell] ? (
          <button
            onClick={onComplete}
            disabled={isUpdating || isLoading}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Calculating...' : 'View Results'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        ) : (
          <div className="w-24"></div>
        )}
      </div>

    </div>
  );
};