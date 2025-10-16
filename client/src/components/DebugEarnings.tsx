"use client";

import React from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useUserData } from '@/hooks/useUserData';
import { useServerEarnings } from '@/hooks/useServerEarnings';
import { useEarnings } from '@/hooks/useEarnings';

export const DebugEarnings = () => {
  const { user, loading: authLoading, error: authError } = useTelegramAuth();
  const { data: slotsData, isLoading: slotsLoading, error: slotsError } = useSlotsData(user?.telegramId);
  const { data: userData, isLoading: userLoading, error: userError } = useUserData(user?.telegramId);
  const { data: serverEarnings, isLoading: serverLoading, error: serverError } = useServerEarnings(user?.telegramId);
  const { totalEarnings, perSecondRate, isActive } = useEarnings();

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white p-4 rounded-lg max-w-md text-xs font-mono z-50">
      <h3 className="text-yellow-400 font-bold mb-2">🔧 DEBUG EARNINGS</h3>
      
      <div className="space-y-1">
        <div><strong>Auth:</strong> {authLoading ? 'Loading...' : user ? `✅ ${user.telegramId}` : '❌ No user'}</div>
        <div><strong>Slots:</strong> {slotsLoading ? 'Loading...' : slotsData ? `✅ ${slotsData.length} slots` : '❌ No slots'}</div>
        <div><strong>User Data:</strong> {userLoading ? 'Loading...' : userData ? '✅ Loaded' : '❌ No data'}</div>
        <div><strong>Server Earnings:</strong> {serverLoading ? 'Loading...' : serverEarnings ? '✅ Loaded' : '❌ No data'}</div>
        
        <div className="border-t border-gray-600 pt-1 mt-2">
          <div><strong>Live Earnings:</strong> {totalEarnings.toFixed(6)} MNE</div>
          <div><strong>Rate:</strong> {perSecondRate.toFixed(8)}/sec</div>
          <div><strong>Active:</strong> {isActive ? '✅ Yes' : '❌ No'}</div>
        </div>
        
        {slotsData && slotsData.length > 0 && (
          <div className="border-t border-gray-600 pt-1 mt-2">
            <div><strong>Active Slots:</strong></div>
            {slotsData.filter(s => s.isActive).map(slot => (
              <div key={slot.id} className="ml-2">
                • {slot.principal.toFixed(2)} MNE @ {slot.effectiveWeeklyRate.toFixed(2)}%/week
              </div>
            ))}
          </div>
        )}
        
        {(authError || slotsError || userError || serverError) && (
          <div className="border-t border-red-600 pt-1 mt-2 text-red-400">
            <div><strong>Errors:</strong></div>
            {authError && <div>• Auth: {authError}</div>}
            {slotsError && <div>• Slots: {slotsError.message}</div>}
            {userError && <div>• User: {userError.message}</div>}
            {serverError && <div>• Server: {serverError.message}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
