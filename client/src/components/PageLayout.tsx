import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { TouchButton } from '@/components/FullscreenSection';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  onBack?: () => void;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = "from-blue-500 to-indigo-600",
  children,
  onBack = () => window.history.back()
}) => {
  const { t } = useTranslation();
  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Design System Container */}
      <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section - Perfectly Centered */}
        <motion.header 
          className="flex items-center justify-between py-6 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <TouchButton
            onClick={onBack}
            className="group relative px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-medium">{t('common.back')}</span>
          </TouchButton>
          
          <div className="text-center">
            <motion.div 
              className="flex items-center justify-center space-x-3 mb-2"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div 
                className={`p-3 bg-gradient-to-br ${iconColor} rounded-xl`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
                {subtitle && (
                  <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
                )}
              </div>
            </motion.div>
          </div>
          
          <div className="w-24"></div> {/* Spacer for perfect centering */}
        </motion.header>

        {/* Main Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="space-y-8"
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
};
