import { Request, Response } from 'express';
import { SlotManagementService } from '../services/slotManagementService.js';
import { SlotEarningsService } from '../services/slotEarningsService.js';

// Slot management endpoints
export const getUserSlots = SlotManagementService.getUserSlots;
export const buyNewSlot = SlotManagementService.buyNewSlot;
export const extendSlot = SlotManagementService.extendSlot;
export const upgradeSlot = SlotManagementService.upgradeSlot;
export const createInvestmentSlot = SlotManagementService.createInvestmentSlot;
export const getUserInvestmentSlots = SlotManagementService.getUserInvestmentSlots;

// Earnings-related endpoints
export const getRealTimeIncome = SlotEarningsService.getRealTimeIncome;
export const getUserAccruedEarnings = SlotEarningsService.getUserAccruedEarnings;
export const claimEarnings = SlotEarningsService.claimEarnings;
export const claimCompletedSlot = SlotEarningsService.claimCompletedSlot;

// Background processing
export const processExpiredSlots = SlotEarningsService.processExpiredSlots;