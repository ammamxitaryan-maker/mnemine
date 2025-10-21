import { MiningSlot } from '@/hooks/useSlotsData';
import { calculateTotalEarnings } from './earningsCalculator';

interface PersistentEarningsState {
  totalEarnings: number;
  perSecondRate: number;
  lastUpdateTime: number;
  isActive: boolean;
  telegramId: string;
  serverSyncTime: number; // When we last synced with server
  serverEarnings: number; // Server-calculated earnings
  lastServerSlotsHash: string; // Hash of slots data for change detection
}

const LOCAL_STORAGE_KEY = 'globalPersistentEarnings';
const SYNC_INTERVAL_MS = 60000; // Sync with server every 60 seconds
const SERVER_SYNC_INTERVAL_MS = 600000; // Force server sync every 10 minutes

class GlobalEarningsManager {
  private state: PersistentEarningsState | null = null;
  private listeners: Set<(state: PersistentEarningsState) => void> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private currentTelegramId: string | null = null;

  constructor() {
    this.loadFromStorage();
    this.setupBeforeUnload();
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed: PersistentEarningsState = JSON.parse(saved);
          const now = Date.now();

          // Check if we need to sync with server (more than 5 minutes since last sync)
          const needsServerSync = !parsed.serverSyncTime || (now - parsed.serverSyncTime) > SERVER_SYNC_INTERVAL_MS;

          if (needsServerSync) {
            console.log('[EarningsManager] Need server sync, resetting state');
            this.state = null;
            return;
          }

          // Calculate accumulated earnings since last update
          const timeElapsedSeconds = (now - parsed.lastUpdateTime) / 1000;
          const accumulatedEarnings = parsed.perSecondRate * timeElapsedSeconds;

          this.state = {
            ...parsed,
            totalEarnings: parsed.totalEarnings + accumulatedEarnings,
            lastUpdateTime: now,
          };

          console.log('[EarningsManager] Loaded from storage:', {
            totalEarnings: this.state.totalEarnings,
            perSecondRate: this.state.perSecondRate,
            timeElapsedSeconds,
            accumulatedEarnings
          });
        } catch (error) {
          console.error('Error loading earnings from storage:', error);
          this.state = null;
        }
      }
    }
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined' && this.state) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state));
    }
  }

  private createSlotsHash(slots: MiningSlot[]): string {
    // Create a simple hash of slots data to detect changes
    const slotsData = slots.map(slot => ({
      id: slot.id,
      principal: slot.principal,
      effectiveWeeklyRate: slot.effectiveWeeklyRate,
      isActive: slot.isActive,
      expiresAt: slot.expiresAt,
      lastAccruedAt: slot.lastAccruedAt || slot.createdAt
    }));
    return JSON.stringify(slotsData);
  }

  private setupBeforeUnload(): void {
    if (typeof window !== 'undefined') {
      const handleBeforeUnload = () => {
        this.saveToStorage();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
  }

  private notifyListeners(): void {
    if (this.state) {
      this.listeners.forEach(listener => listener(this.state!));
    }
  }

  public subscribe(listener: (state: PersistentEarningsState) => void): () => void {
    this.listeners.add(listener);

    // Immediately notify with current state
    if (this.state) {
      listener(this.state);
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  public updateSlotsData(telegramId: string, slots: MiningSlot[], serverEarnings?: number): void {
    // If telegramId changed, reset state
    if (this.currentTelegramId !== telegramId) {
      this.currentTelegramId = telegramId;
      this.resetState();
    }

    const { totalPerSecondRate } = calculateTotalEarnings(slots);
    const now = Date.now();
    const slotsHash = this.createSlotsHash(slots);

    if (!this.state) {
      // Initialize state with server earnings if available
      this.state = {
        totalEarnings: serverEarnings || 0,
        perSecondRate: totalPerSecondRate,
        lastUpdateTime: now,
        isActive: totalPerSecondRate > 0,
        telegramId,
        serverSyncTime: now,
        serverEarnings: serverEarnings || 0,
        lastServerSlotsHash: slotsHash,
      };

      console.log('[EarningsManager] Initialized state:', {
        totalEarnings: this.state.totalEarnings,
        perSecondRate: this.state.perSecondRate,
        serverEarnings: this.state.serverEarnings,
        slotsCount: slots.length,
        activeSlots: slots.filter(s => s.isActive).length
      });
    } else {
      // Check if slots data has changed
      const slotsChanged = this.state.lastServerSlotsHash !== slotsHash;

      // Calculate accumulated earnings since last update
      const timeElapsedSeconds = (now - this.state.lastUpdateTime) / 1000;
      const accumulatedEarnings = this.state.perSecondRate * timeElapsedSeconds;

      let newTotalEarnings = this.state.totalEarnings + accumulatedEarnings;

      // If we have server earnings and slots changed, sync with server
      if (serverEarnings !== undefined && slotsChanged) {
        console.log('[EarningsManager] Slots changed, syncing with server:', {
          oldEarnings: newTotalEarnings,
          serverEarnings,
          difference: serverEarnings - newTotalEarnings
        });

        // Use server earnings as the base, but keep accumulated earnings since last sync
        newTotalEarnings = serverEarnings;
      }

      this.state = {
        totalEarnings: newTotalEarnings,
        perSecondRate: totalPerSecondRate,
        lastUpdateTime: now,
        isActive: totalPerSecondRate > 0,
        telegramId,
        serverSyncTime: slotsChanged ? now : this.state.serverSyncTime,
        serverEarnings: serverEarnings || this.state.serverEarnings,
        lastServerSlotsHash: slotsHash,
      };
    }

    this.saveToStorage();
    this.notifyListeners();
    this.startUpdateTimer();
  }

  private resetState(): void {
    this.state = null;
    this.stopUpdateTimer();
    this.notifyListeners();
  }

  private startUpdateTimer(): void {
    this.stopUpdateTimer();

    if (this.state && this.state.isActive && this.state.perSecondRate > 0) {
      this.updateInterval = setInterval(() => {
        if (this.state && this.state.isActive) {
          const now = Date.now();
          const timeElapsedSeconds = (now - this.state.lastUpdateTime) / 1000;
          const accumulatedEarnings = this.state.perSecondRate * timeElapsedSeconds;

          this.state = {
            ...this.state,
            totalEarnings: this.state.totalEarnings + accumulatedEarnings,
            lastUpdateTime: now,
          };

          console.log('[EarningsManager] Updated earnings:', {
            totalEarnings: this.state.totalEarnings,
            perSecondRate: this.state.perSecondRate,
            accumulatedEarnings,
            timeElapsedSeconds
          });

          this.saveToStorage();
          this.notifyListeners();
        }
      }, 250); // Update 4 times per second (every 250ms)
    }
  }

  private stopUpdateTimer(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public startSyncTimer(refetchSlots: () => void, refetchUserData: () => void): void {
    this.stopSyncTimer();

    this.syncInterval = setInterval(() => {
      refetchSlots();
      refetchUserData();
    }, SYNC_INTERVAL_MS);
  }

  public stopSyncTimer(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  public getCurrentState(): PersistentEarningsState | null {
    return this.state;
  }

  public resetEarnings(telegramId?: string): void {
    if (!telegramId || this.state?.telegramId === telegramId) {
      this.resetState();
    }
  }

  public updateServerEarnings(telegramId: string, serverEarnings: number): void {
    if (this.state && this.state.telegramId === telegramId) {
      const now = Date.now();
      const timeElapsedSeconds = (now - this.state.lastUpdateTime) / 1000;
      const accumulatedEarnings = this.state.perSecondRate * timeElapsedSeconds;

      // Only update if server earnings are significantly different (more than 5 seconds worth of earnings)
      // This prevents constant resets from WebSocket updates
      const earningsDifference = Math.abs(serverEarnings - this.state.serverEarnings);
      const fiveSecondEarnings = this.state.perSecondRate * 5;

      if (earningsDifference > fiveSecondEarnings || this.state.serverEarnings === 0) {
        this.state = {
          ...this.state,
          totalEarnings: serverEarnings + accumulatedEarnings,
          lastUpdateTime: now,
          serverEarnings: serverEarnings,
          serverSyncTime: now,
        };

        console.log('[EarningsManager] Updated with server earnings:', {
          serverEarnings,
          totalEarnings: this.state.totalEarnings,
          accumulatedEarnings,
          earningsDifference,
          fiveSecondEarnings
        });

        this.saveToStorage();
        this.notifyListeners();
      } else {
        console.log('[EarningsManager] Skipping server update - difference too small:', {
          earningsDifference,
          fiveSecondEarnings,
          serverEarnings,
          currentServerEarnings: this.state.serverEarnings
        });
      }
    }
  }

  public forceServerSync(telegramId: string): void {
    if (this.state && this.state.telegramId === telegramId) {
      // Mark that we need a server sync
      this.state.serverSyncTime = 0; // This will trigger a sync on next update
      console.log('[EarningsManager] Forced server sync requested');
    }
  }

  public destroy(): void {
    this.stopUpdateTimer();
    this.stopSyncTimer();
    this.listeners.clear();
    this.saveToStorage();
  }
}

// Singleton instance
export const globalEarningsManager = new GlobalEarningsManager();
