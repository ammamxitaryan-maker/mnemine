import { useNetworkErrorHandler } from '@/hooks/useNetworkErrorHandler';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const NetworkStatusIndicator = () => {
  const { t } = useTranslation();
  const { networkState, clearNetworkError } = useNetworkErrorHandler();

  if (!networkState.hasNetworkError) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-600 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
      <WifiOff className="h-4 w-4" />
      <div className="flex-1">
        <p className="font-medium">Connection Issue</p>
        <p className="text-sm opacity-90">
          Backend server appears to be unavailable. Some features may not work.
        </p>
        {networkState.errorCount > 1 && (
          <p className="text-xs opacity-75 mt-1">
            {networkState.errorCount} connection attempts failed
          </p>
        )}
      </div>
      <button
        onClick={clearNetworkError}
        className="text-white hover:text-gray-200 transition-colors"
        title={t('network.dismiss')}
      >
        ×
      </button>
    </div>
  );
};
