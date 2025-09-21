"use client";

import { Outlet } from 'react-router-dom';
import { BottomNavBar } from '../BottomNavBar';

export const MainLayout = () => {
  return (
    <div className="h-full flex flex-col">
      <main className="flex-grow overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNavBar />
    </div>
  );
};