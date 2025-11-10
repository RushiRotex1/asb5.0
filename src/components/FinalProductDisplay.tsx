import React, { useState } from 'react';
import { Award, Copy, Check, ArrowLeft, Download, Share2, FileText, ChevronDown, ChevronUp } from 'lucide-react';

// Minimal, safe print styles - embedded in component
const printStyles = `
  @media print {
    .no-print { display: none !important; }
    .print-header { display: block !important; text-align: center; margin-bottom: 20px; }
    body { font-size: 12px; }
  }
`;

interface FinalProductDisplayProps {
  productString: string;
  onBack: () => void;
  isLoading?: boolean;
  allAnswers?: { [key: string]: string };
  allLabels?: { [key: string]: string };
}

export const FinalProductDisplay: React.FC<FinalProductDisplayProps> = ({
  productString,
  onBack,
  isLoading,
  allAnswers = {},
  allLabels = {}
}) => {
  const [copied, setCopied] = useState(false);
  const [showTraceability, setShowTraceability] = useState(true);
  const [copiedTraceability, setCopiedTraceability] = useState(false);

  // Define all question cells in CORRECT SEQUENCE order (1-34)
  const allQuestionCells = [
    // Question 1 - Application Description
    'APPLICATION_DESCRIPTION',
    // Initial questions (Questions 1-13)
    'B1', 'B11', 'B16', 'B22', 'B25', 'B30', 'B33', 'B36', 'B42', 'B52', 'B56', 'B62', 'B68',
    // Question 15 - Result Selection
    'RESULT_SELECTION',
    // Extended questions (Questions 16-31)
    'B106', 'B135', 'B139', 'B142', 'B147', 'B151', 'B154', 'B164', 'B167', 'B172', 'B176', 'B180', 'B185', 'B188', 'B191', 'B194',
    // Final solution selection (Question 32)
    'FINAL_SOLUTION_SELECTION',
    // Additional questions (Questions 33-35)
    'B212', 'B216', 'B220'
  ];

  const handleCopyProductString = async () => {
    try {
      await navigator.clipboard.writeText(productString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy product string:', error);
    }
  };

  const handleCopyTraceability = async () => {
    try {
      const traceabilityText = generateTraceabilityText();
      await navigator.clipboard.writeText(traceabilityText);
      setCopiedTraceability(true);
      setTimeout(() => setCopiedTraceability(false), 2000);
    } catch (error) {
      console.error('Failed to copy traceability:', error);
    }
  };

  const generateTraceabilityText = () => {
    let text = "SOLENOID VALVE CONFIGURATION TRACEABILITY\n";
    text += "=" + "=".repeat(48) + "\n\n";
    
    allQuestionCells.forEach((cell, index) => {
      const answer = allAnswers[cell];
      if (answer && answer.trim() !== '') {
        const questionNumber = index + 1; // Questions 1-34
        let label = allLabels[cell];
        
        // Special handling for specific question types
        if (cell === 'RESULT_SELECTION') {
          label = 'Select Your Configuration Option';
        } else if (cell === 'FINAL_SOLUTION_SELECTION') {
          label = 'Choose Most Optimum Solenoid Solution';
        } else if (!label) {
          label = `Question ${cell}`;
        }
        
        text += `Question ${questionNumber}: ${label}\n`;
        text += `Answer: ${answer}\n`;
        text += `Cell: ${cell}\n\n`;
      }
    });
    
    text += "FINAL PRODUCT CONFIGURATION\n";
    text += "=" + "=".repeat(28) + "\n";
    text += `Product String: ${productString}\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    
    return text;
  };
  const handleShare = async () => {
    if (navigator.share) {
      try {
        const traceabilityText = generateTraceabilityText();
        await navigator.share({
          title: 'Solenoid Valve Configuration',
          text: traceabilityText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copy
      handleCopyTraceability();
    }
  };

  const handlePrint = () => {
    // Create a safe print method that won't crash the app
    try {
      // Create a new window for printing to avoid React conflicts
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        // Fallback: copy content to clipboard if popup blocked
        handleCopyTraceability();
        alert('Print popup was blocked. The complete report has been copied to your clipboard instead.');
        return;
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Solenoid Valve Configuration Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .question { margin-bottom: 15px; padding: 10px; border-left: 3px solid #007bff; }
            .question-number { font-weight: bold; color: #007bff; }
            .answer { margin-left: 20px; color: #333; }
            .product-string { background: #f8f9fa; padding: 20px; border: 2px solid #007bff; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SOLENOID VALVE CONFIGURATION REPORT</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="section">
            <h2>Configuration Traceability</h2>
            ${answeredQuestions.map((cell, index) => {
              const answer = allAnswers[cell];
              let label = allLabels[cell];
              let stepNumber;
              
              if (cell === 'RESULT_SELECTION') {
                label = 'Select Your Configuration Option';
                stepNumber = 14;
              } else if (cell === 'FINAL_SOLUTION_SELECTION') {
                label = 'Choose Most Optimum Solenoid Solution';
                stepNumber = 31;
              } else if (cell.startsWith('B') && ['B106', 'B135', 'B139', 'B142', 'B147', 'B151', 'B154', 'B164', 'B167', 'B172', 'B176', 'B180', 'B185', 'B188', 'B191', 'B194'].includes(cell)) {
                const extendedIndex = ['B106', 'B135', 'B139', 'B142', 'B147', 'B151', 'B154', 'B164', 'B167', 'B172', 'B176', 'B180', 'B185', 'B188', 'B191', 'B194'].indexOf(cell);
                stepNumber = 15 + extendedIndex;
                if (!label) label = cell;
              } else if (cell.startsWith('B') && ['B212', 'B216', 'B220'].includes(cell)) {
                const additionalIndex = ['B212', 'B216', 'B220'].indexOf(cell);
                stepNumber = 32 + additionalIndex;
                if (!label) label = cell;
              } else {
                const initialIndex = ['B1', 'B11', 'B16', 'B22', 'B25', 'B30', 'B33', 'B36', 'B42', 'B52', 'B56', 'B62', 'B68'].indexOf(cell);
                if (initialIndex !== -1) {
                  stepNumber = initialIndex + 1;
                } else {
                  stepNumber = index + 1;
                }
                if (!label) label = cell;
              }
              
              return `
                <div class="question">
                  <div class="question-number">Question ${stepNumber}: ${label} (${cell})</div>
                  <div class="answer">${answer}</div>
                </div>
              `;
            }).join('')}
          </div>
          
          <div class="section">
            <h2>Final Product Configuration</h2>
            <div class="product-string">
              ${productString || 'Product string not available'}
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for using our Solenoid Valve Configuration Tool</p>
            <p>Configuration completed with ${answeredQuestions.length} questions answered</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
      
    } catch (error) {
      console.error('Print failed:', error);
      // Fallback: copy to clipboard
      handleCopyTraceability();
      alert('Print failed. The complete report has been copied to your clipboard instead.');
    }
  };
  const answeredQuestions = allQuestionCells.filter(cell => 
    allAnswers[cell] && allAnswers[cell].trim() !== ''
  );
  
  // DEBUG: Log what we have in allAnswers
  console.log('🔍 DEBUG FinalProductDisplay - allAnswers:', allAnswers);
  console.log('🔍 DEBUG FinalProductDisplay - allQuestionCells:', allQuestionCells);
  console.log('🔍 DEBUG FinalProductDisplay - answeredQuestions:', answeredQuestions);
  
  // DEBUG: Check specifically for extended questions
  const extendedCells = ['B106', 'B135', 'B139', 'B142', 'B147', 'B151', 'B154', 'B164', 'B167', 'B172', 'B176', 'B180', 'B185', 'B188', 'B191', 'B194'];
  console.log('🔍 DEBUG FinalProductDisplay - Extended questions in allAnswers:');
  extendedCells.forEach(cell => {
    console.log(`  ${cell}: "${allAnswers[cell] || 'NOT FOUND'}"`);
  });
  
  // DEBUG: Check what's in each state object
  console.log('🔍 DEBUG FinalProductDisplay - Raw props received:');
  console.log('  - allAnswers keys:', Object.keys(allAnswers || {}));
  console.log('  - allAnswers values:', allAnswers);
  
  // DEBUG: Check the filtering logic
  console.log('🔍 DEBUG FinalProductDisplay - Filtering logic:');
  allQuestionCells.forEach((cell, index) => {
    const answer = allAnswers[cell];
    const hasAnswer = answer && answer.trim() !== '';
    console.log(`  Question ${index + 1} (${cell}): "${answer}" - Has Answer: ${hasAnswer}`);
  });
  
  return (
    <>
      <style>{printStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        {/* Print Header - Only visible when printing */}
        <div className="print-header" style={{ display: 'none' }}>
          <h1 className="text-2xl font-bold">SOLENOID VALVE CONFIGURATION REPORT</h1>
          <p>Generated: {new Date().toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl mx-auto">
          
        {/* Header */}
        <div className="text-center mb-8 no-print">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-6">
            <Award className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuration Complete!</h1>
          <p className="text-gray-600">Your custom solenoid valve solution is ready</p>
        </div>

        {/* Configuration Traceability */}
        <div className="mb-8 print-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center print:text-lg">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              <span className="hidden print:inline">Complete </span>Configuration Traceability
            </h2>
            <button
              onClick={() => setShowTraceability(!showTraceability)}
              className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors no-print"
            >
              {showTraceability ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show Details
                </>
              )}
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4 print:text-xs">
            Complete record of all {answeredQuestions.length} questions and answers used in this configuration (Questions 1-35)
          </p>

          {(showTraceability || true) && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto print:bg-white print:border-gray-400 print:max-h-none print:overflow-visible">
              <div className="space-y-4">
                {answeredQuestions.map((cell, index) => {
                  const answer = allAnswers[cell];
                  let label = allLabels[cell];
                  let stepNumber;
                  
                  // Calculate proper step numbers based on cell type
                  if (cell === 'RESULT_SELECTION') {
                    label = 'Select Your Configuration Option';
                    stepNumber = 14; // This is actually question 14
                  } else if (cell === 'FINAL_SOLUTION_SELECTION') {
                    label = 'Choose Most Optimum Solenoid Solution';
                    stepNumber = 31; // This is actually question 31
                  } else if (cell.startsWith('B') && ['B106', 'B135', 'B139', 'B142', 'B147', 'B151', 'B154', 'B164', 'B167', 'B172', 'B176', 'B180', 'B185', 'B188', 'B191', 'B194'].includes(cell)) {
                    // Extended questions (15-30)
                    const extendedIndex = ['B106', 'B135', 'B139', 'B142', 'B147', 'B151', 'B154', 'B164', 'B167', 'B172', 'B176', 'B180', 'B185', 'B188', 'B191', 'B194'].indexOf(cell);
                    stepNumber = 15 + extendedIndex; // Questions 15-30
                    if (!label) {
                      label = `${cell}`;
                    }
                  } else if (cell.startsWith('B') && ['B212', 'B216', 'B220'].includes(cell)) {
                    // Additional questions (32-34)
                    const additionalIndex = ['B212', 'B216', 'B220'].indexOf(cell);
                    stepNumber = 32 + additionalIndex; // Questions 32-34
                    if (!label) {
                      label = `${cell}`;
                    }
                  } else {
                    // Initial questions (1-13)
                    const initialIndex = ['B1', 'B11', 'B16', 'B22', 'B25', 'B30', 'B33', 'B36', 'B42', 'B52', 'B56', 'B62', 'B68'].indexOf(cell);
                    if (initialIndex !== -1) {
                      stepNumber = initialIndex + 1; // Questions 1-13
                    } else {
                      stepNumber = index + 1; // Fallback
                    }
                    if (!label) {
                      label = `${cell}`;
                    }
                  }
                  
                  return (
                    <div key={cell} className="border-b border-gray-200 pb-3 last:border-b-0 print-question">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full print:bg-gray-200 print:text-black print-question-number">
                              {stepNumber}
                            </span>
                            <h4 className="font-medium text-gray-900 print:text-black">Question {stepNumber}: {label}</h4>
                            <span className="text-xs text-gray-500 print:text-gray-700">({cell})</span>
                          </div>
                          <p className="text-sm text-gray-700 ml-8 print:text-black print-answer">{answer}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* Product String Display */}
        <div className="mb-8 print-section">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center print:text-lg print:text-black">
            <Award className="h-5 w-5 mr-2 text-green-600" />
            Final Product String
          </h2>
          <p className="text-sm text-gray-600 mb-4 print:text-xs print:text-black">
            This model meets all necessary requirements as demanded by you
          </p>
          
          {/* Premium Product String Box */}
          <div className="relative">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1 rounded-2xl print:bg-black print:p-2">
              <div className="bg-white rounded-xl p-8 print:bg-white print:rounded-none print-product-string">
                <div className="text-center">
                  {productString ? (
                    <div className="space-y-4">
                      <div className="text-3xl font-bold text-gray-900 leading-relaxed break-all print:text-lg print:text-black">
                        {productString}
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 print:text-xs print:text-black">
                        <span>Generated from cell A234</span>
                        <span>•</span>
                        <span>Custom Configuration</span>
                        <span>•</span>
                        <span>{answeredQuestions.length} Questions Answered</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 py-8 print:text-black">
                      <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Product string not available</p>
                      <p className="text-sm">Please check cell A234 in the spreadsheet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse no-print"></div>
            <div className="absolute -top-1 -right-3 w-3 h-3 bg-green-400 rounded-full animate-pulse delay-300 no-print"></div>
            <div className="absolute -bottom-2 -left-3 w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-700 no-print"></div>
            <div className="absolute -bottom-1 -right-2 w-4 h-4 bg-purple-400 rounded-full animate-pulse delay-500 no-print"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8 no-print">
          <button
            onClick={handleCopyTraceability}
            disabled={answeredQuestions.length === 0}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {copiedTraceability ? (
              <>
                <Check className="h-5 w-5 mr-2 text-green-300" />
                Copied Complete Report!
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-2" />
                Copy Complete Report
              </>
            )}
          </button>

          <button
            onClick={handleCopyProductString}
            disabled={!productString}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {copied ? (
              <>
                <Check className="h-5 w-5 mr-2 text-green-300" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5 mr-2" />
                Copy Product String Only
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            disabled={!productString && answeredQuestions.length === 0}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share Complete Report
          </button>

          <button
            onClick={handlePrint}
            disabled={!productString && answeredQuestions.length === 0}
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-5 w-5 mr-2" />
            Print/Save
          </button>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 no-print">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">
                Configuration Successfully Generated
              </h3>
              <p className="text-green-700 mt-1">
                Your custom solenoid valve configuration has been optimized based on {answeredQuestions.length} answered questions and preferences.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center no-print">
          <button
            onClick={onBack}
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Start New Configuration
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 print-footer">
          <p>Thank you for using our Solenoid Valve Configuration Tool</p>
          <p className="mt-1">For technical support, please contact our engineering team</p>
          <p className="mt-1 text-xs">Configuration completed with {answeredQuestions.length} questions answered</p>
        </div>
        </div>
      </div>
    </>
  );
};