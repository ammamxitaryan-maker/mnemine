"use client";

import { Outlet } from 'react-router-dom';
import { MinimalistBottomNav } from '../MinimalistBottomNav';
import { FloatingActionButton } from '../FloatingActionButton';
import { SwipeNavigator } from '../SwipeNavigator';

export const MinimalistLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Main content with swipe navigation */}
      <SwipeNavigator>
        <main className="pb-20">
          <Outlet />
        </main>
      </SwipeNavigator>
      
      {/* Floating Action Button */}
      <FloatingActionButton />
      
      {/* Bottom Navigation */}
      <MinimalistBottomNav />
    </div>
  );
};
