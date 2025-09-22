"use client";

import { Outlet } from 'react-router-dom';
import { BottomNavBarSimplified } from '../BottomNavBarSimplified';

export const MainLayoutSimplified = () => {
  return (
    <div className="h-full flex flex-col">
      <main className="flex-grow overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNavBarSimplified />
    </div>
  );
};
