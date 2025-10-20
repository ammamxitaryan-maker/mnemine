import React, { useState } from 'react';
import { LoadingProvider, useLoading } from '../contexts/LoadingContext';
import { LoadingAnimation } from './LoadingAnimation';

const LoadingTestContent: React.FC = () => {
  const { loadingState, resetLoading } = useLoading();
  const [showTest, setShowTest] = useState(false);

  const handleReset = () => {
    resetLoading();
    setShowTest(false);
  };

  const handleShowTest = () => {
    setShowTest(true);
  };

  if (showTest) {
    return <LoadingAnimation duration={4000} />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Loading Animation Test
          </h1>
          <p className="text-muted-foreground">
            Test the mouse head loading animation
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleShowTest}
            className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Start Loading Animation
          </button>

          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Animation Features:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Glowing particles forming mouse head</li>
              <li>• Eyes light up with animation</li>
              <li>• "NON" text appears inside</li>
              <li>• Futuristic crypto aesthetic</li>
              <li>• Progress indicator</li>
              <li>• Energy rings and glow effects</li>
            </ul>
          </div>

          {loadingState.isAppReady && (
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
              <p className="text-green-500 text-sm">
                ✅ App is ready! Loading animation completed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const LoadingTest: React.FC = () => {
  return (
    <LoadingProvider>
      <LoadingTestContent />
    </LoadingProvider>
  );
};
