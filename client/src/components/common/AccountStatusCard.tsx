import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

interface AccountStatusCardProps {
  isEligible: boolean;
  isSuspicious: boolean;
}

export const AccountStatusCard = ({ isEligible, isSuspicious }: AccountStatusCardProps) => {
  const { t } = useTranslation();

  let title = t('accountStatus.ok.title');
  let description = t('accountStatus.ok.description');
  let Icon = CheckCircle;
  let colorClasses = 'text-green-400 border-green-500/50 bg-green-900/30';

  if (isSuspicious) {
    title = t('accountStatus.suspicious.title');
    description = t('accountStatus.suspicious.description');
    Icon = ShieldAlert;
    colorClasses = 'text-red-400 border-red-500/50 bg-red-900/30';
  } else if (!isEligible) {
    title = t('accountStatus.ineligible.title');
    description = t('accountStatus.ineligible.description');
    Icon = AlertTriangle;
    colorClasses = 'text-yellow-400 border-yellow-500/50 bg-yellow-900/30';
  }

  return (
    <Card className={`w-full ${colorClasses}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{description}</p>
      </CardContent>
    </Card>
  );
};