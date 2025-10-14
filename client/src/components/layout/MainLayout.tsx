"use client";

import { Outlet } from 'react-router-dom';
import { BottomNavBar } from '../BottomNavBar'; // Updated import path

export const MainLayout = () => {
  return (
    <div className="page-container flex flex-col">
      <main className="flex-grow pb-20 sm:pb-16 page-content min-h-screen">
        <Outlet />
      </main>
      <BottomNavBar />
    </div>
  );
};