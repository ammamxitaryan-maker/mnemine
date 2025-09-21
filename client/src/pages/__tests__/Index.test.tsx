import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Index from '../Index';
import { AuthenticatedUser } from '../../types/telegram';

// Mock the hooks
jest.mock('../../hooks/useTelegramAuth', () => ({
  useTelegramAuth: () => ({
    user: mockUser,
    loading: false,
    error: null,
  }),
}));

jest.mock('../../hooks/useOptimizedData', () => ({
  useOptimizedDashboard: () => ({
    userData: mockUserData,
    slotsData: mockSlotsData,
    tasksData: mockTasksData,
    lotteryData: mockLotteryData,
    bonusesData: mockBonusesData,
    achievementsData: mockAchievementsData,
    marketData: mockMarketData,
    isLoading: false,
    hasError: null,
    refetchAll: jest.fn(),
    loadingStates: {
      userData: false,
      slotsData: false,
      tasksData: false,
      lotteryData: false,
      bonusesData: false,
      achievementsData: false,
      marketData: false,
    },
  }),
  useBackgroundSync: jest.fn(),
}));

jest.mock('../../hooks/useClaimEarnings', () => ({
  useClaimEarnings: () => ({
    claim: jest.fn(),
    isClaiming: false,
  }),
}));

jest.mock('../../hooks/useReinvest', () => ({
  useReinvest: () => ({
    reinvest: jest.fn(),
    isReinvesting: false,
  }),
}));

// Mock components
jest.mock('../../components/FlippableCard', () => ({
  FlippableCard: ({ frontContent }: any) => <div data-testid="flippable-card">{frontContent}</div>,
}));

jest.mock('../../components/MainCardFront', () => ({
  MainCardFront: ({ userData }: any) => (
    <div data-testid="main-card-front">
      Balance: {userData?.balance?.toFixed(4)} CFM
    </div>
  ),
}));

jest.mock('../../components/MainCardBack', () => ({
  MainCardBack: () => <div data-testid="main-card-back">Main Card Back</div>,
}));

jest.mock('../../components/HomePageHeader', () => ({
  HomePageHeader: ({ user }: any) => (
    <div data-testid="home-page-header">
      Welcome, {user.firstName}!
    </div>
  ),
}));

jest.mock('../../components/DashboardLinkCard', () => ({
  DashboardLinkCard: ({ title, to }: any) => (
    <div data-testid="dashboard-link-card">
      <a href={to}>{title}</a>
    </div>
  ),
}));

jest.mock('../../components/ProfessionalDashboard', () => ({
  ProfessionalDashboard: () => <div data-testid="professional-dashboard">Professional Dashboard</div>,
}));

jest.mock('../../components/ExchangeRateChart', () => ({
  ExchangeRateChart: () => <div data-testid="exchange-rate-chart">Exchange Rate Chart</div>,
}));

jest.mock('../../components/Earth', () => ({
  __esModule: true,
  default: () => <div data-testid="earth">Earth</div>,
}));

jest.mock('../../components/CacheStats', () => ({
  CacheStats: () => <div data-testid="cache-stats">Cache Stats</div>,
}));

// Mock data
const mockUser: AuthenticatedUser = {
  telegramId: '123456789',
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  avatarUrl: 'https://example.com/avatar.jpg',
  authDate: Date.now(),
  hash: 'mock-hash',
};

const mockUserData = {
  balance: 100.1234,
  totalInvested: 50.0,
  accruedEarnings: 5.6789,
  miningPower: 0.15,
  referralCount: 3,
  rank: 'Bronze',
  miningSlots: [],
};

const mockSlotsData = [
  {
    id: '1',
    principal: 10.0,
    isActive: true,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    effectiveWeeklyRate: 0.05,
  },
];

const mockTasksData = [
  { id: '1', title: 'Complete first investment', isCompleted: false },
  { id: '2', title: 'Refer a friend', isCompleted: true },
];

const mockLotteryData = {
  jackpot: 1000.0,
  nextDraw: new Date(Date.now() + 3600000).toISOString(),
};

const mockBonusesData = {
  claimableCount: 2,
};

const mockAchievementsData = [
  { id: '1', title: 'First Investment', isCompleted: true, isClaimed: false },
  { id: '2', title: 'Referral Master', isCompleted: false, isClaimed: false },
];

const mockMarketData = {
  dailyChange: 2.5,
  weeklyChange: 5.8,
  monthlyChange: 12.3,
  totalUsers: 10000,
  totalVolume: 5000000,
};

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          {children}
        </I18nextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Index Page', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the main page with user data', async () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('home-page-header')).toBeInTheDocument();
      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });
  });

  it('displays user balance correctly', async () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Balance: 100.1234 CFM')).toBeInTheDocument();
    });
  });

  it('renders navigation cards', async () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('dashboard-link-card')).toHaveLength(7);
    });
  });

  it('shows professional view toggle button', async () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Pro View')).toBeInTheDocument();
    });
  });

  it('renders exchange rate chart', async () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('exchange-rate-chart')).toBeInTheDocument();
    });
  });

  it('renders Earth component', async () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('earth')).toBeInTheDocument();
    });
  });

  it('shows cache stats in development mode', async () => {
    const originalEnv = import.meta.env.DEV;
    (import.meta.env as any).DEV = true;

    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('cache-stats')).toBeInTheDocument();
    });

    (import.meta.env as any).DEV = originalEnv;
  });
});

describe('Index Page - Professional View', () => {
  it('switches to professional view when button is clicked', async () => {
    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      const proViewButton = screen.getByText('Pro View');
      proViewButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('professional-dashboard')).toBeInTheDocument();
    });
  });
});

describe('Index Page - Error Handling', () => {
  it('displays error message when data loading fails', async () => {
    // Mock error state
    jest.doMock('../../hooks/useOptimizedData', () => ({
      useOptimizedDashboard: () => ({
        userData: null,
        slotsData: null,
        tasksData: null,
        lotteryData: null,
        bonusesData: null,
        achievementsData: null,
        marketData: null,
        isLoading: false,
        hasError: new Error('Failed to load data'),
        refetchAll: jest.fn(),
        loadingStates: {},
      }),
      useBackgroundSync: jest.fn(),
    }));

    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Data Loading Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', async () => {
    // Mock loading state
    jest.doMock('../../hooks/useOptimizedData', () => ({
      useOptimizedDashboard: () => ({
        userData: null,
        slotsData: null,
        tasksData: null,
        lotteryData: null,
        bonusesData: null,
        achievementsData: null,
        marketData: null,
        isLoading: true,
        hasError: null,
        refetchAll: jest.fn(),
        loadingStates: {},
      }),
      useBackgroundSync: jest.fn(),
    }));

    render(
      <TestWrapper>
        <Index />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Loading your data...')).toBeInTheDocument();
    });
  });
});
