import React, { lazy, Suspense } from 'react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useGoogleAppsScript } from './hooks/useGoogleAppsScript';
import { FileSpreadsheet } from 'lucide-react';

const StepWizard = lazy(() => import('./components/StepWizard').then(m => ({ default: m.StepWizard })));
const ResultSelectionStep = lazy(() => import('./components/ResultSelectionStep').then(m => ({ default: m.ResultSelectionStep })));
const ExtendedQuestionsWizard = lazy(() => import('./components/ExtendedQuestionsWizard').then(m => ({ default: m.ExtendedQuestionsWizard })));
const FinalSolutionSelectionStep = lazy(() => import('./components/FinalSolutionSelectionStep').then(m => ({ default: m.FinalSolutionSelectionStep })));
const AdditionalQuestionsWizard = lazy(() => import('./components/AdditionalQuestionsWizard').then(m => ({ default: m.AdditionalQuestionsWizard })));
const FinalProductDisplay = lazy(() => import('./components/FinalProductDisplay').then(m => ({ default: m.FinalProductDisplay })));

function App() {
  const {
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
    finalSolutionOptions,
    additionalQuestionStep,
    additionalQuestionValues,
    finalProductString,
    phase,
    skipToResults,
    updateSingleValue,
    refreshResults,
    processResults,
    selectResultOption,
    updateExtendedValue,
    selectFinalSolution,
    updateAdditionalQuestion,
    goToPreviousExtendedStep,
    goToPreviousAdditionalStep,
    clearAllValues,
    reinitializeScript
  } = useGoogleAppsScript();

  // Show error state if connection failed
  if (!isConnected && !isLoading && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="text-red-600 mb-4">
            <FileSpreadsheet className="h-16 w-16 mx-auto mb-4" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection Failed</h1>
          <p className="text-gray-600 mb-4">Unable to connect to Google Apps Script</p>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Show loading state during initial connection
  if (!isConnected && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connecting...</h1>
          <p className="text-gray-600">Connecting to Google Apps Script...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        }>
          {phase === 'initial' && (
            <StepWizard
              labels={labels}
              values={values}
              dropdownOptions={dropdownOptions}
              applicationTypes={applicationTypes}
              onUpdateValue={updateSingleValue}
              onComplete={processResults}
              isLoading={isLoading}
              isConnected={isConnected}
              onClearAllValues={clearAllValues}
              onSkipToResults={skipToResults}
            />
          )}

          {phase === 'result-selection' && (
            <ResultSelectionStep
              options={resultOptions}
              onSelect={selectResultOption}
              onBackToWizard={() => window.location.reload()}
              isLoading={isLoading}
            />
          )}

          {phase === 'extended' && (
            <ExtendedQuestionsWizard
              questions={extendedQuestions}
              currentStep={currentExtendedStep}
              values={extendedValues}
              onUpdateValue={updateExtendedValue}
              onComplete={() => {}}
              onPrevious={goToPreviousExtendedStep}
              isLoading={isLoading}
            />
          )}

          {phase === 'final-solution' && (
            <FinalSolutionSelectionStep
              options={finalSolutionOptions}
              onSelect={selectFinalSolution}
              onBack={() => window.location.reload()}
              isLoading={isLoading}
            />
          )}

          {phase === 'additional-questions' && (
            <AdditionalQuestionsWizard
              currentStep={additionalQuestionStep}
              values={additionalQuestionValues}
              onUpdateValue={updateAdditionalQuestion}
              onComplete={() => {}}
              onPrevious={goToPreviousAdditionalStep}
              isLoading={isLoading}
            />
          )}

          {phase === 'final-product' && (
            <FinalProductDisplay
              productString={finalProductString}
              onBack={() => window.location.reload()}
              isLoading={isLoading}
              allAnswers={{
                ...values,
                ...extendedValues,
                ...additionalQuestionValues,
                ...(selectedResultIndex !== null && resultOptions[selectedResultIndex] ? {
                  'SELECTED_RESULT': resultOptions[selectedResultIndex].text
                } : {})
              }}
              allLabels={{
                ...labels,
                'RESULT_SELECTION': 'Question 13: Select Your Configuration Option',
                'FINAL_SOLUTION_SELECTION': 'Question 30: Choose Most Optimum Solenoid Solution'
              }}
            />
          )}
        </Suspense>
      </main>

      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3 shadow-xl">
            <LoadingSpinner size="md" />
            <span className="text-gray-700 font-medium">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;