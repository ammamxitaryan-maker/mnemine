import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { getProcessingMetrics, getProcessingStats, processExpiredSlotsOptimized } from '../utils/slotProcessorOptimized.js';

// GET /api/admin/processing/metrics
export const getProcessingMetricsController = async (req: Request, res: Response) => {
  try {
    const metrics = await getProcessingMetrics();
    const stats = await getProcessingStats();
    
    res.status(200).json({
      success: true,
      data: {
        lastHour: metrics,
        lastDay: stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching processing metrics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch processing metrics' 
    });
  }
};

// POST /api/admin/processing/run-manual
export const runManualProcessing = async (req: Request, res: Response) => {
  try {
    console.log('🔄 Manual slot processing triggered by admin');
    
    const stats = await processExpiredSlotsOptimized();
    
    res.status(200).json({
      success: true,
      message: 'Manual processing completed',
      data: {
        totalSlots: stats.totalSlots,
        processedSlots: stats.processedSlots,
        failedSlots: stats.failedSlots,
        processingTimeMs: stats.processingTimeMs,
        batchesProcessed: stats.batchesProcessed,
        errors: stats.errors
      }
    });
  } catch (error) {
    console.error('Error in manual processing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Manual processing failed' 
    });
  }
};

// GET /api/admin/processing/status
export const getProcessingStatus = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Получаем количество активных слотов
    const activeSlotsCount = await prisma.miningSlot.count({
      where: { isActive: true }
    });
    
    // Получаем количество истекших слотов
    const expiredSlotsCount = await prisma.miningSlot.count({
      where: {
        isActive: true,
        expiresAt: { lte: now }
      }
    });
    
    // Получаем количество слотов, истекающих в ближайший час
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const expiringSoonCount = await prisma.miningSlot.count({
      where: {
        isActive: true,
        expiresAt: { 
          gte: now,
          lte: oneHourFromNow
        }
      }
    });
    
    // Получаем статистику обработки за последний час
    const recentProcessing = await prisma.activityLog.count({
      where: {
        type: 'CLAIM',
        createdAt: { gte: oneHourAgo },
        description: { contains: 'Automatic slot closure' }
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        activeSlots: activeSlotsCount,
        expiredSlots: expiredSlotsCount,
        expiringSoon: expiringSoonCount,
        processedLastHour: recentProcessing,
        systemStatus: expiredSlotsCount > 0 ? 'pending' : 'up_to_date',
        timestamp: now.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching processing status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch processing status' 
    });
  }
};

// GET /api/admin/processing/queue
export const getProcessingQueue = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const now = new Date();
    const expiredSlots = await prisma.miningSlot.findMany({
      where: {
        isActive: true,
        expiresAt: { lte: now }
      },
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true
          }
        }
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { expiresAt: 'asc' }
    });
    
    const totalCount = await prisma.miningSlot.count({
      where: {
        isActive: true,
        expiresAt: { lte: now }
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        slots: expiredSlots.map(slot => ({
          id: slot.id,
          userId: slot.userId,
          user: slot.user,
          principal: slot.principal,
          rate: slot.effectiveWeeklyRate,
          expiresAt: slot.expiresAt,
          isLocked: slot.isLocked,
          type: slot.type,
          hoursOverdue: Math.max(0, (now.getTime() - slot.expiresAt.getTime()) / (1000 * 60 * 60))
        })),
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: totalCount > parseInt(offset as string) + parseInt(limit as string)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching processing queue:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch processing queue' 
    });
  }
};
