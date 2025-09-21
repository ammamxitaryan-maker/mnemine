import React, { memo } from 'react';

const WaveBackground = memo(() => {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-[-1] pointer-events-none">
      <div className="wave" aria-hidden="true"></div>
      <div className="wave" aria-hidden="true"></div>
      <div className="wave" aria-hidden="true"></div>
    </div>
  );
});

WaveBackground.displayName = 'WaveBackground';

export default WaveBackground;