import crypto from 'crypto'

export interface USDTWithdrawalRequest {
  amount: number // USD amount
  currency: 'USDT'
  address: string // TRC20 USDT address
  userId: string
  telegramId: string
  description?: string
}

export interface USDTWithdrawalResponse {
  success: boolean
  withdrawalId?: string
  transactionHash?: string
  error?: string
}

export interface USDTWithdrawalWebhookData {
  withdrawal_id: string
  order_id: string
  withdrawal_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  amount?: number
  currency?: string
  address?: string
  transaction_hash?: string
  fee?: number
  created_at?: string
  updated_at?: string
}

// NOWPayments Payout API Response interfaces
interface NOWPaymentsPayoutResponse {
  id: string
  order_id: string
  amount: number
  currency: string
  address: string
  status: string
  transaction_hash?: string
  fee?: number
  created_at: string
  updated_at: string
}

interface NOWPaymentsPayoutStatusResponse {
  id: string
  order_id: string
  amount: number
  currency: string
  address: string
  status: string
  transaction_hash?: string
  fee?: number
  created_at: string
  updated_at: string
}

export class USDTWithdrawalService {
  private config: {
    apiKey: string
    ipnSecret: string
    baseUrl: string
    sandboxMode: boolean
  }

  constructor() {
    this.config = {
      apiKey: process.env.NOWPAYMENTS_API_KEY || '',
      ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET || '',
      baseUrl: process.env.NOWPAYMENTS_SANDBOX_MODE === 'true'
        ? 'https://api-sandbox.nowpayments.io/v1'
        : 'https://api.nowpayments.io/v1',
      sandboxMode: process.env.NOWPAYMENTS_SANDBOX_MODE === 'true'
    }
  }

  /**
   * Create a new USDT withdrawal using NOWPayments Payout API
   */
  async createWithdrawal(request: USDTWithdrawalRequest): Promise<USDTWithdrawalResponse> {
    try {
      console.log(`[NOWPAYMENTS] Creating withdrawal for order ${request.userId}, amount: ${request.amount} USD`)

      if (!this.config.apiKey) {
        console.error('[NOWPAYMENTS] API key not configured')
        return {
          success: false,
          error: 'Withdrawal service not configured'
        }
      }

      // Validate USDT TRC20 address format
      if (!this.validateUSDTAddress(request.address)) {
        return {
          success: false,
          error: 'Invalid USDT TRC20 address format'
        }
      }

      // Create withdrawal order ID
      const orderId = `usdt_withdrawal_${Date.now()}_${request.userId}`

      // Use the payout creation endpoint
      const payoutData = {
        amount: request.amount,
        currency: 'usdttrc20', // USDT on TRON network
        address: request.address,
        order_id: orderId,
        description: request.description || `USDT Withdrawal: ${request.amount} USD`,
        ipn_callback_url: `${process.env.BACKEND_URL}/api/withdrawals/usdt/webhook`,
        is_fee_paid_by_user: false
      }

      console.log('[NOWPAYMENTS] Payout data:', payoutData)

      // Make API request to NOWPayments payout creation endpoint
      const response = await fetch(`${this.config.baseUrl}/payout`, {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payoutData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[NOWPAYMENTS] API error:', response.status, errorText)

        let errorMessage = `Withdrawal service error: ${response.status}`
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          // Use default error message
        }

        return {
          success: false,
          error: errorMessage
        }
      }

      const payoutResponse: NOWPaymentsPayoutResponse = await response.json()
      console.log('[NOWPAYMENTS] Withdrawal created:', payoutResponse)

      // Return withdrawal details
      return {
        success: true,
        withdrawalId: payoutResponse.id,
        transactionHash: payoutResponse.transaction_hash
      }

    } catch (error) {
      console.error('[NOWPAYMENTS] Error creating withdrawal:', error)
      return {
        success: false,
        error: 'Failed to create withdrawal'
      }
    }
  }

