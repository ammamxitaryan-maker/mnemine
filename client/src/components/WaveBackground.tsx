import React from 'react';

const WaveBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Animated wave patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>
          <div className="absolute top-1/4 left-0 w-full h-full bg-gradient-to-r from-cyan-500/5 to-blue-500/5 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-0 w-full h-full bg-gradient-to-r from-purple-500/5 to-pink-500/5 animate-pulse delay-2000"></div>
        </div>
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
      </div>
    </div>
  );
};

export default WaveBackground;
