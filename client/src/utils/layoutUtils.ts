/**
 * Layout utility functions for the Mnemine app
 */

export type LayoutVariant = 'mobile' | 'tablet' | 'desktop';
export type PaddingSize = 'none' | 'sm' | 'md' | 'lg';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Get responsive layout configuration based on screen size
 */
export function getLayoutConfig(width: number): {
  variant: LayoutVariant;
  hasSidebar: boolean;
  hasExtraPanel: boolean;
  mainContentPadding: PaddingSize;
} {
  if (width < 768) {
    return {
      variant: 'mobile',
      hasSidebar: false,
      hasExtraPanel: false,
      mainContentPadding: 'sm'
    };
  } else if (width < 1024) {
    return {
      variant: 'tablet',
      hasSidebar: true,
      hasExtraPanel: false,
      mainContentPadding: 'md'
    };
  } else {
    return {
      variant: 'desktop',
      hasSidebar: true,
      hasExtraPanel: true,
      mainContentPadding: 'lg'
    };
  }
}

/**
 * Get responsive grid columns based on screen size
 */
export function getGridColumns(width: number, baseColumns: number = 1): string {
  if (width < 640) {
    return `grid-cols-${baseColumns}`;
  } else if (width < 768) {
    return `grid-cols-${Math.min(baseColumns * 2, 4)}`;
  } else if (width < 1024) {
    return `grid-cols-${Math.min(baseColumns * 3, 6)}`;
  } else {
    return `grid-cols-${Math.min(baseColumns * 4, 8)}`;
  }
}

/**
 * Get responsive spacing based on screen size
 */
export function getResponsiveSpacing(width: number): {
  gap: string;
  padding: string;
  margin: string;
} {
  if (width < 640) {
    return {
      gap: 'gap-2',
      padding: 'p-2',
      margin: 'm-2'
    };
  } else if (width < 1024) {
    return {
      gap: 'gap-4',
      padding: 'p-4',
      margin: 'm-4'
    };
  } else {
    return {
      gap: 'gap-6',
      padding: 'p-6',
      margin: 'm-6'
    };
  }
}

/**
 * Get responsive text size based on screen size
 */
export function getResponsiveTextSize(width: number, baseSize: 'sm' | 'base' | 'lg' = 'base'): string {
  if (width < 640) {
    return baseSize === 'sm' ? 'text-xs' : baseSize === 'base' ? 'text-sm' : 'text-base';
  } else if (width < 1024) {
    return baseSize === 'sm' ? 'text-sm' : baseSize === 'base' ? 'text-base' : 'text-lg';
  } else {
    return baseSize === 'sm' ? 'text-base' : baseSize === 'base' ? 'text-lg' : 'text-xl';
  }
}

/**
 * Check if current viewport is mobile
 */
export function isMobile(width: number): boolean {
  return width < 768;
}

/**
 * Check if current viewport is tablet
 */
export function isTablet(width: number): boolean {
  return width >= 768 && width < 1024;
}

/**
 * Check if current viewport is desktop
 */
export function isDesktop(width: number): boolean {
  return width >= 1024;
}

/**
 * Get optimal button size based on screen size
 */
export function getOptimalButtonSize(width: number): ButtonSize {
  if (width < 640) {
    return 'lg'; // Larger touch targets on mobile
  } else if (width < 1024) {
    return 'md';
  } else {
    return 'md';
  }
}

/**
 * Get optimal card padding based on screen size
 */
export function getOptimalCardPadding(width: number): PaddingSize {
  if (width < 640) {
    return 'sm';
  } else if (width < 1024) {
    return 'md';
  } else {
    return 'lg';
  }
}

/**
 * Generate responsive class names
 */
export function getResponsiveClasses(width: number, classes: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}): string {
  if (width < 768) {
    return classes.mobile || '';
  } else if (width < 1024) {
    return classes.tablet || classes.mobile || '';
  } else {
    return classes.desktop || classes.tablet || classes.mobile || '';
  }
}
