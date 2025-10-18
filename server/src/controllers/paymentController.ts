import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { AmerPayPaymentRequest, amerPayService } from '../services/amerPayService.js';

// POST /api/payments/create
export const createPayment = async (req: Request, res: Response) => {
  try {
    const { telegramId, amount, currency = 'USD', description } = req.body;

    if (!telegramId || !amount || !description) {
      return res.status(400).json({
        error: 'Missing required fields: telegramId, amount, description'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { wallets: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${user.id}`;

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        orderId,
        userId: user.id,
        amount,
        currency,
        description,
        status: 'PENDING',
        paymentMethod: 'amerpay'
      }
    });

    // Create Amer Pay payment request
    const paymentRequest: AmerPayPaymentRequest = {
      amount,
      currency,
      description,
      orderId,
      userId: user.telegramId,
      returnUrl: `${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`
    };

    const paymentResponse = await amerPayService.createPayment(paymentRequest);

    if (paymentResponse.success) {
      // Update payment record with payment ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentId: paymentResponse.paymentId,
          paymentUrl: paymentResponse.paymentUrl
        }
      });

      res.status(200).json({
        success: true,
        paymentUrl: paymentResponse.paymentUrl,
        paymentId: paymentResponse.paymentId,
        orderId
      });
    } else {
      // Update payment record as failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });

      res.status(400).json({
        success: false,
        error: paymentResponse.error
      });
    }
  } catch (error) {
    console.error('[PAYMENT] Create payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// POST /api/payments/webhook
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;

    console.log('[PAYMENT] Webhook received:', webhookData);

    // Process webhook
    const result = await amerPayService.processWebhook(webhookData);

    if (result.success) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[PAYMENT] Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
};

// GET /api/payments/status/:orderId
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { user: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.status(200).json({
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      description: payment.description,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    });
  } catch (error) {
    console.error('[PAYMENT] Get payment status error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// GET /api/payments/history/:telegramId
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const { telegramId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const user = await prisma.user.findUnique({
      where: { telegramId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.payment.count({
      where: { userId: user.id }
    });

    res.status(200).json({
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[PAYMENT] Get payment history error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// POST /api/payments/refund
export const refundPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        error: 'Order ID is required'
      });
    }

    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { user: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({
        error: 'Only completed payments can be refunded'
      });
    }

    // Update payment status to refunded
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundReason: reason
      }
    });

    // Remove funds from user's wallet
    const userWallet = await prisma.wallet.findFirst({
      where: {
        userId: payment.userId,
        currency: payment.currency
      }
    });

    if (userWallet) {
      await prisma.wallet.update({
        where: { id: userWallet.id },
        data: {
          balance: Math.max(0, userWallet.balance - payment.amount)
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully'
    });
  } catch (error) {
    console.error('[PAYMENT] Refund error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// POST /api/payments/add-funds
export const addFundsToWallet = async (req: Request, res: Response) => {
  try {
    const { telegramId, amount, currency = 'USD' } = req.body;

    if (!telegramId || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: telegramId, amount'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0'
      });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { wallets: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find or create wallet
    let wallet = user.wallets.find(w => w.currency === currency);

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          currency,
          balance: 0
        }
      });
    }

    // Add funds to wallet
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance + amount
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'DEPOSIT',
        amount,
        currency,
        description: 'Funds added via Amer Pay',
        status: 'COMPLETED'
      }
    });

    res.status(200).json({
      success: true,
      wallet: updatedWallet,
      message: 'Funds added successfully'
    });
  } catch (error) {
    console.error('[PAYMENT] Add funds error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};
