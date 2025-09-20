import React from 'react';
import { Shield, Lock, Users, TrendingUp, Award, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TrustIndicatorProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value?: string;
}

const TrustIndicator: React.FC<TrustIndicatorProps> = ({ icon, title, description, value }) => (
  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
      {value && (
        <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">{value}</p>
      )}
    </div>
  </div>
);

export const TrustIndicators: React.FC = () => {
  const indicators = [
    {
      icon: <Shield className="w-5 h-5 text-blue-600" />,
      title: "Bank-Level Security",
      description: "256-bit SSL encryption and secure transactions",
      value: "100% Secure"
    },
    {
      icon: <Users className="w-5 h-5 text-green-600" />,
      title: "Active Users",
      description: "Join thousands of satisfied investors",
      value: "50,000+"
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      title: "Total Profits",
      description: "Consistent returns for our community",
      value: "$2.5M+"
    },
    {
      icon: <Award className="w-5 h-5 text-yellow-600" />,
      title: "Certified Platform",
      description: "Verified by financial authorities",
      value: "Licensed"
    },
    {
      icon: <Lock className="w-5 h-5 text-purple-600" />,
      title: "Protected Funds",
      description: "Your investments are fully insured",
      value: "Insured"
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-teal-600" />,
      title: "24/7 Support",
      description: "Round-the-clock customer assistance",
      value: "Always Online"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Why Trust Our Platform?
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Your financial security and success are our top priorities
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicators.map((indicator, index) => (
          <TrustIndicator
            key={index}
            icon={indicator.icon}
            title={indicator.title}
            description={indicator.description}
            value={indicator.value}
          />
        ))}
      </div>
    </div>
  );
};

export const SecurityBadge: React.FC = () => (
  <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
    <Shield className="w-4 h-4" />
    <span>Secured by SSL</span>
  </div>
);

export const LiveStatusIndicator: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    <span className="text-sm text-gray-600 dark:text-gray-300">Live Trading</span>
  </div>
);
