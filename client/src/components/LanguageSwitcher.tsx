import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const languages = [
  { code: 'hy', name: 'Հայերեն', flag: '🇦🇲', nativeName: 'Հայերեն' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative group hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Globe className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" />
          </motion.div>
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-xl min-w-[200px]"
      >
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Select Language</p>
        </div>
        {languages.map((lang) => (
          <DropdownMenuItem 
            key={lang.code} 
            onClick={() => changeLanguage(lang.code)} 
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 focus:bg-gray-50 dark:focus:bg-gray-800"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{lang.nativeName}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{lang.name}</span>
                </div>
              </div>
              {i18n.language === lang.code && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </motion.div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};