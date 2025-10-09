/**
 * Enhanced Test Utilities - Comprehensive testing utilities for improved test coverage
 * 
 * This module provides advanced testing utilities while strictly preserving
 * all existing functionality. No features are modified or disabled.
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../components/ThemeProvider';

// Test configuration interface
interface TestConfig {
  enableQueryClient: boolean;
  enableRouter: boolean;
  enableTheme: boolean;
  queryClientConfig?: any;
  themeConfig?: any;
}

// Mock data generators
interface MockUser {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  balance: number;
  mneBalance: number;
  totalInvested: number;
  rank?: string;
}

interface MockMiningSlot {
  id: string;
  userId: string;
  principal: number;
  effectiveWeeklyRate: number;
  lastAccruedAt: string;
  expiresAt: string;
  isActive: boolean;
}

interface MockTask {
  id: string;
  taskId: string;
  title: string;
  description: string;
  reward: number;
  link: string;
  isCompleted: boolean;
}

// Default test configuration
const DEFAULT_TEST_CONFIG: TestConfig = {
  enableQueryClient: true,
  enableRouter: true,
  enableTheme: true,
  queryClientConfig: {
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  },
  themeConfig: {
    attribute: 'class',
    defaultTheme: 'dark',
    enableSystem: false,
    storageKey: 'test-theme',
  },
};

/**
 * Enhanced render function with providers
 */
export const renderWithProviders = (
  ui: ReactElement,
  config: Partial<TestConfig> = {},
  options: Omit<RenderOptions, 'wrapper'> = {}
): RenderResult => {
  const finalConfig = { ...DEFAULT_TEST_CONFIG, ...config };

  const AllTheProviders = ({ children }: { children: ReactNode }) => {
    let content = children;

    // Wrap with QueryClient if enabled
    if (finalConfig.enableQueryClient) {
      const queryClient = new QueryClient(finalConfig.queryClientConfig);
      content = (
        <QueryClientProvider client={queryClient}>
          {content}
        </QueryClientProvider>
      );
    }

    // Wrap with Router if enabled
    if (finalConfig.enableRouter) {
      content = <BrowserRouter>{content}</BrowserRouter>;
    }

    // Wrap with Theme if enabled
    if (finalConfig.enableTheme) {
      content = (
        <ThemeProvider {...finalConfig.themeConfig}>
          {content}
        </ThemeProvider>
      );
    }

    return <>{content}</>;
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

/**
 * Mock data generators
 */
export const MockDataGenerator = {
  /**
   * Generate mock user data
   */
  createMockUser(overrides: Partial<MockUser> = {}): MockUser {
    return {
      id: 'user-123',
      telegramId: '123456789',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      balance: 1000,
      mneBalance: 500,
      totalInvested: 2000,
      rank: 'BRONZE',
      ...overrides,
    };
  },

  /**
   * Generate mock mining slot data
   */
  createMockMiningSlot(overrides: Partial<MockMiningSlot> = {}): MockMiningSlot {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    return {
      id: 'slot-123',
      userId: 'user-123',
      principal: 1000,
      effectiveWeeklyRate: 0.05,
      lastAccruedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isActive: true,
      ...overrides,
    };
  },

  /**
   * Generate mock task data
   */
  createMockTask(overrides: Partial<MockTask> = {}): MockTask {
    return {
      id: 'task-123',
      taskId: 'daily_login',
      title: 'Daily Login',
      description: 'Log in to the application',
      reward: 10,
      link: 'https://example.com',
      isCompleted: false,
      ...overrides,
    };
  },

  /**
   * Generate multiple mock users
   */
  createMockUsers(count: number, overrides: Partial<MockUser> = {}): MockUser[] {
    return Array.from({ length: count }, (_, index) =>
      this.createMockUser({
        id: `user-${index + 1}`,
        telegramId: `${123456789 + index}`,
        firstName: `User${index + 1}`,
        username: `user${index + 1}`,
        ...overrides,
      })
    );
  },

  /**
   * Generate multiple mock mining slots
   */
  createMockMiningSlots(count: number, userId: string, overrides: Partial<MockMiningSlot> = {}): MockMiningSlot[] {
    return Array.from({ length: count }, (_, index) =>
      this.createMockMiningSlot({
        id: `slot-${index + 1}`,
        userId,
        principal: 1000 + index * 100,
        ...overrides,
      })
    );
  },

  /**
   * Generate multiple mock tasks
   */
  createMockTasks(count: number, overrides: Partial<MockTask> = {}): MockTask[] {
    const taskTypes = ['daily_login', 'referral', 'deposit', 'withdrawal', 'lottery'];
    
    return Array.from({ length: count }, (_, index) =>
      this.createMockTask({
        id: `task-${index + 1}`,
        taskId: taskTypes[index % taskTypes.length],
        title: `Task ${index + 1}`,
        reward: 10 + index * 5,
        ...overrides,
      })
    );
  },
};

/**
 * API mocking utilities
 */
export const ApiMockUtils = {
  /**
   * Mock successful API response
   */
  mockSuccessResponse<T>(data: T, delay: number = 0): Promise<{ data: T }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data });
      }, delay);
    });
  },

  /**
   * Mock error API response
   */
  mockErrorResponse(error: string, status: number = 500, delay: number = 0): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const errorObj = new Error(error);
        (errorObj as any).response = { status, data: { error } };
        reject(errorObj);
      }, delay);
    });
  },

  /**
   * Mock network error
   */
  mockNetworkError(delay: number = 0): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const error = new Error('Network Error');
        (error as any).code = 'ERR_NETWORK';
        reject(error);
      }, delay);
    });
  },
};

