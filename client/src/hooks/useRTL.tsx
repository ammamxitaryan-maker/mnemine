import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// RTL languages that need right-to-left layout
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export const useRTL = () => {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(false);
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    const currentLanguage = i18n.language;
    const isRTLLanguage = RTL_LANGUAGES.includes(currentLanguage);
    
    setIsRTL(isRTLLanguage);
    setDirection(isRTLLanguage ? 'rtl' : 'ltr');
    
    // Update document direction
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLanguage;
    
    // Add/remove RTL class for CSS targeting
    if (isRTLLanguage) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [i18n.language, direction]);

  return {
    isRTL,
    direction,
    textAlign: isRTL ? 'right' : 'left',
    flexDirection: isRTL ? 'row-reverse' : 'row',
    marginStart: isRTL ? 'marginRight' : 'marginLeft',
    marginEnd: isRTL ? 'marginLeft' : 'marginRight',
    paddingStart: isRTL ? 'paddingRight' : 'paddingLeft',
    paddingEnd: isRTL ? 'paddingLeft' : 'paddingRight',
    borderStart: isRTL ? 'borderRight' : 'borderLeft',
    borderEnd: isRTL ? 'borderLeft' : 'borderRight',
  };
};

// Utility function to get RTL-aware class names
export const getRTLClasses = (baseClasses: string, rtlClasses?: string, isRTL?: boolean) => {
  if (isRTL && rtlClasses) {
    return `${baseClasses} ${rtlClasses}`;
  }
  return baseClasses;
};

// Utility function to get RTL-aware styles
export const getRTLStyles = (baseStyles: React.CSSProperties, rtlStyles?: React.CSSProperties, isRTL?: boolean) => {
  if (isRTL && rtlStyles) {
    return { ...baseStyles, ...rtlStyles };
  }
  return baseStyles;
};

// RTL-aware spacing utilities
export const getRTLSpacing = (isRTL: boolean) => ({
  marginStart: (value: string) => isRTL ? `mr-${value}` : `ml-${value}`,
  marginEnd: (value: string) => isRTL ? `ml-${value}` : `mr-${value}`,
  paddingStart: (value: string) => isRTL ? `pr-${value}` : `pl-${value}`,
  paddingEnd: (value: string) => isRTL ? `pl-${value}` : `pr-${value}`,
  borderStart: (value: string) => isRTL ? `border-r-${value}` : `border-l-${value}`,
  borderEnd: (value: string) => isRTL ? `border-l-${value}` : `border-r-${value}`,
});

// RTL-aware flex utilities
export const getRTLFlex = (isRTL: boolean) => ({
  flexDirection: isRTL ? 'flex-row-reverse' : 'flex-row',
  justifyContent: (value: string) => {
    if (isRTL) {
      switch (value) {
        case 'flex-start': return 'justify-end';
        case 'flex-end': return 'justify-start';
        default: return value;
      }
    }
    return value;
  },
  alignItems: (value: string) => value, // Usually doesn't change
});

// RTL-aware text utilities
export const getRTLText = (isRTL: boolean) => ({
  textAlign: isRTL ? 'text-right' : 'text-left',
  textDirection: isRTL ? 'rtl' : 'ltr',
});

// RTL-aware position utilities
export const getRTLPosition = (isRTL: boolean) => ({
  left: (value: string) => isRTL ? `right-${value}` : `left-${value}`,
  right: (value: string) => isRTL ? `left-${value}` : `right-${value}`,
  transform: (value: string) => {
    if (isRTL && value.includes('translateX')) {
      return value.replace('translateX', 'translateX').replace('-', '+').replace('+', '-');
    }
    return value;
  },
});

export default useRTL;
