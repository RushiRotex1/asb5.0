import React, { useState, useEffect } from 'react';
import { ChevronRight, Loader2, Sparkles, CheckCircle, Search } from 'lucide-react';
import { openAIService } from '../services/openai';
import { ApplicationType } from '../types';

interface ApplicationMatch {
  name: string;
  similarity: number;
  description: string;
  columnC: string;
  columnD: string;
}

interface ApplicationDescriptionStepProps {
  availableApplications: ApplicationType[];
  onNext: (selectedApplication: string) => void;
  isLoading?: boolean;
}

export const ApplicationDescriptionStep: React.FC<ApplicationDescriptionStepProps> = ({
  availableApplications,
  onNext,
  isLoading
}) => {
  const [description, setDescription] = useState('');
  const [selectedApplication, setSelectedApplication] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [similarApplications, setSimilarApplications] = useState<ApplicationMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const isDescriptionValid = description.trim().length >= 20;

  // Debug: Log available applications
  useEffect(() => {
    console.log('Available applications received:', availableApplications);
    console.log('Number of applications:', availableApplications.length);
    availableApplications.forEach((app, index) => {
      console.log(`App ${index}:`, app);
    });
  }, [availableApplications]);

  const analyzeSimilarApplications = async () => {
    if (!isDescriptionValid) return;

    setIsAnalyzing(true);
    setError(null);
    setHasSearched(true);
    
    try {
      console.log('Analyzing description:', description);
      console.log('Available applications:', availableApplications);
      
      const applications = await openAIService.findSimilarApplications(description, availableApplications);
      console.log('OpenAI returned applications:', applications);
      
      const filteredApplications = applications.filter(app => app.similarity > 50);
      console.log('Filtered applications (>50% similarity):', filteredApplications);
      
      setSimilarApplications(filteredApplications);
      
      // Auto-select the highest similarity match if available
      if (filteredApplications.length > 0) {
        const bestMatch = filteredApplications.reduce((prev, current) => 
          (prev.similarity > current.similarity) ? prev : current
        );
        console.log('Auto-selecting best match:', bestMatch);
        setSelectedApplication(bestMatch.name);
      } else {
        // If no good matches found, auto-select Standard
        setSelectedApplication('Standard');
      }
    } catch (err) {
      console.error('Error analyzing applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze applications');
      setSimilarApplications([]);
      setSelectedApplication('Standard'); // Fallback to Standard on error
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (isDescriptionValid && selectedApplication) {
      console.log('Proceeding with selected application:', selectedApplication);
      onNext(selectedApplication);
    }
  };

  // Only show options after search has been performed
  const sortedOptions = hasSearched ? [
    { 
      name: 'Standard', 
      similarity: 100, 
      description: 'Default standard application configuration',
      columnC: 'Standard',
      columnD: 'Default standard application configuration'
    },
    ...similarApplications.filter(app => app.name !== 'Standard').sort((a, b) => b.similarity - a.similarity)
  ] : [];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Step 1 of 35</span>
          <span className="text-sm text-gray-500">3% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" style={{ width: '3%' }}></div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Question 1: Describe your application</h2>
        <p className="text-gray-600 mb-4">
          Tell us about your application to help us find the best configuration options for you.
        </p>
        
        <div className="space-y-4">
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your application, its purpose, features, and target users... (minimum 20 characters)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              rows={4}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-sm ${description.length >= 20 ? 'text-green-600' : 'text-gray-500'}`}>
                {description.length}/20 characters minimum
              </span>
              {isDescriptionValid && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>

          {isDescriptionValid && (
            <div className="flex justify-center">
              <button
                onClick={analyzeSimilarApplications}
                disabled={isLoading || isAnalyzing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Find Similar Applications
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Application Selection */}
      {hasSearched && sortedOptions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Sparkles className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Select Application Type</h3>
            {isAnalyzing && (
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin ml-2" />
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {sortedOptions.map((app, index) => (
              <button
                key={index}
                onClick={() => setSelectedApplication(app.name)}
                disabled={isLoading || isAnalyzing}
                className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedApplication === app.name
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{app.columnC || app.name}</span>
                      {app.name === 'Standard' && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          Default
                        </span>
                      )}
                      {app.similarity < 100 && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          {app.similarity}% match
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{app.columnD || app.description}</p>
                  </div>
                  {selectedApplication === app.name && (
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {isAnalyzing && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ⚡ Processing {availableApplications.length} applications in parallel...
              </div>
            </div>
          )}

          {!isAnalyzing && hasSearched && similarApplications.length === 0 && availableApplications.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm font-medium">No similar applications found with &gt;65% match.</p>
              <p className="text-yellow-700 text-sm mt-1">Using Standard configuration. You can still proceed or try a different description.</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div></div> {/* Empty div for spacing */}
        
        <div className="text-sm text-center">
          {!isDescriptionValid ? (
            <span className="text-gray-500">Enter at least 20 characters to continue</span>
          ) : !hasSearched ? (
            <span className="text-blue-600">Click "Find Similar Applications" to see options</span>
          ) : isAnalyzing ? (
            <span className="text-blue-600">Analyzing description...</span>
          ) : !selectedApplication ? (
            <span className="text-orange-600">Please select an application type</span>
          ) : (
            <span className="text-green-600 font-medium">✓ Ready to continue</span>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={!isDescriptionValid || !selectedApplication || isLoading || isAnalyzing}
          className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
};