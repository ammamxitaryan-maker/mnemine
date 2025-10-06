"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Warning {
  id: string;
  message: string;
  type: 'warning' | 'error' | 'info';
  dismissed?: boolean;
}

export const DevWarning = () => {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV !== 'development') return;

    const warningMessages: Warning[] = [
      {
        id: 'telegram-version',
        message: 'Telegram WebApp version 6.0 detected. Some features may not be available.',
        type: 'warning'
      },
      {
        id: 'react-router-future',
        message: 'React Router future flags enabled for v7 compatibility.',
        type: 'info'
      }
    ];

    setWarnings(warningMessages);
    setIsVisible(true);
  }, []);

  const dismissWarning = (id: string) => {
    setWarnings(prev => 
      prev.map(w => w.id === id ? { ...w, dismissed: true } : w)
    );
  };

  const dismissAll = () => {
    setIsVisible(false);
  };

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const activeWarnings = warnings.filter(w => !w.dismissed);

  if (activeWarnings.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50 max-w-md">
      <div className="bg-yellow-900/90 border border-yellow-700/50 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-200">Development Warnings</span>
          </div>
          <button
            onClick={dismissAll}
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-2">
          {activeWarnings.map((warning) => (
            <div key={warning.id} className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-xs text-yellow-100">{warning.message}</p>
              </div>
              <button
                onClick={() => dismissWarning(warning.id)}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-2 border-t border-yellow-700/50">
          <p className="text-xs text-yellow-300/70">
            These warnings only appear in development mode.
          </p>
        </div>
      </div>
    </div>
  );
};
