import { createRoot } from "react-dom/client";
import React, { Suspense } from "react";
import App from "./App";
import "./globals.css";
import "./i18n"; // Import i18n configuration
import { SplashScreen } from "./components/SplashScreen";
import { ThemeProvider } from "./components/ThemeProvider";


createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<SplashScreen />}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="dark" 
        enableSystem={false}
        storageKey="mnemine-theme"
        disableTransitionOnChange={false}
        themes={["light", "dark"]}
      >
        <App />
      </ThemeProvider>
    </Suspense>
  </React.StrictMode>,
);