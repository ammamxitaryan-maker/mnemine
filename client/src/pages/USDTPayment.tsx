import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { api } from '@/lib/api';
import { showError, showSuccess } from '@/utils/toast';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Copy,
  ExternalLink,
  QrCode,
  RefreshCw
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

interface PaymentData {
  paymentId: string;
  orderId: string;
  usdtAddress: string;
  usdtAmount: number;
  mneAmount: number;
  exchangeRate: number;
  qrCode: string;
  paymentUrl: string;
  expiresAt: string;
}

const checkPaymentStatus = async (paymentId: string) => {
  const { data } = await api.get(`/payments/usdt/status/${paymentId}`);
  return data;
};

const USDTPayment = () => {
  const { user } = useTelegramAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Get payment data from navigation state or localStorage
  const paymentData: PaymentData = location.state?.paymentData ||
    JSON.parse(localStorage.getItem('currentPayment') || '{}');

  // Check payment status every 10 seconds
  const { data: paymentStatus, refetch } = useQuery({
    queryKey: ['paymentStatus', paymentData.paymentId],
    queryFn: () => checkPaymentStatus(paymentData.paymentId),
    enabled: !!paymentData.paymentId,
    refetchInterval: 10000, // Check every 10 seconds
    refetchIntervalInBackground: true
  });

  // Calculate time left
  useEffect(() => {
    if (paymentData.expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(paymentData.expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(remaining);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [paymentData.expiresAt]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showSuccess('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showError('Failed to copy address');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleBack = () => {
    navigate('/deposit');
  };

  // If payment is completed, redirect to success page
  useEffect(() => {
    if (paymentStatus?.status === 'COMPLETED') {
      navigate('/payment/success', {
        state: {
          paymentData: paymentData,
          mneAmount: paymentData.mneAmount
        }
      });
    }
  }, [paymentStatus, navigate, paymentData]);

  if (!paymentData.paymentId) {
    return (
      <div className="page-container flex flex-col text-white">
        <div className="page-content w-full max-w-md mx-auto">
          <PageHeader title="Payment Error" backTo="/deposit" />
          <Card className="bg-gray-900/80 border-red-500">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-400">Payment data not found. Please try again.</p>
              <Button
                onClick={handleBack}
                className="mt-4 bg-primary hover:bg-primary/90"
              >
                Back to Deposit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
        <PageHeader title="USDT Payment" backTo="/deposit" />

        {/* Payment Summary */}
        <Card className="bg-gray-900/80 border-primary mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Payment Summary
            </CardTitle>
            <CardDescription>
              Send USDT to receive MNE tokens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">MNE Amount:</span>
              <span className="font-medium text-primary">
                {paymentData.mneAmount.toFixed(6)} MNE
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">USDT Amount:</span>
              <span className="font-medium text-green-500">
                {paymentData.usdtAmount.toFixed(2)} USDT
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Exchange Rate:</span>
              <span className="font-medium">
                1 USD = {paymentData.exchangeRate.toFixed(6)} MNE
              </span>
            </div>
            {timeLeft > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Time Left:</span>
                <span className="font-medium text-orange-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* USDT Address */}
        <Card className="bg-gray-900/80 border-green-500 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Send USDT to this address
            </CardTitle>
            <CardDescription>
              Copy the address below and send exactly {paymentData.usdtAmount.toFixed(2)} USDT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <code className="text-sm text-green-400 break-all">
                  {paymentData.usdtAddress}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(paymentData.usdtAddress)}
                  className="ml-2 flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* QR Code */}
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg inline-block">
                <div className="text-xs text-gray-600 mb-2">Scan QR Code</div>
                <div className="text-xs text-gray-800 break-all max-w-xs">
                  {paymentData.qrCode}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card className="bg-gray-900/80 border-blue-500 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`font-medium ${paymentStatus?.status === 'COMPLETED' ? 'text-green-500' :
                paymentStatus?.status === 'FAILED' ? 'text-red-500' :
                  'text-yellow-500'
                }`}>
                {paymentStatus?.status || 'PENDING'}
              </span>
            </div>
            {paymentStatus?.transactionHash && (
              <div className="mt-2">
                <div className="text-xs text-gray-400">Transaction Hash:</div>
                <code className="text-xs text-blue-400 break-all">
                  {paymentStatus.transactionHash}
                </code>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-gray-900/80 border-gray-600 mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Payment Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400 space-y-2">
            <p>1. Copy the USDT address above</p>
            <p>2. Send exactly {paymentData.usdtAmount.toFixed(2)} USDT to this address</p>
            <p>3. Wait for network confirmation (usually 1-3 minutes)</p>
            <p>4. Your MNE tokens will be credited automatically</p>
            <p className="text-orange-400 mt-2">
              ⚠️ Send only USDT (TRC20) to this address. Other tokens will be lost.
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="mobile"
            className="flex-1 min-h-[44px] touch-manipulation"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Status
          </Button>
          <Button
            onClick={handleBack}
            variant="outline"
            size="mobile"
            className="flex-1 min-h-[44px] touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default USDTPayment;
