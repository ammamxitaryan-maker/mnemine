import React from 'react';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

interface ForceRefreshButtonProps {
  telegramId: string;
  onRefresh?: () => void;
  className?: string;
}

export const ForceRefreshButton: React.FC<ForceRefreshButtonProps> = ({
  telegramId,
  onRefresh,
  className = ''
}) => {
  const handleForceRefresh = async () => {
    try {
      console.log(`[ForceRefresh] Manually refreshing data for user ${telegramId}`);
      
      // Method 1: Dispatch custom event
      window.dispatchEvent(new CustomEvent('userDataRefresh', { 
        detail: { telegramId } 
      }));
      
      // Method 2: Dispatch balance updated event
      window.dispatchEvent(new CustomEvent('balanceUpdated', { 
        detail: { telegramId } 
      }));
      
      // Method 3: Dispatch global refresh event
      window.dispatchEvent(new CustomEvent('globalDataRefresh'));
      
      // Method 4: Direct API call with cache bypass
      const response = await fetch(`/api/user/${telegramId}/data?bypassCache=true&t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[ForceRefresh] Fresh data received:`, data);
        
        // Dispatch event with fresh data
        window.dispatchEvent(new CustomEvent('userDataUpdated', { 
          detail: { telegramId, data } 
        }));
      }
      
      // Call optional callback
      if (onRefresh) {
        onRefresh();
      }
      
      console.log(`[ForceRefresh] All refresh methods executed for user ${telegramId}`);
    } catch (error) {
      console.error('[ForceRefresh] Error during force refresh:', error);
    }
  };

  return (
    <Button
      onClick={handleForceRefresh}
      variant="outline"
      size="sm"
      className={`text-blue-400 border-blue-600 hover:bg-blue-600/10 ${className}`}
    >
      <RefreshCw className="h-4 w-4 mr-1" />
      Force Refresh
    </Button>
  );
};
