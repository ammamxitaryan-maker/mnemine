import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Boosters from "./pages/Boosters";
import Referrals from "./pages/Referrals";
import Leaderboard from "./pages/Leaderboard";
import Tasks from "./pages/Tasks";
import Slots from "./pages/Slots";
import Wallet from "./pages/Wallet";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";
import Bonuses from "./pages/Bonuses";
import Lottery from "./pages/Lottery";
import LotteryHistory from "./pages/LotteryHistory";
import Admin from "./pages/Admin";
import AdminUserDetail from "./pages/AdminUserDetail";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import AdvancedTradingPage from "./pages/AdvancedTradingPage";
import AnalyticsPage from "./pages/AnalyticsPage"; // Import new page
import { MainLayout } from "./components/layout/MainLayout";
import { AdminRoute } from "./components/layout/AdminRoute";
import WaveBackground from "./components/WaveBackground";
import { AppInitializer } from "./components/AppInitializer";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AxiosError } from "axios";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: AxiosError | Error) => {
        if (error instanceof AxiosError && error.response && error.response.status >= 400 && error.response.status < 500) {
          return false;
        }
        if (error?.message?.includes('Network Error') && failureCount >= 1) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      networkMode: 'online',
      meta: {
        errorMessage: 'Failed to fetch data. Please try again.',
      },
    },
    mutations: {
      retry: (failureCount, error: AxiosError | Error) => {
        if (error instanceof AxiosError && error.response && error.response.status >= 400 && error.response.status < 500) {
          return false;
        }
        if (error?.message?.includes('Network Error')) {
          return false;
        }
        return failureCount < 2;
      },
      networkMode: 'online',
      meta: {
        errorMessage: 'Operation failed. Please try again.',
      },
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WaveBackground />
          <Sonner /> 
          <BrowserRouter>
            <AppInitializer />
            <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/boosters" element={<Boosters />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/slots" element={<Slots />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/bonuses" element={<Bonuses />} />
              <Route path="/lottery" element={<Lottery />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/advanced-trading" element={<AdvancedTradingPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} /> {/* New route */}
            </Route>
            
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/lottery-history" element={<LotteryHistory />} />
            <Route path="/settings" element={<Settings />} />
            
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/user/:userId" element={<AdminUserDetail />} />
            </Route>

            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;