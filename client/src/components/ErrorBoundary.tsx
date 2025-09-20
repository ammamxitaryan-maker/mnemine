import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Send to error reporting service in production
    if (import.meta.env.PROD) {
      this.reportError(errorData);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reportError = async (errorData: any) => {
    try {
      // In production, send to error reporting service
      if (import.meta.env.PROD) {
        // Example: Send to error reporting service (Sentry, LogRocket, etc.)
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...errorData,
            environment: import.meta.env.MODE,
            version: import.meta.env.VITE_APP_VERSION || '1.0.0'
          }),
        }).catch(() => {
          // Fallback: store in localStorage for later reporting
          const errors = JSON.parse(localStorage.getItem('pendingErrors') || '[]');
          errors.push(errorData);
          localStorage.setItem('pendingErrors', JSON.stringify(errors.slice(-10))); // Keep only last 10
        });
      } else {
        console.error('Error reported:', errorData);
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen text-white p-4 bg-gray-900">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-500 mb-2">Something went wrong</h2>
              <p className="text-red-400 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              {this.state.errorId && (
                <p className="text-xs text-gray-500 mb-4">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => this.setState({ hasError: false, error: undefined, errorId: undefined })} 
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              
              <button 
                onClick={() => window.location.reload()} 
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
