"use client";

import { Outlet } from 'react-router-dom';
import { BottomNavBar } from '../BottomNavBar.tsx';
import { RealTimeSync } from '../RealTimeSync'; // Import RealTimeSync
import { NotificationSystem } from '../NotificationSystem'; // Import NotificationSystem

export const MainLayout = () => {
  return (
    <div className="h-full flex flex-col">
      <header className="p-2 flex justify-between items-center bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 z-40">
        <RealTimeSync />
        <NotificationSystem />
      </header>
      <main className="flex-grow overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNavBar />
    </div>
  );
};