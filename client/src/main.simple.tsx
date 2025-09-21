import { createRoot } from "react-dom/client";
import React, { Suspense } from "react";
import App from "./App.simple";
import "./globals.css";

// Simple loading component
const SimpleLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300">Loading...</p>
    </div>
  </div>
);

// Simple theme provider
const SimpleThemeProvider = ({ children }: { children: React.ReactNode }) => {
  React.useEffect(() => {
    // Simple dark mode detection
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return <>{children}</>;
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Suspense fallback={<SimpleLoader />}>
      <SimpleThemeProvider>
        <App />
      </SimpleThemeProvider>
    </Suspense>
  </React.StrictMode>
);
