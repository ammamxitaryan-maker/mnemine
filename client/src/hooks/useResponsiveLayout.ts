"use client";

import { useState, useEffect } from 'react';
import { getLayoutConfig, LayoutVariant, PaddingSize } from '@/utils/layoutUtils';

interface UseResponsiveLayoutReturn {
  width: number;
  height: number;
  variant: LayoutVariant;
  hasSidebar: boolean;
  hasExtraPanel: boolean;
  mainContentPadding: PaddingSize;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useResponsiveLayout(): UseResponsiveLayoutReturn {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial dimensions
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const layoutConfig = getLayoutConfig(dimensions.width);

  return {
    width: dimensions.width,
    height: dimensions.height,
    variant: layoutConfig.variant,
    hasSidebar: layoutConfig.hasSidebar,
    hasExtraPanel: layoutConfig.hasExtraPanel,
    mainContentPadding: layoutConfig.mainContentPadding,
    isMobile: dimensions.width < 768,
    isTablet: dimensions.width >= 768 && dimensions.width < 1024,
    isDesktop: dimensions.width >= 1024,
  };
}