  /**
   * Get withdrawal details from NOWPayments
   */
  private async getWithdrawalDetails(withdrawalId: string): Promise<NOWPaymentsPayoutStatusResponse | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/payout/${withdrawalId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          console.log('[NOWPAYMENTS] Withdrawal details not yet available (404) - this is normal for newly created withdrawals')
        } else {
          console.error('[NOWPAYMENTS] Failed to get withdrawal details:', response.status)
        }
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('[NOWPAYMENTS] Error getting withdrawal details:', error)
      return null
    }
  }

  /**
   * Verify webhook signature from NOWPayments
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.ipnSecret) {
      console.warn('[NOWPAYMENTS] IPN secret not configured, skipping signature verification')
      return true // Allow in development mode
    }

    if (!signature) {
      console.warn('[NOWPAYMENTS] No signature provided, skipping verification')
      return true // Allow in development mode
    }

    try {
      // Parse payload and sort parameters alphabetically
      const payloadObj = JSON.parse(payload)
      const sortedPayload = JSON.stringify(payloadObj, Object.keys(payloadObj).sort())

      // Create HMAC using SHA-512 (as per NOWPayments documentation)
      const expectedSignature = crypto
        .createHmac('sha512', this.config.ipnSecret)
        .update(sortedPayload)
        .digest('hex')

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    } catch (error) {
      console.error('[NOWPAYMENTS] Error verifying signature:', error)
      return false
    }
  }

  /**
   * Process webhook notification from NOWPayments for withdrawals
   */
  async processWithdrawalWebhook(webhookData: USDTWithdrawalWebhookData): Promise<boolean> {
    try {
      console.log(`[NOWPAYMENTS] Processing withdrawal webhook for ${webhookData.withdrawal_id}, status: ${webhookData.withdrawal_status}`)

      // Import prisma here to avoid circular dependencies
      const { default: prisma } = await import('../prisma.js')

      // Find the withdrawal record
      const withdrawal = await prisma.withdrawal.findUnique({
        where: { id: webhookData.order_id },
        include: { user: { include: { wallets: true } } }
      })

      if (!withdrawal) {
        console.error(`[NOWPAYMENTS] Withdrawal not found for order ${webhookData.order_id}`)
        return false
      }

      // Handle different withdrawal statuses
      if (webhookData.withdrawal_status === 'completed') {
        if (withdrawal.status === 'PROCESSED') {
          console.log(`[NOWPAYMENTS] Withdrawal ${webhookData.withdrawal_id} already processed`)
          return true
        }

        await prisma.$transaction(async (tx) => {
          // Update withdrawal status
          await tx.withdrawal.update({
            where: { id: webhookData.order_id },
            data: {
              status: 'PROCESSED',
              processedAt: new Date(),
              adminApproved: true
            }
          })

          // Create transaction record
          await tx.transaction.create({
            data: {
              userId: withdrawal.userId,
              type: 'WITHDRAWAL',
              amount: -withdrawal.amount,
              currency: 'USDT',
              description: `USDT Withdrawal: ${withdrawal.amount} USDT to ${webhookData.address || 'USDT address'}`,
              status: 'COMPLETED',
              referenceId: withdrawal.id
            }
          })
        })

        console.log(`[NOWPAYMENTS] Successfully processed withdrawal ${webhookData.withdrawal_id}: ${withdrawal.amount} USDT`)
        return true

      } else if (webhookData.withdrawal_status === 'failed' || webhookData.withdrawal_status === 'cancelled') {
        // Update withdrawal status to failed and refund the amount
        await prisma.$transaction(async (tx) => {
          // Update withdrawal status
          await tx.withdrawal.update({
            where: { id: webhookData.order_id },
            data: {
              status: 'REJECTED',
              rejectedAt: new Date(),
              rejectionReason: `Withdrawal failed: ${webhookData.withdrawal_status}`
            }
          })

          // Refund the amount back to user's USD wallet
          let usdWallet = withdrawal.user.wallets.find(w => w.currency === 'USD')
          if (!usdWallet) {
            usdWallet = await tx.wallet.create({
              data: {
                userId: withdrawal.userId,
                currency: 'USD',
                balance: 0
              }
            })
          }

          // Refund the amount
          await tx.wallet.update({
            where: { id: usdWallet.id },
            data: {
              balance: { increment: withdrawal.amount }
            }
          })

          // Create refund transaction record
          await tx.transaction.create({
            data: {
              userId: withdrawal.userId,
              type: 'DEPOSIT',
              amount: withdrawal.amount,
              currency: 'USD',
              description: `USDT Withdrawal refund: ${withdrawal.amount} USD`,
              status: 'COMPLETED',
              referenceId: withdrawal.id
            }
          })
        })

        console.log(`[NOWPAYMENTS] Withdrawal ${webhookData.withdrawal_id} failed, amount refunded`)
        return true
      }

      // For other statuses (pending, processing), just log and return true
      console.log(`[NOWPAYMENTS] Withdrawal ${webhookData.withdrawal_id} status: ${webhookData.withdrawal_status}`)
      return true

    } catch (error) {
      console.error('[NOWPAYMENTS] Error processing withdrawal webhook:', error)
      return false
    }
  }

  /**
   * Get withdrawal status from NOWPayments
   */
  async getWithdrawalStatus(withdrawalId: string): Promise<{ status: string; amount?: number; transactionHash?: string }> {
    try {
      const withdrawalDetails = await this.getWithdrawalDetails(withdrawalId)

      if (!withdrawalDetails) {
        return { status: 'unknown' }
      }

      return {
        status: withdrawalDetails.status,
        amount: withdrawalDetails.amount,
        transactionHash: withdrawalDetails.transaction_hash
      }
    } catch (error) {
      console.error('[NOWPAYMENTS] Error getting withdrawal status:', error)
      return { status: 'unknown' }
    }
  }

  /**
   * Validate USDT TRC20 address format
   */
  private validateUSDTAddress(address: string): boolean {
    // TRC20 addresses start with 'T' and are 34 characters long
    const trc20Regex = /^T[A-Za-z1-9]{33}$/
    return trc20Regex.test(address)
  }
}

export const usdtWithdrawalService = new USDTWithdrawalService()
