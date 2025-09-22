import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, ArrowLeft } from 'lucide-react';
import { CTAButton } from '@/components/ui/cta-button';

interface BasePageLayoutProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  onBack?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const BasePageLayout: React.FC<BasePageLayoutProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = "from-blue-500 to-indigo-600",
  onBack,
  children,
  className = ""
}) => {
  return (
    <motion.div 
      className={`min-h-screen ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header Section */}
        <motion.header 
          className="flex items-center justify-between mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {onBack && (
            <CTAButton
              onClick={onBack}
              icon={ArrowLeft}
              variant="ghost"
              size="md"
            >
              Back
            </CTAButton>
          )}
          
          <div className="text-center flex-1">
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
          
          {onBack && <div className="w-24"></div>} {/* Spacer for perfect centering */}
        </motion.header>

        {/* Main Content */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {children}
        </motion.section>
      </div>
    </motion.div>
  );
};