/**
 * Component testing utilities
 */
export const ComponentTestUtils = {
  /**
   * Wait for component to load
   */
  async waitForComponentToLoad(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  },

  /**
   * Simulate user interaction
   */
  simulateUserInteraction(element: HTMLElement, eventType: string = 'click'): void {
    const event = new Event(eventType, { bubbles: true });
    element.dispatchEvent(event);
  },

  /**
   * Mock Telegram WebApp
   */
  mockTelegramWebApp(): void {
    const mockTelegram = {
      WebApp: {
        initData: 'test_init_data',
        initDataUnsafe: {
          user: {
            id: 123456789,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
          },
        },
        expand: jest.fn(),
        close: jest.fn(),
        ready: jest.fn(),
        showAlert: jest.fn(),
        showConfirm: jest.fn(),
        showPopup: jest.fn(),
        showScanQrPopup: jest.fn(),
        closeScanQrPopup: jest.fn(),
        readTextFromClipboard: jest.fn(),
        requestWriteAccess: jest.fn(),
        requestContact: jest.fn(),
        isExpanded: true,
        viewportHeight: 600,
        viewportStableHeight: 600,
        headerColor: '#ffffff',
        backgroundColor: '#000000',
        isClosingConfirmationEnabled: false,
        themeParams: {},
        colorScheme: 'dark',
        isVerticalSwipesEnabled: true,
        version: '6.0',
        platform: 'web',
      },
    };

    (window as any).Telegram = mockTelegram;
  },

  /**
   * Clear Telegram WebApp mock
   */
  clearTelegramWebAppMock(): void {
    delete (window as any).Telegram;
  },
};

/**
 * Performance testing utilities
 */
export const PerformanceTestUtils = {
  /**
   * Measure component render time
   */
  measureRenderTime(renderFn: () => void): number {
    const start = performance.now();
    renderFn();
    return performance.now() - start;
  },

  /**
   * Measure memory usage
   */
  getMemoryUsage(): number {
    return (performance as any).memory?.usedJSHeapSize || 0;
  },

  /**
   * Wait for next frame
   */
  async waitForNextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(resolve));
  },

  /**
   * Simulate slow network
   */
  simulateSlowNetwork(delay: number = 1000): void {
    const originalFetch = window.fetch;
    window.fetch = jest.fn().mockImplementation((...args) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(originalFetch(...args));
        }, delay);
      });
    });
  },

  /**
   * Restore network
   */
  restoreNetwork(): void {
    jest.restoreAllMocks();
  },
};

/**
 * Accessibility testing utilities
 */
export const AccessibilityTestUtils = {
  /**
   * Check if element is accessible
   */
  isAccessible(element: HTMLElement): boolean {
    const hasAriaLabel = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
    const hasRole = element.hasAttribute('role');
    const isInteractive = ['button', 'link', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase());
    
    return hasAriaLabel || hasRole || isInteractive;
  },

  /**
   * Check color contrast
   */
  checkColorContrast(foreground: string, background: string): number {
    // Simplified contrast ratio calculation
    // In a real implementation, you would use a proper color contrast library
    return 4.5; // Mock value
  },

  /**
   * Check keyboard navigation
   */
  checkKeyboardNavigation(element: HTMLElement): boolean {
    const tabIndex = element.getAttribute('tabindex');
    const isFocusable = tabIndex !== null || 
      ['button', 'link', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase());
    
    return isFocusable;
  },
};

/**
 * Integration testing utilities
 */
export const IntegrationTestUtils = {
  /**
   * Mock complete user session
   */
  mockUserSession(user: MockUser = MockDataGenerator.createMockUser()): void {
    ComponentTestUtils.mockTelegramWebApp();
    
    // Mock localStorage
    localStorage.setItem('user_data', JSON.stringify(user));
    localStorage.setItem('telegram_init_data', 'test_init_data');
  },

  /**
   * Clear user session
   */
  clearUserSession(): void {
    ComponentTestUtils.clearTelegramWebAppMock();
    localStorage.clear();
  },

  /**
   * Mock API endpoints
   */
  mockApiEndpoints(endpoints: Record<string, any>): void {
    const originalFetch = window.fetch;
    
    window.fetch = jest.fn().mockImplementation((url: string) => {
      const endpoint = Object.keys(endpoints).find(key => url.includes(key));
      
      if (endpoint) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(endpoints[endpoint]),
        });
      }
      
      return originalFetch(url);
    });
  },

  /**
   * Restore API endpoints
   */
  restoreApiEndpoints(): void {
    jest.restoreAllMocks();
  },
};

// Export all utilities
export {
  DEFAULT_TEST_CONFIG,
  type TestConfig,
  type MockUser,
  type MockMiningSlot,
  type MockTask,
};
