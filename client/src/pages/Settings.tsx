"use client";

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/LanguageSwitcher'; // Import LanguageSwitcher
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Globe, Shield } from 'lucide-react'; // Import Globe and Shield icons

const Settings = () => {
  const { t } = useTranslation();

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
        <PageHeader titleKey="settings.title" backTo="/profile" />
      <Card className="bg-gray-900/80 border-primary">
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

      {/* Administrator Information Card */}
      <Card className="bg-gray-900/80 border-primary mt-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Administrator Information
          </CardTitle>
          <CardDescription className="text-gray-400">
            Application administrator contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-white">Support Contact:</span>
                <span className="ml-2 text-blue-400">Contact support through the app</span>
              </p>
            </div>
            <p className="text-xs text-gray-400">
              For technical support or assistance, please use the in-app support system.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Settings;