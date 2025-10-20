import { UnifiedWebSocketManager } from '../services/unifiedWebSocketManager.js';
import { WebSocketServer } from './WebSocketServer.js';

class WebSocketManager {
  private static instance: WebSocketManager;
  private wsServer: WebSocketServer | null = null;
  private unifiedManager: UnifiedWebSocketManager;

  private constructor() {
    this.unifiedManager = UnifiedWebSocketManager.getInstance();
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public setWebSocketServer(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
    // Initialize unified manager with the server
    this.unifiedManager.initialize(wsServer as any);
  }

  public async broadcastBalanceUpdate(telegramId: string, balanceData: any) {
    this.unifiedManager.broadcastToUser(telegramId, 'BALANCE_UPDATED', balanceData);
  }

  public async broadcastSlotUpdate(telegramId: string, slotData: any) {
    this.unifiedManager.broadcastToUser(telegramId, 'SLOT_UPDATE', slotData);
  }

  public sendNotification(telegramId: string, notification: any) {
    this.unifiedManager.broadcastToUser(telegramId, 'NOTIFICATION', notification);
  }

  public sendToUser(telegramId: string, eventType: string, data: any) {
    this.unifiedManager.broadcastToUser(telegramId, eventType, data);
  }

  public broadcastEarningsUpdate(telegramId: string, earningsData: any) {
    this.unifiedManager.broadcastToUser(telegramId, 'EARNINGS_UPDATE', earningsData);
  }

  // New methods for enhanced functionality
  public broadcastToSubscribers(subscription: string, eventType: string, data: any) {
    this.unifiedManager.broadcastToSubscribers(subscription, eventType, data);
  }

  public broadcastToAll(eventType: string, data: any) {
    this.unifiedManager.broadcastToAll(eventType, data);
  }

  public isUserOnline(telegramId: string): boolean {
    return this.unifiedManager.isUserOnline(telegramId);
  }

  public getUserConnections(telegramId: string) {
    return this.unifiedManager.getUserConnections(telegramId);
  }

  public getStats() {
    return this.unifiedManager.getStats();
  }
}

export const webSocketManager = WebSocketManager.getInstance();
