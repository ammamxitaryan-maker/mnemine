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
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  transactionHash?: string;
  timestamp: string;
}

export class USDTPaymentService {
  private config: {
    apiKey: string;
    apiSecret: string;
    baseUrl: string;
    merchantId: string;
    webhookSecret: string;
  };

  constructor() {
    this.config = {
      apiKey: process.env.USDT_PAYMENT_API_KEY || 'demo_api_key',
      apiSecret: process.env.USDT_PAYMENT_API_SECRET || 'demo_api_secret',
      baseUrl: process.env.USDT_PAYMENT_BASE_URL || 'https://api.usdtpayment.com',
      merchantId: process.env.USDT_PAYMENT_MERCHANT_ID || 'demo_merchant',
      webhookSecret: process.env.USDT_PAYMENT_WEBHOOK_SECRET || 'demo_webhook_secret'
    };
  }

  /**
   * Create a new USDT payment
   */
  async createPayment(request: USDTPaymentRequest): Promise<USDTPaymentResponse> {
    try {
      console.log(`[USDT_PAYMENT] Creating payment for order ${request.orderId}, amount: ${request.amount} USDT`);

      // In a real implementation, this would call the actual payment service API
      // For now, we'll simulate the response
      const paymentId = `usdt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Generate a mock USDT address (in real implementation, this comes from the payment service)
      const usdtAddress = this.generateMockUSDTAddress();

      // Calculate USDT amount (1 USD = 1 USDT for simplicity)
      const usdtAmount = request.amount;

      // Generate QR code data
      const qrCodeData = `usdt:${usdtAddress}?amount=${usdtAmount}&memo=${request.orderId}`;

      return {
        success: true,
        paymentId,
        usdtAddress,
        usdtAmount,
        qrCode: qrCodeData,
        paymentUrl: `${this.config.baseUrl}/payment/${paymentId}`
      };

    } catch (error) {
      console.error('[USDT_PAYMENT] Error creating payment:', error);
      return {
        success: false,
        error: 'Failed to create payment'
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Process webhook notification
   */
  async processWebhook(webhookData: USDTWebhookData): Promise<boolean> {
    try {
      console.log(`[USDT_PAYMENT] Processing webhook for payment ${webhookData.paymentId}, status: ${webhookData.status}`);

      if (webhookData.status === 'completed') {
        // Import prisma here to avoid circular dependencies
        const { default: prisma } = await import('../prisma.js');

        // Find the payment record
        const payment = await prisma.payment.findUnique({
          where: { orderId: webhookData.orderId },
          include: { user: { include: { wallets: true } } }
        });

        if (!payment) {
          console.error(`[USDT_PAYMENT] Payment not found for order ${webhookData.orderId}`);
          return false;
        }

        if (payment.status === 'COMPLETED') {
          console.log(`[USDT_PAYMENT] Payment ${webhookData.paymentId} already processed`);
          return true;
        }

        // Update payment status
        await prisma.payment.update({
          where: { orderId: webhookData.orderId },
          data: {
            status: 'COMPLETED',
            paymentId: webhookData.paymentId,
            transactionHash: webhookData.transactionHash
          }
        });

        // Get current exchange rate for MNE conversion
        const exchangeRate = await prisma.exchangeRate.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        });

        if (!exchangeRate) {
          console.error('[USDT_PAYMENT] Exchange rate not available');
          return false;
        }

        // Convert USDT amount to MNE using exchange rate
        const mneAmount = webhookData.amount * exchangeRate.rate;

        // Add MNE to user's wallet
        let mneWallet = payment.user.wallets.find(w => w.currency === 'MNE');

        if (!mneWallet) {
          mneWallet = await prisma.wallet.create({
            data: {
              userId: payment.userId,
              currency: 'MNE',
              balance: 0
            }
          });
        }

        // Update MNE balance
        await prisma.wallet.update({
          where: { id: mneWallet.id },
          data: {
            balance: { increment: mneAmount }
          }
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId: payment.userId,
            type: 'DEPOSIT',
            amount: mneAmount,
            currency: 'MNE',
            description: `USDT Payment: ${webhookData.amount} USDT converted to ${mneAmount.toFixed(6)} MNE`,
            status: 'COMPLETED',
            referenceId: payment.id
          }
        });

        // Update user's total invested
        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            totalInvested: { increment: webhookData.amount },
            hasMadeDeposit: true,
            lastDepositAt: new Date()
          }
        });

        console.log(`[USDT_PAYMENT] Successfully processed payment ${webhookData.paymentId}: ${webhookData.amount} USDT -> ${mneAmount.toFixed(6)} MNE`);
        return true;

      } else if (webhookData.status === 'failed' || webhookData.status === 'expired') {
        // Update payment status to failed
        const { default: prisma } = await import('../prisma.js');

        await prisma.payment.update({
          where: { orderId: webhookData.orderId },
          data: {
            status: 'FAILED',
            paymentId: webhookData.paymentId
          }
        });

        console.log(`[USDT_PAYMENT] Payment ${webhookData.paymentId} failed or expired`);
        return true;
      }

      return true;
    } catch (error) {
      console.error('[USDT_PAYMENT] Error processing webhook:', error);
      return false;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<{ status: string; amount?: number; transactionHash?: string }> {
    try {
      // In a real implementation, this would query the payment service API
      // For demo purposes, we'll return a mock status
      return {
        status: 'completed',
        amount: 100,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
      };
    } catch (error) {
      console.error('[USDT_PAYMENT] Error getting payment status:', error);
      return { status: 'unknown' };
    }
  }

  /**
   * Generate a mock USDT address for demo purposes
   */
  private generateMockUSDTAddress(): string {
    // Generate a mock TRC20 USDT address
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let address = 'T';
    for (let i = 0; i < 33; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return address;
  }
}

export const usdtPaymentService = new USDTPaymentService();
