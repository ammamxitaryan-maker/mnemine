import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';

interface ReferralLinkProps {
  referralLink: string;
  referralCode?: string;
}

const ReferralLink = ({ referralLink, referralCode }: ReferralLinkProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center space-x-2">
      <Input value={referralLink} readOnly className="bg-gray-800 border-gray-700 text-sm" />
      <Button size="icon" onClick={handleCopy} variant="ghost" className="hover:bg-gray-700">
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
};