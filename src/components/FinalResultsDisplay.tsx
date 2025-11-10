import React, { useState } from 'react';
import { Table, RefreshCw, Copy, Check, ArrowLeft, Download } from 'lucide-react';

interface FinalResultsDisplayProps {
  data: string[][];
  onBack: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const FinalResultsDisplay: React.FC<FinalResultsDisplayProps> = ({
  data,
  onBack,
  onRefresh,
  isLoading
}) => {
  const [copiedData, setCopiedData] = useState<string>('');

  // Filter out empty rows and get headers
  const filteredData = data.filter(row => row.some(cell => cell && cell.trim() !== ''));
  const headers = filteredData.length > 0 ? filteredData[0] : [];
  const rows = filteredData.slice(1);

  const handleCopyTable = async () => {
    try {
      // Convert table to tab-separated values
      const tsvData = filteredData.map(row => row.join('\t')).join('\n');
      await navigator.clipboard.writeText(tsvData);
      setCopiedData('table');
      setTimeout(() => setCopiedData(''), 2000);
    } catch (error) {
      console.error('Failed to copy table:', error);
    }
  };

  const handleCopyRow = async (row: string[], index: number) => {
    try {
      const rowData = row.join('\t');
      await navigator.clipboard.writeText(rowData);
      setCopiedData(`row-${index}`);
      setTimeout(() => setCopiedData(''), 2000);
    } catch (error) {
      console.error('Failed to copy row:', error);
    }
  };

  if (filteredData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Table className="h-5 w-5 mr-2" />
            Final Results
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={onBack}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        <div className="text-center py-12 text-gray-500">
          <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No final results available. Please refresh to see the latest data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Table className="h-5 w-5 mr-2" />
          Final Configuration Results
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={onBack}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <button
            onClick={handleCopyTable}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {copiedData === 'table' ? (
              <Check className="h-4 w-4 mr-1 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
            Copy Table
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

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {cell || '-'}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleCopyRow(row, rowIndex)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                    title="Copy row"
                  >
                    {copiedData === `row-${rowIndex}` ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <span>
          Showing {rows.length} configuration{rows.length !== 1 ? 's' : ''} with {headers.length} parameter{headers.length !== 1 ? 's' : ''}
        </span>
        <span>
          Data range: A198:W209
        </span>
      </div>
    </div>
  );
};