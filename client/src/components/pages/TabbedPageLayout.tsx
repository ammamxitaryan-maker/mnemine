import React from 'react';
import { motion } from 'framer-motion';
import { BasePageLayout } from './BasePageLayout';
import { EnhancedTabs, EnhancedTabsList, EnhancedTabsTrigger, EnhancedTabsContent } from '@/components/ui/enhanced-tabs';
import { LucideIcon } from 'lucide-react';

interface TabConfig {
  value: string;
  label: string;
  content: React.ReactNode;
}

interface TabbedPageLayoutProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  onBack?: () => void;
  tabs: TabConfig[];
  defaultTab?: string;
  className?: string;
}

export const TabbedPageLayout: React.FC<TabbedPageLayoutProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  onBack,
  tabs,
  defaultTab,
  className = ""
}) => {
  const defaultValue = defaultTab || tabs[0]?.value || '';

  return (
    <BasePageLayout
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconColor={iconColor}
      onBack={onBack}
      className={className}
    >
      <EnhancedTabs defaultValue={defaultValue} className="w-full">
        <EnhancedTabsList variant="pills" className="mb-6">
          {tabs.map((tab) => (
            <EnhancedTabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </EnhancedTabsTrigger>
          ))}
        </EnhancedTabsList>

        {tabs.map((tab) => (
          <EnhancedTabsContent key={tab.value} value={tab.value} variant="card">
            {tab.content}
          </EnhancedTabsContent>
        ))}
      </EnhancedTabs>
    </BasePageLayout>
  );
};
