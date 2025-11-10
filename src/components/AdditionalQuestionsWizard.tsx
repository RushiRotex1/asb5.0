import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, RefreshCw } from 'lucide-react';
import { googleAppsScriptService } from '../services/googleAppsScript';

interface AdditionalQuestion {
  cell: string;
  label: string;
  description: string;
  range: string;
  image?: string;
}

interface AdditionalQuestionsWizardProps {
  currentStep: number;
  values: { [key: string]: string };
  onUpdateValue: (cell: string, value: string) => Promise<void>;
  onComplete: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
}

export const AdditionalQuestionsWizard: React.FC<AdditionalQuestionsWizardProps> = ({
  currentStep,
  values,
  onUpdateValue,
  onComplete,
  onPrevious,
  isLoading
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Define the 3 additional questions
  const questions: AdditionalQuestion[] = [
    {
      cell: 'B212',
      label: 'Do you need SS316/ SS316L solenoid enclosure ?',
      description: 'Standard enclosure of AL for terminal box and PA 66 for 22 plug in while Chrome plated CRCA for flying lead & 25 plug-in. Application which are near to sea area are recommended to use SS316 enclosure instead of AL, in case of extremely corrosive environment SS316L recommended',
      range: 'Sheet2!E169:E171'
    },
    {
      cell: 'B216',
      label: 'Insulation Class you need ?',
      description: 'F Class - for continuous operation with 8W power of size 1 and 13W of size 2 at ambient temperature of 55C provides 18 yrs of life, theoretically.\nH Class - incase ambient or media temperature is higher or power rating of the coil is higher or Exd applications then H Class insulation is must',
      range: 'Sheet2!B173:B174'
    },
    {
      cell: 'B220',
      label: 'Accessories for Solenoid valve',
      description: 'Select the accessories you need for your solenoid valve configuration',
      range: 'String Builder!A221:A228',
      image: '/api/placeholder/400/300' // Placeholder for the accessories image
    }
  ];

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 33) / 35) * 100;

  // Load options when step changes
  useEffect(() => {
    loadOptions();
  }, [currentStep]); // Only depend on currentStep, not currentQuestion object

  const loadOptions = async () => {
    if (!currentQuestion) return;
    
    setIsLoadingOptions(true);
    try {
      console.log(`🔍 Loading options for ${currentQuestion.cell} from range: ${currentQuestion.range}`);
      const questionOptions = await googleAppsScriptService.getAdditionalQuestionOptions(currentQuestion.range);
      console.log(`🔍 Received options for ${currentQuestion.cell}:`, questionOptions);
      setOptions(questionOptions);
      console.log(`🔍 Loaded ${questionOptions.length} options for ${currentQuestion.cell} from ${currentQuestion.range}`);
    } catch (error) {
      console.error(`Failed to load options for ${currentQuestion.cell}:`, error);
      setOptions([]);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleOptionSelect = async (option: string) => {
    setIsUpdating(true);
    try {
      console.log(`🔧 DEBUG AdditionalQuestionsWizard: Selecting option "${option}" for cell "${currentQuestion.cell}"`);
      console.log(`🔧 DEBUG AdditionalQuestionsWizard: Current step: ${currentStep}`);
      console.log(`🔧 DEBUG AdditionalQuestionsWizard: Question details:`, currentQuestion);
      
      await onUpdateValue(currentQuestion.cell, option);
    } catch (error) {
      console.error('Error updating value:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      if (onPrevious) {
        onPrevious();
      }
    }
  };

  const currentAnswer = values[currentQuestion?.cell];

  // Auto-select if only one option
  useEffect(() => {
    if (options.length === 1 && !currentAnswer && !isUpdating && !isLoadingOptions && options[0]) {
      const timer = setTimeout(() => {
        handleOptionSelect(options[0]);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [options, currentAnswer, isUpdating, isLoadingOptions]); // Use options array instead of just length

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 33} of 35
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Question {currentStep + 33}: {currentQuestion.label}
        </h2>
        <div className="text-gray-600 mb-4">
          <p className="mb-2 whitespace-pre-line">
            {currentQuestion.description}
          </p>
        </div>
        
        {/* Image for B220 (Accessories) */}
        {currentQuestion.cell === 'B220' && currentQuestion.image && (
          <div className="mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Solenoid Valve Accessories:</h4>
              <div className="flex justify-center">
                <img 
                  src="/image.png"
                  alt="Solenoid Valve Accessories"
                  className="max-w-full h-auto rounded-lg shadow-sm"
                  style={{ maxHeight: '300px' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Cable glands and accessories for solenoid valve configurations
              </p>
            </div>
          </div>
        )}
        
        <p className="text-gray-600 text-sm">
          {currentQuestion.cell}
        </p>
      </div>

      {/* Options */}
      <div className="mb-8">
        {isLoadingOptions ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-500">Loading options...</p>
          </div>
        ) : options.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(option)}
                disabled={isUpdating || isLoading}
                className={`w-full p-3 text-left border-2 rounded-lg transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[60px] ${
                  currentAnswer === option
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : options.length === 1
                    ? 'border-blue-300 bg-blue-25 animate-pulse'
                    : 'border-gray-200 bg-white text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="font-medium text-sm break-words pr-1">{option}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {currentAnswer === option && (
                      <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    )}
                    {isUpdating && (
                      <RefreshCw className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                    )}
                    {options.length === 1 && !currentAnswer && (
                      <div className="flex items-center space-x-1">
                        <RefreshCw className="h-4 w-4 text-blue-500 animate-pulse" />
                        <span className="text-xs text-blue-600">Auto-selecting...</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No options available for this question.</p>
          </div>
        )}
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

        <div className="text-sm text-center">
          {currentAnswer ? (
            <span className="text-green-600 font-medium flex items-center">
              <Check className="h-4 w-4 mr-1" />
              Answered
            </span>
          ) : options.length === 1 ? (
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
            Complete Configuration
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