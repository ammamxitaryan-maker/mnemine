// Centralized import management for better tree-shaking and performance

// UI Components
export * from '@/components/ui/smart-card';
export * from '@/components/ui/cta-button';
export * from '@/components/ui/enhanced-tabs';
export * from '@/components/ui/enhanced-accordion';

// Page Layouts
export * from '@/components/pages';

// Hooks
export * from '@/hooks/usePageData';
export * from '@/hooks/useTelegramAuth';
export * from '@/hooks/useOptimizedData';
export * from '@/hooks/useClaimEarnings';
export * from '@/hooks/useReinvest';

// Utils
export * from '@/utils/toast';

// Types
export type { AuthenticatedUser } from '@/types/telegram';
