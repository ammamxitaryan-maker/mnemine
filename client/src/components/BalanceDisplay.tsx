import { useTranslation } from 'react-i18next';
import { Wallet } from "lucide-react";

interface BalanceDisplayProps {
  balance: number;
}

export const BalanceDisplay = ({ balance = 0 }: BalanceDisplayProps) => {
  const { t } = useTranslation();
  const formattedBalance = Number(balance).toFixed(4);

  return (
    <div className="text-center">
      <h2 className="text-sm font-medium text-gray-400">{t('balance')}</h2>
      <div className="flex items-center justify-center mt-1">
        <Wallet className="w-6 h-6 mr-2 text-yellow-400" />
        <p className="text-2xl font-bold text-white">{formattedBalance} <span className="text-lg text-gray-400">CFM</span></p>
      </div>
    </div>
  );
};