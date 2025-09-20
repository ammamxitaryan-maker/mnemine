"use client";

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/LanguageSwitcher'; // Import LanguageSwitcher
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Globe } from 'lucide-react'; // Import Globe icon

const Settings = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col text-white p-4">
      <PageHeader titleKey="settings.title" backTo="/profile" />
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-700">
        <CardHeader>
          <CardTitle>{t('settings.preferences')}</CardTitle>
          <CardDescription className="text-gray-400">{t('settings.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-secondary" /> {/* Changed icon to Globe */}
              <span className="font-medium">{t('settings.language')}</span>
            </div>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-secondary" />
              <span className="font-medium">{t('settings.theme')}</span>
            </div>
            <ThemeSwitcher />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;