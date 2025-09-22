# 🎨 Modern Design System

## Overview
A unified design system for all application pages, ensuring symmetry, balance, and a modern appearance.

## Core Components

### 1. PageLayout
Universal component for all pages with consistent header and navigation.

```tsx
import { PageLayout } from '@/components/PageLayout';
import { SomeIcon } from 'lucide-react';

<PageLayout
  title="Page Title"
  subtitle="Optional subtitle"
  icon={SomeIcon}
  iconColor="from-blue-500 to-indigo-600" // or any other gradient
>
  {/* Page content */}
</PageLayout>
```

### 2. ModernCard
Modern card with animations and hover effects.

```tsx
import { ModernCard } from '@/components/ModernCard';
import { SomeIcon } from 'lucide-react';

<ModernCard
  title="Card Title"
  icon={SomeIcon}
  iconColor="from-green-500 to-emerald-600"
  delay={0.1} // animation delay
  hoverEffect={true}
>
  {/* Card content */}
</ModernCard>
```

## Color Palette

### Icon gradients:
- **Blue**: `from-blue-500 to-indigo-600`
- **Green**: `from-green-500 to-emerald-600`
- **Purple**: `from-purple-500 to-pink-600`
- **Yellow**: `from-yellow-500 to-orange-600`
- **Red**: `from-red-500 to-rose-600`

### Page backgrounds:
```css
bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30
```

## Grid and Spacing

### Main grid:
```tsx
<div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Sections:
```tsx
<motion.section 
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ delay: 0.2, duration: 0.5 }}
>
  {/* Elements */}
</motion.section>
```

## Animations

### Basic animations:
```tsx
// Appearance
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}

// Hover effect
whileHover={{ y: -4 }}
transition={{ type: "spring", stiffness: 300, damping: 20 }}

// Delays for sequential elements
transition={{ delay: 0.1 + index * 0.1 }}
```

## Complete Page Example

```tsx
import React from 'react';
import { PageLayout } from '@/components/PageLayout';
import { ModernCard } from '@/components/ModernCard';
import { motion } from 'framer-motion';
import { SomeIcon } from 'lucide-react';

const MyPage = () => {
  return (
    <PageLayout
      title="My Page"
      subtitle="Page description"
      icon={SomeIcon}
      iconColor="from-blue-500 to-indigo-600"
    >
      <div className="space-y-8">
        {/* Statistics */}
        <motion.section 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <ModernCard
            title="Stat 1"
            icon={SomeIcon}
            iconColor="from-blue-500 to-indigo-600"
            delay={0.1}
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">123</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
            </div>
          </ModernCard>
        </motion.section>

        {/* Main content */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {/* Your content */}
        </motion.section>
      </div>
    </PageLayout>
  );
};
```

## CSS Utilities

### Glass effects:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}
```

### Gradient text:
```css
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## Principles

1. **Symmetry**: All elements aligned to grid
2. **Balance**: Even content distribution
3. **Consistency**: Uniform spacing, sizes, colors
4. **Animations**: Smooth transitions and micro-interactions
5. **Responsiveness**: Works on all devices
6. **Modernity**: Glass effects, gradients, shadows