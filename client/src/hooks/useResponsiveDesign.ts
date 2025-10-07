"use client";

import { useState, useEffect } from 'react';

interface ResponsiveBreakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

interface ResponsiveClasses {
  container: string;
  text: string;
  spacing: string;
  grid: string;
}

export const useResponsiveDesign = (): ResponsiveBreakpoints => {
  const [breakpoints, setBreakpoints] = useState<ResponsiveBreakpoints>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    width: 0,
    height: 0,
    orientation: 'portrait'
  });

  useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setBreakpoints({
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024 && width < 1280,
        isLargeDesktop: width >= 1280,
        width,
        height,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    // Initial check
    updateBreakpoints();

    // Listen for resize events
    window.addEventListener('resize', updateBreakpoints);
    window.addEventListener('orientationchange', updateBreakpoints);

    return () => {
      window.removeEventListener('resize', updateBreakpoints);
      window.removeEventListener('orientationchange', updateBreakpoints);
    };
  }, []);

  return breakpoints;
};

export const useResponsiveClasses = (): ResponsiveClasses => {
  const { isMobile, isTablet, isDesktop } = useResponsiveDesign();

  return {
    container: isMobile 
      ? 'w-full px-2 py-2' 
      : isTablet 
        ? 'w-full px-4 py-3' 
        : 'w-full max-w-7xl mx-auto px-6 py-4',
    
    text: isMobile
      ? 'text-sm'
      : isTablet
        ? 'text-base'
        : 'text-lg',
    
    spacing: isMobile
      ? 'space-y-2'
      : isTablet
        ? 'space-y-3'
        : 'space-y-4',
    
    grid: isMobile
      ? 'grid-cols-2 gap-2'
      : isTablet
        ? 'grid-cols-3 gap-3'
        : 'grid-cols-4 gap-4'
  };
};

export const useResponsiveValue = <T>(
  mobile: T,
  tablet?: T,
  desktop?: T,
  largeDesktop?: T
): T => {
  const { isMobile, isTablet, isDesktop, isLargeDesktop } = useResponsiveDesign();

  if (isLargeDesktop && largeDesktop !== undefined) {
    return largeDesktop;
  }
  
  if (isDesktop && desktop !== undefined) {
    return desktop;
  }
  
  if (isTablet && tablet !== undefined) {
    return tablet;
  }
  
  return mobile;
};

export const useResponsiveGrid = (
  mobileCols: number = 2,
  tabletCols: number = 3,
  desktopCols: number = 4
) => {
  const { isMobile, isTablet } = useResponsiveDesign();

  if (isMobile) return mobileCols;
  if (isTablet) return tabletCols;
  return desktopCols;
};

export const useResponsiveSpacing = (
  mobile: string = '0.5rem',
  tablet: string = '1rem',
  desktop: string = '1.5rem'
) => {
  const { isMobile, isTablet } = useResponsiveDesign();

  if (isMobile) return mobile;
  if (isTablet) return tablet;
  return desktop;
};

export const useResponsiveTextSize = (
  mobile: string = 'text-sm',
  tablet: string = 'text-base',
  desktop: string = 'text-lg'
) => {
  const { isMobile, isTablet } = useResponsiveDesign();

  if (isMobile) return mobile;
  if (isTablet) return tablet;
  return desktop;
};
