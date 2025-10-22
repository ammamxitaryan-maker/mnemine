import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTelegramAuth } from '@/hooks/useTelegramAuth'
import { useUserData } from '@/hooks/useUserData'
import { api } from '@/lib/api'
import { dismissToast, showError, showLoading, showSuccess } from '@/utils/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, Loader2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const createUSDTWithdrawal = async ({ telegramId, amount, address, description }: {
  telegramId: string,
  amount: number,
  address: string,
  description?: string
}) => {
  const { data } = await api.post('/withdrawals/usdt/create', {
    telegramId,
    amount,
    address,
    description
  })
  return data
}

const USDTWithdraw = () => {
  const { user } = useTelegramAuth()
  const { data: userData } = useUserData(user?.telegramId)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const { t } = useTranslation()

  const mutation = useMutation({
    mutationFn: createUSDTWithdrawal,
    onMutate: async () => {
      const toastId = showLoading('Processing USDT withdrawal...')
      return { toastId }
    },
    onSuccess: (data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId)
      showSuccess(data.message || 'USDT withdrawal initiated successfully!')
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] })
      queryClient.invalidateQueries({ queryKey: ['activity', user?.telegramId] })
      navigate('/wallet')
    },
    onError: (error: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId)
      const errorMessage = error.response?.data?.error || 'Failed to create USDT withdrawal'
      showError(errorMessage)
    },
  })

  const handleWithdraw = () => {
    const withdrawAmount = parseFloat(amount)
    if (!user) {
      showError('User not authenticated')
      return
    }
    if (!withdrawAmount || withdrawAmount <= 0) {
      showError('Invalid amount')
      return
    }
    if (!address) {
      showError('USDT address is required')
      return
    }
    if (!address.startsWith('T') || address.length !== 34) {
      showError('Invalid USDT TRC20 address format')
      return
    }
    mutation.mutate({
      telegramId: user.telegramId,
      amount: withdrawAmount,
      address,
      description: description || undefined
    })
  }

  const MINIMUM_USDT_WITHDRAWAL = 10 // $10 minimum
  const currentBalance = userData?.wallets?.find(w => w.currency === 'USD')?.balance ?? 0
  const parsedAmount = parseFloat(amount)

  const isWithdrawButtonDisabled = mutation.isPending ||
    !user ||
    currentBalance < MINIMUM_USDT_WITHDRAWAL ||
    isNaN(parsedAmount) || parsedAmount <= 0 ||
    parsedAmount > currentBalance ||
    parsedAmount < MINIMUM_USDT_WITHDRAWAL ||
    !address ||
    !address.startsWith('T') || address.length !== 34

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
        <PageHeader titleKey="USDT Withdrawal" backTo="/wallet" />

        <Card className="bg-gray-900/80 border-primary mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              USDT Withdrawal
            </CardTitle>
            <CardDescription className="text-gray-400">
              Current USD Balance: <span className="text-gold font-bold">{currentBalance.toFixed(2)} USD</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">USDT TRC20 Address</Label>
              <Input
                id="address"
                placeholder="T..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-gray-800 border-gray-700 h-11"
              />
              <p className="text-xs text-gray-400">
                Enter your USDT TRC20 wallet address (starts with 'T', 34 characters)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder={`Minimum: $${MINIMUM_USDT_WITHDRAWAL}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Withdrawal description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-800 border-gray-700 h-11"
              />
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Minimum withdrawal: <span className="font-mono text-primary">${MINIMUM_USDT_WITHDRAWAL} USD</span></p>
              <p>Network: <span className="font-mono text-green-500">TRON (TRC20)</span></p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-base py-5"
              onClick={handleWithdraw}
              disabled={isWithdrawButtonDisabled}
            >
              {mutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Withdraw USDT'}
            </Button>
          </CardFooter>
        </Card>

        {/* Important Information */}
        <Card className="bg-gray-900/80 border-orange-500 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <AlertCircle className="w-5 h-5" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400 space-y-2">
            <p>• Withdrawals are processed via NOWPayments</p>
            <p>• Minimum withdrawal amount is ${MINIMUM_USDT_WITHDRAWAL} USD</p>
            <p>• Only USDT TRC20 addresses are supported</p>
            <p>• Withdrawals may take 5-30 minutes to process</p>
            <p>• Network fees are included in the withdrawal</p>
            <p className="text-orange-400 mt-2">
              ⚠️ Double-check your USDT address before confirming
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/wallet')}
            variant="outline"
            size="mobile"
            className="flex-1 min-h-[44px] touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Wallet
          </Button>
        </div>
      </div>
    </div>
  )
}

export default USDTWithdraw
