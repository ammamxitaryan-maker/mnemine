import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SplashScreen } from "./components/SplashScreen";
import { ThemeProvider } from "./components/ThemeProvider";
import "./globals.css";
import "./i18n"; // Import i18n configuration


createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<SplashScreen />}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        storageKey="nonmine-theme"
        disableTransitionOnChange={false}
        themes={["light", "dark"]}
      >
        <App />
      </ThemeProvider>
    </Suspense>
  </React.StrictMode>,
);