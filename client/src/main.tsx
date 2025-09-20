import { createRoot } from "react-dom/client";
import React, { Suspense } from "react";
import App from "./App.tsx";
import "./globals.css";
import "./i18n"; // Import i18n configuration
import { SplashScreen } from "./components/SplashScreen.tsx";
import { ProfessionalThemeProvider } from "./components/ProfessionalTheme.tsx";

// console.log("[MAIN] Application starting..."); // Removed log

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<SplashScreen />}>
      <ProfessionalThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <App />
      </ProfessionalThemeProvider>
    </Suspense>
  </React.StrictMode>,
);