/**
 * Centralized WebSocket event handlers for balance updates
 * Eliminates duplication of balance event handling logic across components
 */

import React from 'react';

export interface BalanceUpdateEvent {
  telegramId: string;
  newBalance: number;
  previousBalance: number;
  changeAmount: number;
  action?: string;
  timestamp: string;
  currency?: string;
}

export interface BalanceEventHandlers {
  onBalanceUpdated: (event: CustomEvent<BalanceUpdateEvent>) => void;
  onUserDataRefresh: (event: CustomEvent<{ telegramId: string }>) => void;
  onGlobalDataRefresh: () => void;
  onUserDataUpdated: (event: CustomEvent<{ telegramId: string }>) => void;
}

export interface UseBalanceEventHandlersOptions {
  telegramId?: string;
  onBalanceUpdate?: (event: BalanceUpdateEvent) => void;
  onUserDataRefresh?: (telegramId: string) => void;
  onGlobalRefresh?: () => void;
  onUserDataUpdated?: (telegramId: string) => void;
  enableWebSocket?: boolean;
  enableCustomEvents?: boolean;
}

/**
 * Centralized hook for handling balance-related events
 * @param options Configuration options
 * @returns Event handlers and cleanup function
 */
export const useBalanceEventHandlers = (options: UseBalanceEventHandlersOptions = {}) => {
  const {
    telegramId,
    onBalanceUpdate,
    onUserDataRefresh,
    onGlobalRefresh,
    onUserDataUpdated,
    enableWebSocket = true,
    enableCustomEvents = true
  } = options;

  const [forceRefresh, setForceRefresh] = React.useState(0);

  // WebSocket message handler
  const handleWebSocketMessage = React.useCallback((event: MessageEvent) => {
    if (!enableWebSocket) return;

    try {
      const data = JSON.parse(event.data);

      if (data.type === 'BALANCE_UPDATED' && data.data) {
        const balanceEvent: BalanceUpdateEvent = {
          telegramId: data.data.telegramId,
          newBalance: data.data.newBalance,
          previousBalance: data.data.previousBalance,
          changeAmount: data.data.changeAmount,
          action: data.data.action,
          timestamp: data.data.timestamp,
          currency: data.data.currency
        };

        // Check if this event is for the current user
        if (!telegramId || data.data.telegramId === telegramId) {
          console.log('[BalanceEventHandlers] WebSocket balance update received:', balanceEvent);

          // Trigger force refresh
          setForceRefresh(prev => prev + 1);

          // Call custom handler if provided
          if (onBalanceUpdate) {
            onBalanceUpdate(balanceEvent);
          }

          // Dispatch custom event for other components
          if (enableCustomEvents) {
            window.dispatchEvent(new CustomEvent('balanceUpdated', {
              detail: balanceEvent
            }));
          }
        }
      }
    } catch (error) {
      // Ignore non-JSON messages
      console.debug('[BalanceEventHandlers] Ignoring non-JSON WebSocket message');
    }
  }, [telegramId, onBalanceUpdate, enableWebSocket, enableCustomEvents]);

  // Custom event handlers
  const handleBalanceUpdated = React.useCallback((event: CustomEvent<BalanceUpdateEvent>) => {
    if (!enableCustomEvents) return;

    console.log('[BalanceEventHandlers] Received balanceUpdated event:', event.detail);

    if (!telegramId || event.detail?.telegramId === telegramId) {
      console.log(`[BalanceEventHandlers] Balance updated for user ${telegramId}, forcing refresh`);
      console.log(`[BalanceEventHandlers] New balance: ${event.detail?.newBalance}, Previous: ${event.detail?.previousBalance}, Change: ${event.detail?.changeAmount}`);

      setForceRefresh(prev => prev + 1);

      if (onBalanceUpdate) {
        onBalanceUpdate(event.detail);
      }
    }
  }, [telegramId, onBalanceUpdate, enableCustomEvents]);

  const handleUserDataRefresh = React.useCallback((event: CustomEvent<{ telegramId: string }>) => {
    if (!enableCustomEvents) return;

    console.log('[BalanceEventHandlers] Received userDataRefresh event:', event.detail);

    if (!telegramId || event.detail?.telegramId === telegramId) {
      console.log(`[BalanceEventHandlers] User data refresh for user ${telegramId}, forcing refresh`);

      setForceRefresh(prev => prev + 1);

      if (onUserDataRefresh) {
        onUserDataRefresh(event.detail.telegramId);
      }
    }
  }, [telegramId, onUserDataRefresh, enableCustomEvents]);

  const handleGlobalRefresh = React.useCallback(() => {
    if (!enableCustomEvents) return;

    console.log('[BalanceEventHandlers] Received globalDataRefresh event, forcing refresh for user', telegramId);

    setForceRefresh(prev => prev + 1);

    if (onGlobalRefresh) {
      onGlobalRefresh();
    }
  }, [telegramId, onGlobalRefresh, enableCustomEvents]);

  const handleUserDataUpdated = React.useCallback((event: CustomEvent<{ telegramId: string }>) => {
    if (!enableCustomEvents) return;

    console.log('[BalanceEventHandlers] Received userDataUpdated event:', event.detail);

    if (!telegramId || event.detail?.telegramId === telegramId) {
      console.log(`[BalanceEventHandlers] User data updated for ${telegramId}, forcing refresh`);

      setForceRefresh(prev => prev + 1);

      if (onUserDataUpdated) {
        onUserDataUpdated(event.detail.telegramId);
      }
    }
  }, [telegramId, onUserDataUpdated, enableCustomEvents]);

  const handleSlotUpdated = React.useCallback((event: CustomEvent<{ telegramId: string, slotId: string, action: string }>) => {
    if (!enableCustomEvents) return;

    console.log('[BalanceEventHandlers] Received slotUpdated event:', event.detail);

    if (!telegramId || event.detail?.telegramId === telegramId) {
      console.log(`[BalanceEventHandlers] Slot updated for ${telegramId}, forcing refresh`);

      setForceRefresh(prev => prev + 1);

      if (onUserDataUpdated) {
        onUserDataUpdated(event.detail.telegramId);
      }
    }
  }, [telegramId, onUserDataUpdated, enableCustomEvents]);

  // Set up event listeners
  React.useEffect(() => {
    const eventListeners: Array<[string, EventListener]> = [
      ['balanceUpdated', handleBalanceUpdated as EventListener],
      ['userDataRefresh', handleUserDataRefresh as EventListener],
      ['globalDataRefresh', handleGlobalRefresh],
      ['userDataUpdated', handleUserDataUpdated as EventListener],
      ['slotUpdated', handleSlotUpdated as EventListener],
      ['message', handleWebSocketMessage as EventListener]
    ];

    // Add event listeners
    eventListeners.forEach(([event, handler]) => {
      window.addEventListener(event, handler);
    });

    // Cleanup function
    return () => {
      eventListeners.forEach(([event, handler]) => {
        window.removeEventListener(event, handler);
      });
    };
  }, [
    handleBalanceUpdated,
    handleUserDataRefresh,
    handleGlobalRefresh,
    handleUserDataUpdated,
    handleSlotUpdated,
    handleWebSocketMessage
  ]);

  // Manual refresh function
  const forceRefreshData = React.useCallback(() => {
    console.log(`[BalanceEventHandlers] Manual force refresh requested for user ${telegramId}`);
    setForceRefresh(prev => prev + 1);
  }, [telegramId]);

  // Dispatch custom events
  const dispatchBalanceUpdated = React.useCallback((eventData: BalanceUpdateEvent) => {
    if (enableCustomEvents) {
      window.dispatchEvent(new CustomEvent('balanceUpdated', {
        detail: eventData
      }));
    }
  }, [enableCustomEvents]);

  const dispatchUserDataRefresh = React.useCallback((telegramId: string) => {
    if (enableCustomEvents) {
      window.dispatchEvent(new CustomEvent('userDataRefresh', {
        detail: { telegramId }
      }));
    }
  }, [enableCustomEvents]);

  const dispatchGlobalRefresh = React.useCallback(() => {
    if (enableCustomEvents) {
      window.dispatchEvent(new CustomEvent('globalDataRefresh'));
    }
  }, [enableCustomEvents]);

  const dispatchUserDataUpdated = React.useCallback((telegramId: string) => {
    if (enableCustomEvents) {
      window.dispatchEvent(new CustomEvent('userDataUpdated', {
        detail: { telegramId }
      }));
    }
  }, [enableCustomEvents]);

  return {
    forceRefresh,
    forceRefreshData,
    dispatchBalanceUpdated,
    dispatchUserDataRefresh,
    dispatchGlobalRefresh,
    dispatchUserDataUpdated
  };
};

/**
 * Simplified hook for components that only need balance update handling
 * @param telegramId User's Telegram ID
 * @param onBalanceUpdate Optional callback for balance updates
 * @returns Force refresh function and state
 */
export const useSimpleBalanceHandlers = (
  telegramId?: string,
  onBalanceUpdate?: (event: BalanceUpdateEvent) => void
) => {
  return useBalanceEventHandlers({
    telegramId,
    onBalanceUpdate,
    enableWebSocket: true,
    enableCustomEvents: true
  });
};

/**
 * Hook for components that need all event types
 * @param telegramId User's Telegram ID
 * @param callbacks Object with callback functions
 * @returns All event handlers and utilities
 */
export const useFullBalanceHandlers = (
  telegramId?: string,
  callbacks?: {
    onBalanceUpdate?: (event: BalanceUpdateEvent) => void;
    onUserDataRefresh?: (telegramId: string) => void;
    onGlobalRefresh?: () => void;
    onUserDataUpdated?: (telegramId: string) => void;
  }
) => {
  return useBalanceEventHandlers({
    telegramId,
    ...callbacks,
    enableWebSocket: true,
    enableCustomEvents: true
  });
};
