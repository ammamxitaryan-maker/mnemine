import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check, Zap } from 'lucide-react';
import { useState } from 'react';
import { useAutoLanguageDetection } from '@/hooks/useAutoLanguageDetection';

const languages = [
  { code: 'hy', name: 'Հայերեն', flag: '🇦🇲' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);
  // Disabled auto language detection to force Armenian as default
  // const { isAutoDetected, detectedLanguage, confidence, overrideLanguage } = useAutoLanguageDetection();

  const changeLanguage = async (lng: string) => {
    if (i18n.language === lng) return; // Don't change if already selected
    
    setIsChanging(true);
    try {
      await i18n.changeLanguage(lng);
      // Disabled auto language detection
      // overrideLanguage(lng);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isChanging} className="relative">
          <Globe className="h-6 w-6" />
          {/* Disabled auto language detection indicator */}
          {/* {isAutoDetected && confidence > 0.5 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
              <Zap className="w-2 h-2 text-white" />
            </div>
          )} */}
          {isChanging && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
            </div>
          )}
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 text-white min-w-[200px]">
        {/* Disabled auto language detection info */}
        {/* {isAutoDetected && confidence > 0.5 && (
          <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-primary" />
              <span>Auto-detected: {detectedLanguage?.toUpperCase()}</span>
            </div>
            <div className="text-gray-500 mt-1">
              Confidence: {Math.round(confidence * 100)}%
            </div>
          </div>
        )} */}
        
        {languages.map((lang) => (
          <DropdownMenuItem 
            key={lang.code} 
            onClick={() => changeLanguage(lang.code)} 
            className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
          >
            <span className="mr-2">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {i18n.language === lang.code && (
              <Check className="h-4 w-4 text-green-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};