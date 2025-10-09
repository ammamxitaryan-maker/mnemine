import { WebSocketServer } from './WebSocketServer.js';

class WebSocketManager {
  private static instance: WebSocketManager;
  private wsServer: WebSocketServer | null = null;

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public setWebSocketServer(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  public async broadcastBalanceUpdate(telegramId: string, balanceData: any) {
    if (this.wsServer) {
      await this.wsServer.broadcastBalanceUpdate(telegramId, balanceData);
    } else {
      console.warn('[WebSocketManager] WebSocket server not initialized');
    }
  }

  public async broadcastSlotUpdate(telegramId: string, slotData: any) {
    if (this.wsServer) {
      await this.wsServer.broadcastSlotUpdate(telegramId, slotData);
    } else {
      console.warn('[WebSocketManager] WebSocket server not initialized');
    }
  }

  public sendNotification(telegramId: string, notification: any) {
    if (this.wsServer) {
      this.wsServer.sendNotification(telegramId, notification);
    } else {
      console.warn('[WebSocketManager] WebSocket server not initialized');
    }
  }

  public sendToUser(telegramId: string, eventType: string, data: any) {
    if (this.wsServer) {
      this.wsServer.sendToUser(telegramId, eventType, data);
    } else {
      console.warn('[WebSocketManager] WebSocket server not initialized');
    }
  }

  public broadcastEarningsUpdate(telegramId: string, earningsData: any) {
    if (this.wsServer) {
      this.wsServer.broadcastEarningsUpdate(telegramId, earningsData);
    } else {
      console.warn('[WebSocketManager] WebSocket server not initialized');
    }
  }
}

export const webSocketManager = WebSocketManager.getInstance();
