# Mnemine Layout Template System - Usage Guide

## Quick Start

### 1. Basic Page Layout
```tsx
import { PageLayout, TemplateCard, TemplateButton } from '@/components/layout';

function MyPage() {
  return (
    <PageLayout hasSidebar={false} mainContentPadding="md">
      <TemplateCard>
        <h1>Welcome to My Page</h1>
        <TemplateButton variant="primary">
          Get Started
        </TemplateButton>
      </TemplateCard>
    </PageLayout>
  );
}
```

### 2. Dashboard Layout with Sidebar
```tsx
import { PageLayout, TemplateCard } from '@/components/layout';

function DashboardPage() {
  const sidebar = (
    <div className="space-y-2">
      <TemplateButton variant="ghost" className="w-full justify-start">
        Dashboard
      </TemplateButton>
      <TemplateButton variant="ghost" className="w-full justify-start">
        Analytics
      </TemplateButton>
    </div>
  );

  return (
    <PageLayout 
      hasSidebar={true}
      sidebar={sidebar}
      mainContentPadding="lg"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TemplateCard>
            <h2>Main Content</h2>
            {/* Dashboard content */}
          </TemplateCard>
        </div>
        <div>
          <TemplateCard>
            <h3>Sidebar</h3>
            {/* Sidebar content */}
          </TemplateCard>
        </div>
      </div>
    </PageLayout>
  );
}
```

### 3. Mobile-First Layout
```tsx
import { PageLayout, TemplateCard, useResponsiveLayout } from '@/components/layout';

function MobilePage() {
  const { isMobile } = useResponsiveLayout();

  return (
    <PageLayout 
      hasSidebar={false}
      mainContentPadding={isMobile ? 'sm' : 'md'}
    >
      <div className="space-y-4">
        <TemplateCard padding="sm">
          <h2>Mobile Optimized</h2>
          <p>This content is optimized for mobile devices.</p>
        </TemplateCard>
      </div>
    </PageLayout>
  );
}
```

## Component Examples

### TemplateButton Usage
```tsx
// Primary button
<TemplateButton variant="primary" size="lg" onClick={handleSubmit}>
  Submit
</TemplateButton>

// Secondary button
<TemplateButton variant="secondary" size="md">
  Cancel
</TemplateButton>

// Ghost button
<TemplateButton variant="ghost" size="sm">
  Learn More
</TemplateButton>

// Disabled button
<TemplateButton disabled>
  Processing...
</TemplateButton>
```

### TemplateInput Usage
```tsx
// Basic input
<TemplateInput
  label="Email"
  type="email"
  placeholder="Enter your email"
/>

// Input with error
<TemplateInput
  label="Password"
  type="password"
  error="Password is required"
/>

// Input with helper text
<TemplateInput
  label="Username"
  helperText="Choose a unique username"
/>
```

### TemplateCard Usage
```tsx
// Basic card
<TemplateCard>
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</TemplateCard>

// Card with custom padding
<TemplateCard padding="lg">
  <h3>Large Padding</h3>
  <p>This card has more padding.</p>
</TemplateCard>

// Card without hover effects
<TemplateCard hover={false}>
  <h3>Static Card</h3>
  <p>This card doesn't have hover effects.</p>
</TemplateCard>
```

## Layout Patterns

### 1. Hero Section
```tsx
<PageLayout hasSidebar={false}>
  <div className="text-center py-12">
    <h1 className="heading heading-1 mb-4">Welcome to Mnemine</h1>
    <p className="text-lg text-muted-foreground mb-8">
      The ultimate mining experience
    </p>
    <TemplateButton variant="primary" size="lg">
      Get Started
    </TemplateButton>
  </div>
</PageLayout>
```

### 2. Feature Grid
```tsx
<PageLayout hasSidebar={false}>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {features.map((feature) => (
      <TemplateCard key={feature.id}>
        <div className="text-center">
          <feature.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="heading heading-3 mb-2">{feature.title}</h3>
          <p className="text-muted-foreground">{feature.description}</p>
        </div>
      </TemplateCard>
    ))}
  </div>
</PageLayout>
```

### 3. Form Layout
```tsx
<PageLayout hasSidebar={false}>
  <div className="max-w-md mx-auto">
    <TemplateCard>
      <h2 className="heading heading-2 mb-6">Sign Up</h2>
      <form className="space-y-4">
        <TemplateInput
          label="Full Name"
          placeholder="Enter your full name"
        />
        <TemplateInput
          label="Email"
          type="email"
          placeholder="Enter your email"
        />
        <TemplateInput
          label="Password"
          type="password"
          placeholder="Create a password"
        />
        <TemplateButton variant="primary" className="w-full">
          Create Account
        </TemplateButton>
      </form>
    </TemplateCard>
  </div>
</PageLayout>
```

### 4. Dashboard with Stats
```tsx
<PageLayout hasSidebar={true} sidebar={<DashboardSidebar />}>
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <TemplateCard>
        <div className="text-center">
          <h3 className="text-2xl font-bold text-primary">1,234</h3>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </div>
      </TemplateCard>
      {/* More stat cards... */}
    </div>

    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TemplateCard>
        <h3 className="heading heading-3 mb-4">Recent Activity</h3>
        {/* Activity list */}
      </TemplateCard>
      <TemplateCard>
        <h3 className="heading heading-3 mb-4">Quick Actions</h3>
        {/* Quick actions */}
      </TemplateCard>
    </div>
  </div>
</PageLayout>
```

## Responsive Utilities

### Using the Responsive Hook
```tsx
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

function ResponsiveComponent() {
  const { isMobile, isTablet, isDesktop, width } = useResponsiveLayout();

  return (
    <div className={`grid ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
      {/* Content */}
    </div>
  );
}
```

### Using Layout Utils
```tsx
import { getResponsiveClasses, getOptimalButtonSize } from '@/utils/layoutUtils';

function DynamicComponent() {
  const [width, setWidth] = useState(1024);

  const buttonSize = getOptimalButtonSize(width);
  const classes = getResponsiveClasses(width, {
    mobile: 'text-sm',
    tablet: 'text-base',
    desktop: 'text-lg'
  });

  return (
    <TemplateButton size={buttonSize} className={classes}>
      Responsive Button
    </TemplateButton>
  );
}
```

## Best Practices

1. **Always use PageLayout for full pages** - It provides the complete responsive structure
2. **Use semantic HTML** - Proper heading hierarchy and semantic elements
3. **Consistent spacing** - Use the provided spacing classes
4. **Mobile-first design** - Design for mobile first, then enhance
5. **Accessibility** - Ensure proper contrast and keyboard navigation
6. **Performance** - Use the responsive hook efficiently to avoid unnecessary re-renders

## Migration Guide

### From Old Layout to New Template

1. **Replace custom containers** with `PageLayout`
2. **Replace custom buttons** with `TemplateButton`
3. **Replace custom inputs** with `TemplateInput`
4. **Replace custom cards** with `TemplateCard`
5. **Use responsive utilities** instead of custom media queries

### Example Migration
```tsx
// Before
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
  <div className="relative w-full max-w-7xl mx-auto px-4 py-6">
    <div className="space-y-8">
      {/* Content */}
    </div>
  </div>
</div>

// After
<PageLayout hasSidebar={false} mainContentPadding="md">
  <div className="space-y-8">
    {/* Content */}
  </div>
</PageLayout>
```

This template system provides a consistent, responsive foundation for your entire Mnemine application!
