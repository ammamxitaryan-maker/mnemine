"use client";

import { useEffect } from 'react';
import { useAutoLanguageDetection } from '@/hooks/useAutoLanguageDetection';

interface AutoLanguageInitializerProps {
  children: React.ReactNode;
}

export const AutoLanguageInitializer = ({ children }: AutoLanguageInitializerProps) => {
  const { applyAutoLanguage, isAutoDetected, detectedLanguage, confidence } = useAutoLanguageDetection();

  useEffect(() => {
    // Применяем автоматическое определение языка при инициализации
    const initializeLanguage = async () => {
      try {
        const applied = await applyAutoLanguage();
        if (applied) {
          console.log(`🌍 Language auto-detection applied: ${detectedLanguage} (confidence: ${Math.round(confidence * 100)}%)`);
        }
      } catch (error) {
        console.error('Error initializing auto language detection:', error);
      }
    };

    initializeLanguage();
  }, []); // Remove dependency to prevent infinite loop

  return <>{children}</>;
};
