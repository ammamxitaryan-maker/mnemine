import { calculateTotalEarnings, MiningSlot } from './earningsCalculator';

interface PersistentEarningsState {
  totalEarnings: number;
  perSecondRate: number;
  lastUpdateTime: number;
  isActive: boolean;
  telegramId: string;
}

const LOCAL_STORAGE_KEY = 'globalPersistentEarnings';
const SYNC_INTERVAL_MS = 60000; // Sync with server every minute

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
          const timeElapsedSeconds = (now - parsed.lastUpdateTime) / 1000;
          const accumulatedEarnings = parsed.perSecondRate * timeElapsedSeconds;
          
          this.state = {
            ...parsed,
            totalEarnings: parsed.totalEarnings + accumulatedEarnings,
            lastUpdateTime: now,
          };
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

  public updateSlotsData(telegramId: string, slots: MiningSlot[]): void {
    // If telegramId changed, reset state
    if (this.currentTelegramId !== telegramId) {
      this.currentTelegramId = telegramId;
      this.resetState();
    }

    const { totalPerSecondRate } = calculateTotalEarnings(slots);
    const now = Date.now();

    if (!this.state) {
      this.state = {
        totalEarnings: 0,
        perSecondRate: totalPerSecondRate,
        lastUpdateTime: now,
        isActive: totalPerSecondRate > 0,
        telegramId,
      };
    } else {
      // Calculate accumulated earnings since last update
      const timeElapsedSeconds = (now - this.state.lastUpdateTime) / 1000;
      const accumulatedEarnings = this.state.perSecondRate * timeElapsedSeconds;
      
      this.state = {
        totalEarnings: this.state.totalEarnings + accumulatedEarnings,
        perSecondRate: totalPerSecondRate,
        lastUpdateTime: now,
        isActive: totalPerSecondRate > 0,
        telegramId,
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
        if (this.state) {
          const now = Date.now();
          const timeElapsedSeconds = (now - this.state.lastUpdateTime) / 1000;
          const accumulatedEarnings = this.state.perSecondRate * timeElapsedSeconds;
          
          this.state = {
            ...this.state,
            totalEarnings: this.state.totalEarnings + accumulatedEarnings,
            lastUpdateTime: now,
          };
          
          this.saveToStorage();
          this.notifyListeners();
        }
      }, 1000); // Update every second
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

  public resetEarnings(): void {
    this.resetState();
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
