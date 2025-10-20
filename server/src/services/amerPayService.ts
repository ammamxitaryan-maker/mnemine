import crypto from 'crypto';

export interface AmerPayConfig {
  token: string;
  baseUrl?: string;
}

export interface AmerPayPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  userId: string;
  returnUrl?: string;
}

export interface AmerPayPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  error?: string;
}

export interface AmerPayWebhookData {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  signature: string;
}

export class AmerPayService {
  private config: AmerPayConfig;
  private baseUrl: string;

  constructor(config: AmerPayConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.amerpay.com';
  }

  /**
   * Create a payment request
   */
  async createPayment(paymentData: AmerPayPaymentRequest): Promise<AmerPayPaymentResponse> {
    try {
      const payload = {
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: paymentData.description,
        order_id: paymentData.orderId,
        user_id: paymentData.userId,
        return_url: paymentData.returnUrl,
        token: this.config.token
      };

      // Create signature for security
      const signature = this.createSignature(payload);
      (payload as { signature?: string }).signature = signature;

      const response = await fetch(`${this.baseUrl}/api/v1/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          paymentUrl: data.payment_url,
          paymentId: data.payment_id
        };
      } else {
        return {
          success: false,
          error: data.error || 'Payment creation failed'
        };
      }
    } catch (error) {
      console.error('[AMERPAY] Payment creation error:', error);
      return {
        success: false,
        error: 'Network error or invalid response'
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(webhookData: AmerPayWebhookData): boolean {
    try {
      const { signature, ...data } = webhookData;
      const expectedSignature = this.createSignature(data);
      return signature === expectedSignature;
    } catch (error) {
      console.error('[AMERPAY] Signature verification error:', error);
      return false;
    }
  }

  /**
   * Process webhook notification
   */
  async processWebhook(webhookData: AmerPayWebhookData): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify signature first
      if (!this.verifyWebhookSignature(webhookData)) {
        return { success: false, error: 'Invalid signature' };
      }

      // Process payment based on status
      switch (webhookData.status) {
        case 'success':
          await this.handleSuccessfulPayment(webhookData);
          break;
        case 'failed':
          await this.handleFailedPayment(webhookData);
          break;
        case 'pending':
          await this.handlePendingPayment(webhookData);
          break;
        default:
          return { success: false, error: 'Unknown payment status' };
      }

      return { success: true };
    } catch (error) {
      console.error('[AMERPAY] Webhook processing error:', error);
      return { success: false, error: 'Webhook processing failed' };
    }
  }

  /**
   * Create signature for request security
   */
  private createSignature(data: Record<string, unknown>): string {
    const sortedKeys = Object.keys(data).sort();
    const stringToSign = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.config.token)
      .update(stringToSign)
      .digest('hex');
  }

  /**
   * Handle successful payment
   */
  private async handleSuccessfulPayment(webhookData: AmerPayWebhookData): Promise<void> {
    console.log(`[AMERPAY] Payment successful: ${webhookData.paymentId} for order ${webhookData.orderId}`);

    try {
      // Import prisma here to avoid circular dependencies
      const { default: prisma } = await import('../prisma.js');

      // Update payment status
      const payment = await prisma.payment.update({
        where: { orderId: webhookData.orderId },
        data: {
          status: 'COMPLETED',
          paymentId: webhookData.paymentId
        },
        include: { user: { include: { wallets: true } } }
      });

      // Add funds to user's wallet
      let wallet = payment.user.wallets.find(w => w.currency === webhookData.currency);

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId: payment.userId,
            currency: webhookData.currency,
            balance: 0
          }
        });
      }

      // Update wallet balance
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance + webhookData.amount
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: payment.userId,
          type: 'DEPOSIT',
          amount: webhookData.amount,
          currency: webhookData.currency,
          description: `Payment via Amer Pay - ${payment.description}`,
          status: 'COMPLETED',
          referenceId: payment.id
        }
      });

      // Update user's total invested
      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          totalInvested: payment.user.totalInvested + webhookData.amount,
          hasMadeDeposit: true,
          lastDepositAt: new Date()
        }
      });

      console.log(`[AMERPAY] Successfully processed payment for user ${payment.user.telegramId}`);
    } catch (error) {
      console.error(`[AMERPAY] Error processing successful payment:`, error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private async handleFailedPayment(webhookData: AmerPayWebhookData): Promise<void> {
    console.log(`[AMERPAY] Payment failed: ${webhookData.paymentId} for order ${webhookData.orderId}`);

    try {
      // Import prisma here to avoid circular dependencies
      const { default: prisma } = await import('../prisma.js');

      // Update payment status
      await prisma.payment.update({
        where: { orderId: webhookData.orderId },
        data: {
          status: 'FAILED',
          paymentId: webhookData.paymentId
        }
      });

      console.log(`[AMERPAY] Payment marked as failed for order ${webhookData.orderId}`);
    } catch (error) {
      console.error(`[AMERPAY] Error processing failed payment:`, error);
      throw error;
    }
  }

  /**
   * Handle pending payment
   */
  private async handlePendingPayment(webhookData: AmerPayWebhookData): Promise<void> {
    console.log(`[AMERPAY] Payment pending: ${webhookData.paymentId} for order ${webhookData.orderId}`);

    try {
      // Import prisma here to avoid circular dependencies
      const { default: prisma } = await import('../prisma.js');

      // Update payment status
      await prisma.payment.update({
        where: { orderId: webhookData.orderId },
        data: {
          status: 'PENDING',
          paymentId: webhookData.paymentId
        }
      });

      console.log(`[AMERPAY] Payment marked as pending for order ${webhookData.orderId}`);
    } catch (error) {
      console.error(`[AMERPAY] Error processing pending payment:`, error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/payments/${paymentId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          status: data.status
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to get payment status'
        };
      }
    } catch (error) {
      console.error('[AMERPAY] Get payment status error:', error);
      return {
        success: false,
        error: 'Network error or invalid response'
      };
    }
  }
}

// Export singleton instance
export const amerPayService = new AmerPayService({
  token: process.env.AMERPAY_TOKEN || '5775769170:LIVE:TG_YvlbVxkUCXho21jfOpgrjsYA'
});
