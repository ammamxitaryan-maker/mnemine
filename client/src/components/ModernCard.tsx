import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ModernCardProps {
  title?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  delay?: number;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  title,
  icon: Icon,
  iconColor = "from-blue-500 to-indigo-600",
  children,
  className = "",
  hoverEffect = true,
  delay = 0
}) => {
  const cardContent = (
    <Card className={`h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl transition-all duration-500 ${className}`}>
      {(title || Icon) && (
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl">
            {Icon && (
              <motion.div 
                className={`p-2 bg-gradient-to-br ${iconColor} rounded-xl mr-3`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon className="w-6 h-6 text-white" />
              </motion.div>
            )}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  if (hoverEffect) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ y: -4 }}
        className="h-full"
      >
        <motion.div
          whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="h-full"
        >
          {cardContent}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="h-full"
    >
      {cardContent}
    </motion.div>
  );
};
