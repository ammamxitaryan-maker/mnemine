# Mnemine Layout Template System

This layout system provides a comprehensive, responsive template for the entire Mnemine application based on modern CSS Grid and Flexbox patterns.

## Core Components

### 1. AppContainer
The main container that wraps the entire application layout.

```tsx
import { AppContainer } from '@/components/layout/AppContainer';

<AppContainer hasSidebar={true} hasExtraPanel={false}>
  {/* Your content */}
</AppContainer>
```

### 2. PageLayout
A complete page layout with optional sidebar and extra panel.

```tsx
import { PageLayout } from '@/components/layout/PageLayout';

<PageLayout 
  hasSidebar={true}
  hasExtraPanel={false}
  mainContentPadding="md"
  sidebar={<SidebarContent />}
  extraPanel={<ExtraPanelContent />}
>
  {/* Main content */}
</PageLayout>
```

### 3. Sidebar
A responsive sidebar component.

```tsx
import { Sidebar } from '@/components/layout/Sidebar';

<Sidebar isCollapsed={false}>
  {/* Sidebar content */}
</Sidebar>
```

### 4. MainContent
The main content area with configurable padding.

```tsx
import { MainContent } from '@/components/layout/MainContent';

<MainContent padding="md">
  {/* Your content */}
</MainContent>
```

### 5. ExtraPanel
An optional extra panel (hidden on mobile/tablet).

```tsx
import { ExtraPanel } from '@/components/layout/ExtraPanel';

<ExtraPanel isVisible={true}>
  {/* Extra panel content */}
</ExtraPanel>
```

## UI Components

### TemplateButton
Standardized button component with variants and sizes.

```tsx
import { TemplateButton } from '@/components/ui/TemplateButton';

<TemplateButton variant="primary" size="md" onClick={handleClick}>
  Click me
</TemplateButton>
```

**Variants:**
- `primary` - Main action button
- `secondary` - Secondary action button  
- `ghost` - Ghost/outline button

**Sizes:**
- `sm` - Small button
- `md` - Medium button (default)
- `lg` - Large button

### TemplateInput
Standardized input component with label and error handling.

```tsx
import { TemplateInput } from '@/components/ui/TemplateInput';

<TemplateInput
  label="Email"
  placeholder="Enter your email"
  error={errors.email}
  helperText="We'll never share your email"
/>
```

### TemplateCard
Standardized card component with hover effects.

```tsx
import { TemplateCard } from '@/components/ui/TemplateCard';

<TemplateCard hover={true} padding="md">
  {/* Card content */}
</TemplateCard>
```

## Layout Patterns

### 1. Full Page Layout
For pages that need the complete layout system:

```tsx
<PageLayout 
  hasSidebar={true}
  hasExtraPanel={false}
  sidebar={<NavigationSidebar />}
>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <TemplateCard>
      {/* Content */}
    </TemplateCard>
  </div>
</PageLayout>
```

### 2. Mobile-First Layout
For mobile-optimized pages:

```tsx
<PageLayout 
  hasSidebar={false}
  hasExtraPanel={false}
  mainContentPadding="sm"
>
  <div className="space-y-4">
    <TemplateCard>
      {/* Mobile content */}
    </TemplateCard>
  </div>
</PageLayout>
```

### 3. Dashboard Layout
For dashboard-style pages:

```tsx
<PageLayout 
  hasSidebar={true}
  hasExtraPanel={true}
  sidebar={<DashboardSidebar />}
  extraPanel={<StatsPanel />}
>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <TemplateCard>
        {/* Main dashboard content */}
      </TemplateCard>
    </div>
    <div>
      <TemplateCard>
        {/* Sidebar content */}
      </TemplateCard>
    </div>
  </div>
</PageLayout>
```

## Responsive Behavior

The layout system automatically adapts to different screen sizes:

- **Desktop (>1024px)**: Full layout with sidebar and optional extra panel
- **Tablet (768px-1024px)**: Sidebar visible, extra panel hidden
- **Mobile (<768px)**: Sidebar hidden, mobile navigation shown

## CSS Classes

The system provides utility classes for common patterns:

### Spacing
- `p-0`, `p-1`, `p-2`, `p-3`, `p-4`, `p-6`, `p-8` - Padding
- `m-0`, `m-1`, `m-2`, `m-3`, `m-4`, `m-6`, `m-8` - Margin

### Flexbox
- `flex`, `flex-col`, `flex-row` - Flex containers
- `items-center`, `justify-center`, `justify-between` - Flex alignment
- `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-6` - Flex gaps

### Typography
- `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl` - Text sizes
- `heading-1`, `heading-2`, `heading-3` - Heading styles

### Visibility
- `hidden`, `visible` - Basic show/hide
- `hidden-mobile`, `hidden-desktop` - Responsive visibility

## Best Practices

1. **Use PageLayout for full pages** - It provides the complete responsive structure
2. **Consistent spacing** - Use the provided spacing classes for consistency
3. **Mobile-first** - Design for mobile first, then enhance for larger screens
4. **Semantic HTML** - Use proper heading hierarchy and semantic elements
5. **Accessibility** - Ensure proper contrast and keyboard navigation

## Example Implementation

See `IndexTemplate.tsx` for a complete example of how to use the layout system in a real page.
