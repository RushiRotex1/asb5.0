import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';

interface DropdownFormProps {
  labels: { [key: string]: string };
  values: { [key: string]: string };
  dropdownOptions: { [key: string]: string[] };
  onSubmit: (values: { [key: string]: string }) => void;
  isLoading?: boolean;
  error?: string;
}

export const DropdownForm: React.FC<DropdownFormProps> = ({
  labels,
  values,
  dropdownOptions,
  onSubmit,
  isLoading,
  error
}) => {
  const [formValues, setFormValues] = useState(values);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormValues(values);
    setHasChanges(false);
  }, [values]);

  const handleInputChange = (cell: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [cell]: value
    }));
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formValues);
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormValues(values);
    setHasChanges(false);
  };

  const getOptionsForCell = (cell: string): string[] => {
    return dropdownOptions[cell] || [];
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">String Builder Configuration</h2>
        {hasChanges && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Unsaved changes
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(labels).map(([cell, label]) => (
            <div key={cell} className="space-y-2">
              <label htmlFor={cell} className="block text-sm font-medium text-gray-700">
                {label}
                <span className="ml-1 text-xs text-gray-500">({cell})</span>
              </label>
              <select
                id={cell}
                value={formValues[cell] || ''}
                onChange={(e) => handleInputChange(cell, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={isLoading}
              >
                <option value="">Select an option</option>
                {getOptionsForCell(cell).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading || !hasChanges}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </button>

          <button
            type="submit"
            disabled={isLoading || !hasChanges}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Updating...' : 'Update Sheet'}
          </button>
        </div>
      </form>
    </div>
  );
};