import { Request, Response } from 'express';
import { AdminPayoutService } from '../services/adminPayoutService.js';
import { AdminUserService } from '../services/adminUserService.js';
import { AdminStatsService } from '../services/adminStatsService.js';

// Payout-related endpoints
export const getDailyPayouts = AdminPayoutService.getDailyPayouts;
export const getTodayPayouts = AdminPayoutService.getTodayPayouts;
export const processTodayPayouts = AdminPayoutService.processTodayPayouts;

// User management endpoints
export const getActiveUsers = AdminUserService.getActiveUsers;
export const getInactiveUsers = AdminUserService.getInactiveUsers;
export const freezeAccounts = AdminUserService.freezeAccounts;
export const deleteUser = AdminUserService.deleteUser;
export const deleteAllUsers = AdminUserService.deleteAllUsers;
export const bulkUserActions = AdminUserService.bulkUserActions;

// Statistics and dashboard endpoints
export const getDashboardStats = AdminStatsService.getDashboardStats;
export const resetDatabase = AdminStatsService.resetDatabase;