import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';

interface ReferralLinkProps {
  referralCode: string;
}

const ReferralLink = ({ referralCode }: ReferralLinkProps) => {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://t.me/mnemine/app?startapp=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center space-x-2">
      <Input value={referralLink} readOnly className="bg-gray-800 border-gray-700" />
      <Button size="icon" onClick={handleCopy} variant="ghost">
        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
      </Button>
    </div>
  );
};