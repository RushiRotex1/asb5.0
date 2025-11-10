import React, { useState } from 'react';
import { Key, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
  isLoading?: boolean;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet, isLoading }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!apiKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }
    
    onApiKeySet(apiKey.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Key className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Google Sheets Access</h1>
          <p className="text-gray-600">Enter your Google Sheets API key to connect to your spreadsheet</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Google Sheets API key"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !apiKey.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connecting...' : 'Connect to Google Sheets'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Need an API key?</h3>
          <p className="text-sm text-blue-700 mb-3">
            Follow these steps to get your Google Sheets API key:
          </p>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Go to the Google Cloud Console</li>
            <li>Enable the Google Sheets API</li>
            <li>Create credentials (API key)</li>
            <li>Copy and paste the API key here</li>
          </ol>
          <a
            href="https://developers.google.com/sheets/api/quickstart"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-800 font-medium"
          >
            View Setup Guide
            <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
};