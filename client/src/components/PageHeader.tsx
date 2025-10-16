"use client";

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BackButton } from './BackButton';
import { cn } from '@/lib/utils'; // Import cn utility

interface PageHeaderProps {
  titleKey: string;
  backTo?: string;
  titleClassName?: string; // New prop for custom title styling
}

export const PageHeader = ({ titleKey, backTo = '/', titleClassName }: PageHeaderProps) => {
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between mb-4 h-10">
      <div className="w-1/4">
        <BackButton fallbackPath={backTo} />
      </div>
      <div className="w-1/2 text-center">
        <h1 className={cn("text-xl font-bold truncate", titleClassName)}>{t(titleKey)}</h1>
      </div>
      <div className="w-1/4 flex justify-end items-center gap-1">
        {/* Placeholder for potential future icons */}
      </div>
    </header>
  );
};