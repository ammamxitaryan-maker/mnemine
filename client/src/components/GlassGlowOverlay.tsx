"use client";

import React from 'react';

const GlassGlowOverlay = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-500/20 opacity-70 animate-subtle-glow"></div>
    </div>
  );
};

export default GlassGlowOverlay;