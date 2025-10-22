import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { USDTPaymentRequest, usdtPaymentService, USDTWebhookData } from '../services/usdtPaymentService.js';
import { sanitizeInput, validateAmount } from '../utils/validation.js';

// POST /api/payments/usdt/create
export const createUSDTPayment = async (req: Request, res: Response) => {
  try {
    const { telegramId, mneAmount, description } = req.body;

    if (!telegramId || !mneAmount) {
      return res.status(400).json({
        error: 'Missing required fields: telegramId, mneAmount'
      });
    }

    if (!validateAmount(mneAmount)) {
      return res.status(400).json({
        error: 'Invalid NON amount'
      });
    }

    // Find user
    const sanitizedTelegramId = sanitizeInput(telegramId);
    if (!sanitizedTelegramId) {
      return res.status(400).json({ error: 'Invalid telegram ID' });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: sanitizedTelegramId },
      include: { wallets: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current exchange rate
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!exchangeRate) {
      return res.status(400).json({ error: 'Exchange rate not available' });
    }

    // Convert NON to USD (USDT amount) for NOWPayments
    const usdtAmount = mneAmount * exchangeRate.rate;

    // Generate unique order ID
    const orderId = `usdt_${Date.now()}_${user.id}`;

    // Create payment record in database (USD for NOWPayments, but will credit NON)
    const payment = await prisma.payment.create({
      data: {
        orderId,
        userId: user.id,
        amount: usdtAmount, // USD amount for NOWPayments
        currency: 'USDT',
        description: description || `NON Purchase: ${mneAmount.toFixed(6)} NON`,
        status: 'PENDING',
        paymentMethod: 'usdt'
      }
    });

    // Create USDT payment request
    const paymentRequest: USDTPaymentRequest = {
      amount: usdtAmount,
      currency: 'USDT',
      orderId,
      userId: user.id,
      telegramId: user.telegramId,
      returnUrl: `${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`,
      description: description || `NON Purchase: ${mneAmount.toFixed(6)} NON`
    };

    const paymentResponse = await usdtPaymentService.createPayment(paymentRequest);

    if (paymentResponse.success) {
      // Update payment record with payment ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentId: paymentResponse.paymentId,
          metadata: {
            usdtAddress: paymentResponse.usdtAddress,
            usdtAmount: paymentResponse.usdtAmount,
            qrCode: paymentResponse.qrCode,
            mneAmount: mneAmount,
            exchangeRate: exchangeRate.rate
          }
        }
      });

      res.status(200).json({
        success: true,
        paymentId: paymentResponse.paymentId,
        orderId,
        usdtAddress: paymentResponse.usdtAddress,
        usdtAmount: paymentResponse.usdtAmount,
        mneAmount: mneAmount,
        exchangeRate: exchangeRate.rate,
        qrCode: paymentResponse.qrCode,
        paymentUrl: paymentResponse.paymentUrl,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      });
    } else {
      res.status(400).json({
        success: false,
        error: paymentResponse.error || 'Failed to create payment'
      });
    }
  } catch (error) {
    console.error('[USDT_PAYMENT] Create payment error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// POST /api/payments/usdt/webhook
export const handleUSDTWebhook = async (req: Request, res: Response) => {
  try {
    console.log('[NOWPAYMENTS] Webhook received:', JSON.stringify(req.body, null, 2));

    const signature = req.headers['x-nowpayments-sig'] as string;
    const payload = JSON.stringify(req.body);

    // Skip signature verification for testing
    console.log('[NOWPAYMENTS] Skipping signature verification for testing');

    const webhookData: USDTWebhookData = req.body;
    console.log('[NOWPAYMENTS] Processing webhook data:', webhookData);

    // Process the webhook
    const success = await usdtPaymentService.processWebhook(webhookData);

    if (success) {
      console.log('[NOWPAYMENTS] Webhook processed successfully');
      res.status(200).json({ success: true });
    } else {
      console.log('[NOWPAYMENTS] Webhook processing failed');
      res.status(400).json({ success: false, error: 'Failed to process webhook' });
    }
  } catch (error) {
    console.error('[NOWPAYMENTS] Webhook error:', error);
    if (error instanceof Error) {
      console.error('[NOWPAYMENTS] Error stack:', error.stack);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// GET /api/payments/usdt/status/:paymentId
export const getUSDTPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { paymentId },
      include: { user: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Get status from payment service
    const status = await usdtPaymentService.getPaymentStatus(paymentId);

    res.status(200).json({
      paymentId,
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt,
      metadata: payment.metadata,
      serviceStatus: status
    });
  } catch (error) {
    console.error('[USDT_PAYMENT] Get status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/payments/usdt/history/:telegramId
export const getUSDTPaymentHistory = async (req: Request, res: Response) => {
  try {
    const { telegramId } = req.params;

    const sanitizedTelegramId = sanitizeInput(telegramId);
    if (!sanitizedTelegramId) {
      return res.status(400).json({ error: 'Invalid telegram ID' });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: sanitizedTelegramId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const payments = await prisma.payment.findMany({
      where: {
        userId: user.id,
        paymentMethod: 'usdt'
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.status(200).json(payments);
  } catch (error) {
    console.error('[USDT_PAYMENT] Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/payments/usdt/config
export const getUSDTConfig = async (req: Request, res: Response) => {
  try {
    const config = {
      apiKey: process.env.NOWPAYMENTS_API_KEY ? 'Set' : 'Not set',
      ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET ? 'Set' : 'Not set',
      sandboxMode: process.env.NOWPAYMENTS_SANDBOX_MODE === 'true',
      baseUrl: process.env.NOWPAYMENTS_SANDBOX_MODE === 'true'
        ? 'https://api-sandbox.nowpayments.io/v1'
        : 'https://api.nowpayments.io/v1'
    };

    res.status(200).json(config);
  } catch (error) {
    console.error('[USDT_PAYMENT] Get config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
