import React from 'react';

interface TelegramInstructionsProps {
  onRetry?: () => void;
}

export const TelegramInstructions: React.FC<TelegramInstructionsProps> = ({ onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Open in Telegram
          </h1>
          <p className="text-gray-600">
            This app must be opened through Telegram bot
          </p>
        </div>

        <div className="space-y-4 text-left">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Open Telegram and find your bot
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Send <code className="bg-gray-100 px-2 py-1 rounded text-xs">/start</code> command
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Click the <strong>"🚀 Launch App"</strong> button
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              4
            </div>
            <div>
              <p className="text-sm text-gray-700">
                The app will open as Telegram WebApp
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Opening this URL directly in a browser won't work. 
                You must use the Telegram bot to access this app.
              </p>
            </div>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
