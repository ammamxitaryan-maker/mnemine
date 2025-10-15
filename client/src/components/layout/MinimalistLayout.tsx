"use client";

import { Outlet } from 'react-router-dom';

export const MinimalistLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Main content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};
