import { Router } from 'express'
import {
  createUSDTWithdrawal,
  getUSDTWithdrawalConfig,
  getUSDTWithdrawalHistory,
  getUSDTWithdrawalStatus,
  handleUSDTWithdrawalWebhook
} from '../controllers/usdtWithdrawalController.js'

const router = Router()

// POST /api/withdrawals/usdt/create
router.post('/usdt/create', createUSDTWithdrawal)

// POST /api/withdrawals/usdt/webhook
router.post('/usdt/webhook', handleUSDTWithdrawalWebhook)

// GET /api/withdrawals/usdt/status/:withdrawalId
router.get('/usdt/status/:withdrawalId', getUSDTWithdrawalStatus)

// GET /api/withdrawals/usdt/history/:telegramId
router.get('/usdt/history/:telegramId', getUSDTWithdrawalHistory)

// GET /api/withdrawals/usdt/config
router.get('/usdt/config', getUSDTWithdrawalConfig)

export default router
