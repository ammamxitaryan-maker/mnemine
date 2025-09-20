import React from 'react';

const WaveBackground = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-[-1]">
      <div className="wave"></div>
      <div className="wave"></div>
      <div className="wave"></div>
    </div>
  );
};

export default WaveBackground;