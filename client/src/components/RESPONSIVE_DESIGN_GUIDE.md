# Responsive Design Guide for Mnemine App

This guide outlines the responsive design system implemented to ensure the application works perfectly across all device sizes.

## Overview

The responsive design system is built on:
- **Mobile-first approach**: Design for mobile devices first, then enhance for larger screens
- **Fluid typography**: Text sizes that scale smoothly across devices
- **Flexible layouts**: Grid and flexbox layouts that adapt to screen size
- **Touch-friendly interfaces**: Proper touch targets and spacing for mobile devices

## Breakpoints

The application uses the following breakpoints:

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md, lg)
- **Desktop**: 1024px - 1280px (xl)
- **Large Desktop**: > 1280px (2xl)

## Responsive Utilities

### CSS Classes

#### Container Classes
```css
.container-responsive {
  width: 100%;
  max-width: 100vw;
  margin: 0 auto;
  padding: 0 1rem; /* Mobile */
}

@media (min-width: 640px) {
  .container-responsive {
    padding: 0 1.5rem; /* Tablet */
  }
}

@media (min-width: 1024px) {
  .container-responsive {
    padding: 0 2rem; /* Desktop */
  }
}
```

#### Text Classes
```css
.text-responsive-sm { font-size: clamp(0.75rem, 2vw, 0.875rem); }
.text-responsive-base { font-size: clamp(0.875rem, 2.5vw, 1rem); }
.text-responsive-lg { font-size: clamp(1rem, 3vw, 1.125rem); }
.text-responsive-xl { font-size: clamp(1.125rem, 3.5vw, 1.25rem); }
.text-responsive-2xl { font-size: clamp(1.25rem, 4vw, 1.5rem); }
.text-responsive-3xl { font-size: clamp(1.5rem, 5vw, 2rem); }
```

#### Spacing Classes
```css
.space-responsive { gap: clamp(0.5rem, 2vw, 1rem); }
.space-responsive-lg { gap: clamp(1rem, 3vw, 1.5rem); }
.space-responsive-xl { gap: clamp(1.5rem, 4vw, 2rem); }
```

### React Components

#### ResponsiveContainer
```tsx
import { ResponsiveContainer } from '@/components/ResponsiveContainer';

<ResponsiveContainer 
  maxWidth="lg" 
  padding="md" 
  spacing="lg"
>
  {/* Content */}
</ResponsiveContainer>
```

#### ResponsiveGrid
```tsx
import { ResponsiveGrid } from '@/components/ResponsiveContainer';

<ResponsiveGrid 
  cols={{ mobile: 2, tablet: 3, desktop: 4 }}
  gap="md"
>
  {/* Grid items */}
</ResponsiveGrid>
```

#### ResponsiveText
```tsx
import { ResponsiveText } from '@/components/ResponsiveContainer';

<ResponsiveText size="lg" responsive={true}>
  This text will scale responsively
</ResponsiveText>
```

### React Hooks

#### useResponsiveDesign
```tsx
import { useResponsiveDesign } from '@/hooks/useResponsiveDesign';

const MyComponent = () => {
  const { isMobile, isTablet, isDesktop, width, height } = useResponsiveDesign();
  
  return (
    <div className={isMobile ? 'text-sm' : 'text-lg'}>
      {/* Content */}
    </div>
  );
};
```

#### useResponsiveValue
```tsx
import { useResponsiveValue } from '@/hooks/useResponsiveDesign';

const MyComponent = () => {
  const textSize = useResponsiveValue('text-sm', 'text-base', 'text-lg');
  
  return <div className={textSize}>Content</div>;
};
```

## Layout Patterns

### 1. Mobile-First Card Layout
```tsx
<div className="w-full max-w-[95vw] min-h-[12rem] sm:min-h-[14rem] lg:min-h-[16rem]">
  {/* Card content */}
</div>
```

### 2. Responsive Grid
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
  {/* Grid items */}
</div>
```

### 3. Responsive Typography
```tsx
<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
  Responsive Heading
</h1>
```

### 4. Responsive Spacing
```tsx
<div className="space-y-4 sm:space-y-6 lg:space-y-8">
  {/* Content with responsive spacing */}
</div>
```

## Component Guidelines

### Cards
- Use `max-w-[95vw]` for mobile to prevent overflow
- Implement responsive padding: `p-3 sm:p-4 lg:p-6`
- Use responsive heights: `min-h-[12rem] sm:min-h-[14rem] lg:min-h-[16rem]`

### Navigation
- Mobile: Bottom navigation with larger touch targets
- Desktop: Side navigation or top navigation
- Use responsive icon sizes: `w-5 h-5 sm:w-4 sm:h-4`

### Text
- Use responsive text sizes with `clamp()` for fluid typography
- Implement proper line heights: `leading-tight` for mobile
- Use `break-words` for long text to prevent overflow

### Images and Media
- Always use `max-width: 100%` and `height: auto`
- Implement responsive aspect ratios
- Use `object-fit: cover` for consistent sizing

## Best Practices

### 1. Mobile-First Development
- Start with mobile design and enhance for larger screens
- Use progressive enhancement approach
- Test on actual devices, not just browser dev tools

### 2. Touch-Friendly Design
- Minimum touch target size: 44px × 44px
- Adequate spacing between interactive elements
- Use proper button sizes and padding

### 3. Performance
- Use `clamp()` for fluid typography instead of multiple media queries
- Implement lazy loading for images
- Optimize for mobile data usage

### 4. Accessibility
- Ensure proper contrast ratios across all screen sizes
- Use semantic HTML elements
- Implement proper focus states for keyboard navigation

### 5. Testing
- Test on various device sizes and orientations
- Use browser dev tools for responsive testing
- Test with different zoom levels
- Verify touch interactions on mobile devices

## Common Issues and Solutions

### Issue: Text Overflow
**Solution**: Use `break-words` and `line-clamp-1` for text truncation

### Issue: Horizontal Scroll
**Solution**: Use `max-w-[95vw]` and `overflow-x: hidden`

### Issue: Touch Target Too Small
**Solution**: Use minimum 44px height/width for interactive elements

### Issue: Layout Breaks on Small Screens
**Solution**: Use responsive grid with `grid-cols-2` for mobile

### Issue: Text Too Small on Mobile
**Solution**: Use responsive text sizes with `clamp()` function

## Implementation Checklist

- [ ] All components use responsive design patterns
- [ ] Text scales properly across all screen sizes
- [ ] Touch targets are appropriately sized
- [ ] No horizontal scrolling on any device
- [ ] Images and media are responsive
- [ ] Navigation works on all screen sizes
- [ ] Forms are mobile-friendly
- [ ] Performance is optimized for mobile
- [ ] Accessibility standards are met
- [ ] Cross-browser compatibility is ensured

This responsive design system ensures that the Mnemine application provides an optimal user experience across all devices and screen sizes.
