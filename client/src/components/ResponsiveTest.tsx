"use client";

import { useResponsiveDesign } from '@/hooks/useResponsiveDesign';
import { ResponsiveContainer, ResponsiveGrid, ResponsiveText } from './ResponsiveContainer';

export const ResponsiveTest = () => {
  const { isMobile, isTablet, isDesktop, width, height, orientation } = useResponsiveDesign();

  return (
    <ResponsiveContainer maxWidth="lg" padding="md" spacing="md">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h2 className="text-xl font-bold mb-4 text-white">Responsive Design Test</h2>
        
        {/* Current breakpoint info */}
        <div className="mb-4 p-3 bg-slate-700/50 rounded">
          <h3 className="text-lg font-semibold text-white mb-2">Current Device Info:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
            <div>Width: {width}px</div>
            <div>Height: {height}px</div>
            <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
            <div>Tablet: {isTablet ? 'Yes' : 'No'}</div>
            <div>Desktop: {isDesktop ? 'Yes' : 'No'}</div>
            <div>Orientation: {orientation}</div>
          </div>
        </div>

        {/* Responsive text test */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Responsive Text Test:</h3>
          <ResponsiveText size="sm" responsive={true} className="text-gray-300">
            Small responsive text
          </ResponsiveText>
          <br />
          <ResponsiveText size="base" responsive={true} className="text-gray-300">
            Base responsive text
          </ResponsiveText>
          <br />
          <ResponsiveText size="lg" responsive={true} className="text-gray-300">
            Large responsive text
          </ResponsiveText>
        </div>

        {/* Responsive grid test */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Responsive Grid Test:</h3>
          <ResponsiveGrid 
            cols={{ mobile: 2, tablet: 3, desktop: 4 }}
            gap="sm"
          >
            {Array.from({ length: 8 }, (_, i) => (
              <div 
                key={i} 
                className="bg-slate-700/50 rounded p-2 text-center text-white text-sm"
              >
                Item {i + 1}
              </div>
            ))}
          </ResponsiveGrid>
        </div>

        {/* Responsive spacing test */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Responsive Spacing Test:</h3>
          <div className="space-responsive bg-slate-700/30 rounded p-2">
            <div className="bg-slate-600/50 rounded p-2 text-white text-sm">
              This container uses responsive spacing
            </div>
            <div className="bg-slate-600/50 rounded p-2 text-white text-sm">
              The spacing adapts to screen size
            </div>
          </div>
        </div>

        {/* Touch target test */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Touch Target Test:</h3>
          <div className="flex gap-2 flex-wrap">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded min-h-[44px] min-w-[44px] text-sm">
              Touch Me
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded min-h-[44px] min-w-[44px] text-sm">
              Touch Me
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded min-h-[44px] min-w-[44px] text-sm">
              Touch Me
            </button>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
};
