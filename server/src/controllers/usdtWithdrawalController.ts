import { Request, Response } from 'express'
import prisma from '../prisma.js'
import { USDTWithdrawalRequest, usdtWithdrawalService, USDTWithdrawalWebhookData } from '../services/usdtWithdrawalService.js'
import { sanitizeInput, validateAmount } from '../utils/validation.js'

// POST /api/withdrawals/usdt/create
export const createUSDTWithdrawal = async (req: Request, res: Response) => {
  try {
    const { telegramId, amount, address, description } = req.body

    if (!telegramId || !amount || !address) {
      return res.status(400).json({
        error: 'Missing required fields: telegramId, amount, address'
      })
    }

    if (!validateAmount(amount)) {
      return res.status(400).json({
        error: 'Invalid amount'
      })
    }

    // Find user
    const sanitizedTelegramId = sanitizeInput(telegramId)
    if (!sanitizedTelegramId) {
      return res.status(400).json({ error: 'Invalid telegram ID' })
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: sanitizedTelegramId },
      include: { wallets: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if user has USD wallet with sufficient balance
    let usdWallet = user.wallets.find(w => w.currency === 'USD')
    if (!usdWallet) {
      return res.status(400).json({ error: 'USD wallet not found' })
    }

    if (usdWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient USD balance' })
    }

    // Validate minimum withdrawal amount
    const MINIMUM_USDT_WITHDRAWAL = 10 // $10 minimum
    if (amount < MINIMUM_USDT_WITHDRAWAL) {
      return res.status(400).json({
        error: `Minimum withdrawal amount is $${MINIMUM_USDT_WITHDRAWAL}`
      })
    }

    // Generate unique withdrawal ID
    const withdrawalId = `usdt_withdrawal_${Date.now()}_${user.id}`

    // Create withdrawal record in database
    const withdrawal = await prisma.withdrawal.create({
      data: {
        id: withdrawalId,
        userId: user.id,
        amount: amount,
        currency: 'USDT',
        status: 'PENDING',
        type: 'REGULAR_WITHDRAWAL',
        adminApproved: false
      }
    })

    // Create USDT withdrawal request
    const withdrawalRequest: USDTWithdrawalRequest = {
      amount: amount,
      currency: 'USDT',
      address: address,
      userId: user.id,
      telegramId: user.telegramId,
      description: description || `USDT Withdrawal: ${amount} USD`
    }

    const withdrawalResponse = await usdtWithdrawalService.createWithdrawal(withdrawalRequest)

    if (withdrawalResponse.success) {
      // Update withdrawal record with withdrawal ID
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'PENDING'
        }
      })

      // Deduct amount from user's USD wallet
      await prisma.wallet.update({
        where: { id: usdWallet.id },
        data: {
          balance: { decrement: amount }
        }
      })

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'WITHDRAWAL',
          amount: -amount,
          currency: 'USD',
          description: `USDT Withdrawal initiated: ${amount} USD to ${address}`,
          status: 'PENDING',
          referenceId: withdrawal.id
        }
      })

      res.status(200).json({
        success: true,
        withdrawalId: withdrawalId,
        amount: amount,
        address: address,
        status: 'PENDING',
        message: 'USDT withdrawal initiated successfully'
      })
    } else {
      res.status(400).json({
        success: false,
        error: withdrawalResponse.error || 'Failed to create withdrawal'
      })
    }
  } catch (error) {
    console.error('[USDT_WITHDRAWAL] Create withdrawal error:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
}

// POST /api/withdrawals/usdt/webhook
export const handleUSDTWithdrawalWebhook = async (req: Request, res: Response) => {
  try {
    console.log('[NOWPAYMENTS] Withdrawal webhook received:', JSON.stringify(req.body, null, 2))

    const signature = req.headers['x-nowpayments-sig'] as string
    const payload = JSON.stringify(req.body)

    // Skip signature verification for testing
    console.log('[NOWPAYMENTS] Skipping signature verification for testing')

    const webhookData: USDTWithdrawalWebhookData = req.body
    console.log('[NOWPAYMENTS] Processing withdrawal webhook data:', webhookData)

    // Process the webhook
    const success = await usdtWithdrawalService.processWithdrawalWebhook(webhookData)

    if (success) {
      console.log('[NOWPAYMENTS] Withdrawal webhook processed successfully')
      res.status(200).json({ success: true })
    } else {
      console.log('[NOWPAYMENTS] Withdrawal webhook processing failed')
      res.status(400).json({ success: false, error: 'Failed to process webhook' })
    }
  } catch (error) {
    console.error('[NOWPAYMENTS] Withdrawal webhook error:', error)
    if (error instanceof Error) {
      console.error('[NOWPAYMENTS] Error stack:', error.stack)
      res.status(500).json({ error: 'Internal server error', details: error.message })
    } else {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// GET /api/withdrawals/usdt/status/:withdrawalId
export const getUSDTWithdrawalStatus = async (req: Request, res: Response) => {
  try {
    const { withdrawalId } = req.params

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true }
    })

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' })
    }

    res.status(200).json({
      withdrawalId: withdrawal.id,
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      status: withdrawal.status,
      type: withdrawal.type,
      adminApproved: withdrawal.adminApproved,
      processedAt: withdrawal.processedAt,
      rejectedAt: withdrawal.rejectedAt,
      rejectionReason: withdrawal.rejectionReason,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt
    })
  } catch (error) {
    console.error('[USDT_WITHDRAWAL] Get status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// GET /api/withdrawals/usdt/history/:telegramId
export const getUSDTWithdrawalHistory = async (req: Request, res: Response) => {
  try {
    const { telegramId } = req.params

    const sanitizedTelegramId = sanitizeInput(telegramId)
    if (!sanitizedTelegramId) {
      return res.status(400).json({ error: 'Invalid telegram ID' })
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: sanitizedTelegramId },
      select: { id: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        userId: user.id,
        currency: 'USDT'
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    res.status(200).json(withdrawals)
  } catch (error) {
    console.error('[USDT_WITHDRAWAL] Get history error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// GET /api/withdrawals/usdt/config
export const getUSDTWithdrawalConfig = async (req: Request, res: Response) => {
  try {
    const config = {
      apiKey: process.env.NOWPAYMENTS_API_KEY ? 'Set' : 'Not set',
      ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET ? 'Set' : 'Not set',
      sandboxMode: process.env.NOWPAYMENTS_SANDBOX_MODE === 'true',
      baseUrl: process.env.NOWPAYMENTS_SANDBOX_MODE === 'true'
        ? 'https://api-sandbox.nowpayments.io/v1'
        : 'https://api.nowpayments.io/v1',
      minimumWithdrawal: 10 // $10 minimum
    }

    res.status(200).json(config)
  } catch (error) {
    console.error('[USDT_WITHDRAWAL] Get config error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
