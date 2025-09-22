"use client";

/**
 * BUG FIX: Removed unused React import to fix TypeScript warning
 */

const GlassGlowOverlay = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 opacity-30"></div>
    </div>
  );
};

export default GlassGlowOverlay;