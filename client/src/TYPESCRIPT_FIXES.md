# TypeScript 'any' Type Fixes

## Summary
Fixed multiple `any` types in the codebase to use proper TypeScript types. This document outlines the changes made and provides guidance for fixing remaining issues.

## Changes Made

### 1. Created Error Handling Utilities
- **File**: `client/src/types/errors.ts`
- **Purpose**: Centralized error type definitions and utilities
- **Key Types**:
  - `ApiError` interface for API error responses
  - `getErrorMessage()` utility function
  - `isApiError()` type guard

### 2. Fixed WebSocket Types
- **File**: `client/src/hooks/useWebSocketOptimized.tsx`
- **Change**: `data: any` → `data: Record<string, unknown>`

### 3. Fixed Queue Management Types
- **File**: `client/src/pages/admin/AdminQueueManagement.tsx`
- **Change**: `payload: any` → `payload: Record<string, unknown>`

### 4. Fixed Transaction Types
- **File**: `client/src/pages/admin/AdminTransactions.tsx`
- **Change**: `metadata: any` → `metadata: Record<string, unknown>`

### 5. Fixed Swap Interface Types
- **File**: `client/src/components/SwapInterface.tsx`
- **Changes**:
  - `lastSwap: any` → `lastSwap: { MNEAmount?: number; USDAmount?: number; rate?: number } | null`
  - Error handling: `error: any` → `error: unknown` with proper type guards

### 6. Fixed Telegram Auth Types
- **File**: `client/src/hooks/useTelegramAuth.tsx`
- **Change**: `user: any` → `user: Record<string, unknown>` with proper type casting

### 7. Fixed Local Earnings Cache Types
- **File**: `client/src/hooks/useLocalEarningsCache.ts`
- **Changes**:
  - Added `SlotData` interface
  - `serverSlotsData: any[]` → `serverSlotsData: SlotData[]`
  - `calculateEarningsPerSecond(slots: any[])` → `calculateEarningsPerSecond(slots: SlotData[])`

### 8. Fixed Bulk Actions Types
- **File**: `client/src/components/admin/BulkActions.tsx`
- **Changes**:
  - `userInfo?: any` → `userInfo?: Record<string, unknown>`
  - Error handling: `error: any` → `error: unknown`

## Remaining Issues

There are still approximately 71 `any` types remaining in the codebase. The most common patterns are:

1. **Error handling in catch blocks** - Use `error: unknown` instead of `error: any`
2. **API response data** - Use `Record<string, unknown>` or specific interfaces
3. **Form data** - Use proper form interfaces
4. **User data** - Use `Record<string, unknown>` or specific user interfaces
5. **Array data** - Use proper array type definitions

## Recommended Next Steps

1. **Systematic Approach**: Fix files one by one, starting with the most critical ones
2. **Use Type Guards**: Create type guards for common data structures
3. **Create Interfaces**: Define proper interfaces for API responses
4. **Error Handling**: Use the centralized error handling utilities
5. **Gradual Migration**: Fix types incrementally to avoid breaking changes

## Common Patterns to Fix

### Error Handling
```typescript
// Before
catch (error: any) {
  const message = error.response?.data?.error || error.message;
}

// After
catch (error: unknown) {
  const message = getErrorMessage(error, 'Default error message');
}
```

### API Responses
```typescript
// Before
const data: any = response.data;

// After
const data: Record<string, unknown> = response.data;
// Or better yet, create specific interfaces
const data: ApiResponse<UserData> = response.data;
```

### Form Data
```typescript
// Before
const formData: any = {};

// After
const formData: Record<string, string | number | boolean> = {};
```

## Files with Most Remaining Issues

Based on the linting output, focus on these files:
- Admin dashboard components
- Hook files with API calls
- Form components
- Data processing utilities

## Testing

After making changes, run:
```bash
npx eslint src --no-error-on-unmatched-pattern
```

This will show remaining `any` type issues that need to be addressed.
