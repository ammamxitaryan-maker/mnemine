import crypto from 'crypto';

export interface USDTPaymentRequest {
  amount: number; // USD amount
  currency: 'USDT';
  orderId: string;
  userId: string;
  telegramId: string;
  returnUrl: string;
  description?: string;
}

export interface USDTPaymentResponse {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  usdtAddress?: string;
  usdtAmount?: number;
  qrCode?: string;
  error?: string;
}

export interface USDTWebhookData {
  payment_id: string;
  order_id: string;
  payment_status: 'waiting' | 'confirming' | 'confirmed' | 'sending' | 'partially_paid' | 'finished' | 'failed' | 'refunded' | 'expired';
  pay_address?: string;
  price_amount?: number;
  price_currency?: string;
  pay_amount?: number;
  pay_currency?: string;
  order_description?: string;
  purchase_id?: string;
  outcome_amount?: number;
  outcome_currency?: string;
  payin_extra_id?: string;
  smart_contract?: string;
  network?: string;
  network_precision?: number;
  time_limit?: string;
  burning_percent?: number;
  expiration_estimate_date?: string;
  is_fixed_rate?: boolean;
  is_fee_paid_by_user?: boolean;
  valid_until?: string;
  type?: string;
  created_at?: string;
  updated_at?: string;
}

// NOWPayments API Response interfaces
interface NOWPaymentsInvoiceResponse {
  id: string;
  token_id: string;
  order_id: string;
  order_description: string;
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  ipn_callback_url: string;
  invoice_url: string;
  success_url: string;
  cancel_url: string;
  created_at: string;
  updated_at: string;
}

interface NOWPaymentsPaymentStatusResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  outcome_amount: number;
  outcome_currency: string;
  payin_extra_id: string;
  smart_contract: string;
  network: string;
  network_precision: number;
  time_limit: string;
  burning_percent: number;
  expiration_estimate_date: string;
  is_fixed_rate: boolean;
  is_fee_paid_by_user: boolean;
  valid_until: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export class USDTPaymentService {
  private config: {
    apiKey: string;
    ipnSecret: string;
    baseUrl: string;
    sandboxMode: boolean;
  };

  constructor() {
    this.config = {
      apiKey: process.env.NOWPAYMENTS_API_KEY || '',
      ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET || '',
      baseUrl: process.env.NOWPAYMENTS_SANDBOX_MODE === 'true'
        ? 'https://api-sandbox.nowpayments.io/v1'
        : 'https://api.nowpayments.io/v1',
      sandboxMode: process.env.NOWPAYMENTS_SANDBOX_MODE === 'true'
    };
  }

  /**
   * Create a new USDT payment using NOWPayments API
   */
  async createPayment(request: USDTPaymentRequest): Promise<USDTPaymentResponse> {
    try {
      console.log(`[NOWPAYMENTS] Creating payment for order ${request.orderId}, amount: ${request.amount} USD`);

      if (!this.config.apiKey) {
        console.error('[NOWPAYMENTS] API key not configured');
        return {
          success: false,
          error: 'Payment service not configured'
        };
      }

      // Prepare NOWPayments invoice request
      const invoiceData = {
        price_amount: request.amount,
        price_currency: 'usd',
        pay_currency: 'usdttrc20', // USDT on TRON network
        order_id: request.orderId,
        order_description: request.description || `MNE Purchase: ${request.amount} USD`,
        ipn_callback_url: `${process.env.BACKEND_URL}/api/payments/usdt/webhook`,
        success_url: request.returnUrl,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?orderId=${request.orderId}`
      };

      console.log('[NOWPAYMENTS] Invoice data:', invoiceData);

      // Make API request to NOWPayments
      const response = await fetch(`${this.config.baseUrl}/invoice`, {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[NOWPAYMENTS] API error:', response.status, errorText);
        return {
          success: false,
          error: `Payment service error: ${response.status}`
        };
      }

      const invoiceResponse: NOWPaymentsInvoiceResponse = await response.json();
      console.log('[NOWPAYMENTS] Invoice created:', invoiceResponse);

      // Get payment details
      const paymentDetails = await this.getPaymentDetails(invoiceResponse.id);

      if (!paymentDetails) {
        return {
          success: false,
          error: 'Failed to get payment details'
        };
      }

      return {
        success: true,
        paymentId: invoiceResponse.id,
        paymentUrl: invoiceResponse.invoice_url,
        usdtAddress: paymentDetails.pay_address,
        usdtAmount: paymentDetails.pay_amount,
        qrCode: `usdt:${paymentDetails.pay_address}?amount=${paymentDetails.pay_amount}&memo=${request.orderId}`
      };

    } catch (error) {
      console.error('[NOWPAYMENTS] Error creating payment:', error);
      return {
        success: false,
        error: 'Failed to create payment'
      };
    }
  }

  /**
   * Get payment details from NOWPayments
   */
  private async getPaymentDetails(paymentId: string): Promise<NOWPaymentsPaymentStatusResponse | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/payment/${paymentId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('[NOWPAYMENTS] Failed to get payment details:', response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[NOWPAYMENTS] Error getting payment details:', error);
      return null;
    }
  }

  /**
   * Verify webhook signature from NOWPayments
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.ipnSecret) {
      console.warn('[NOWPAYMENTS] IPN secret not configured, skipping signature verification');
      return true; // Allow in development mode
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.config.ipnSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Process webhook notification from NOWPayments
   */
  async processWebhook(webhookData: USDTWebhookData): Promise<boolean> {
    try {
      console.log(`[NOWPAYMENTS] Processing webhook for payment ${webhookData.payment_id}, status: ${webhookData.payment_status}`);

      // Import prisma here to avoid circular dependencies
      const { default: prisma } = await import('../prisma.js');

      // Find the payment record
      const payment = await prisma.payment.findUnique({
        where: { orderId: webhookData.order_id },
        include: { user: { include: { wallets: true } } }
      });

      if (!payment) {
        console.error(`[NOWPAYMENTS] Payment not found for order ${webhookData.order_id}`);
        return false;
      }

      // Handle different payment statuses
      if (webhookData.payment_status === 'finished') {
        if (payment.status === 'COMPLETED') {
          console.log(`[NOWPAYMENTS] Payment ${webhookData.payment_id} already processed`);
          return true;
        }

        const result = await prisma.$transaction(async (tx) => {
          // Update payment status
          await tx.payment.update({
            where: { orderId: webhookData.order_id },
            data: {
              status: 'COMPLETED',
              paymentId: webhookData.payment_id,
              transactionHash: webhookData.payin_extra_id || webhookData.smart_contract
            }
          });

          // Get current exchange rate for MNE conversion
          const exchangeRate = await tx.exchangeRate.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
          });

          if (!exchangeRate) {
            throw new Error('Exchange rate not available');
          }

          // Convert USD amount to MNE using exchange rate
          const mneAmount = (webhookData.price_amount || 0) * exchangeRate.rate;

          // Add MNE to user's wallet
          let mneWallet = payment.user.wallets.find(w => w.currency === 'MNE');

          if (!mneWallet) {
            mneWallet = await tx.wallet.create({
              data: {
                userId: payment.userId,
                currency: 'MNE',
                balance: 0
              }
            });
          }

          // Update MNE balance
          await tx.wallet.update({
            where: { id: mneWallet.id },
            data: {
              balance: { increment: mneAmount }
            }
          });

          // Create transaction record
          await tx.transaction.create({
            data: {
              userId: payment.userId,
              type: 'DEPOSIT',
              amount: mneAmount,
              currency: 'MNE',
              description: `USDT Payment: ${webhookData.price_amount || 0} USD converted to ${mneAmount.toFixed(6)} MNE`,
              status: 'COMPLETED',
              referenceId: payment.id
            }
          });

          // Update user's total invested
          await tx.user.update({
            where: { id: payment.userId },
            data: {
              totalInvested: { increment: webhookData.price_amount || 0 },
              hasMadeDeposit: true,
              lastDepositAt: new Date()
            }
          });

          return { mneAmount, exchangeRate };
        });

        console.log(`[NOWPAYMENTS] Successfully processed payment ${webhookData.payment_id}: ${webhookData.price_amount || 0} USD -> ${result.mneAmount.toFixed(6)} MNE`);
        return true;

      } else if (webhookData.payment_status === 'failed' || webhookData.payment_status === 'expired') {
        // Update payment status to failed
        await prisma.payment.update({
          where: { orderId: webhookData.order_id },
          data: {
            status: 'FAILED',
            paymentId: webhookData.payment_id
          }
        });

        console.log(`[NOWPAYMENTS] Payment ${webhookData.payment_id} failed or expired`);
        return true;
      }

      // For other statuses (waiting, confirming, etc.), just log and return true
      console.log(`[NOWPAYMENTS] Payment ${webhookData.payment_id} status: ${webhookData.payment_status}`);
      return true;

    } catch (error) {
      console.error('[NOWPAYMENTS] Error processing webhook:', error);
      return false;
    }
  }

  /**
   * Get payment status from NOWPayments
   */
  async getPaymentStatus(paymentId: string): Promise<{ status: string; amount?: number; transactionHash?: string }> {
    try {
      const paymentDetails = await this.getPaymentDetails(paymentId);

      if (!paymentDetails) {
        return { status: 'unknown' };
      }

      return {
        status: paymentDetails.payment_status,
        amount: paymentDetails.price_amount,
        transactionHash: paymentDetails.payin_extra_id || paymentDetails.smart_contract
      };
    } catch (error) {
      console.error('[NOWPAYMENTS] Error getting payment status:', error);
      return { status: 'unknown' };
    }
  }
}

export const usdtPaymentService = new USDTPaymentService();
