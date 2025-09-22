import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Final simplified imports
import IndexFinal from "./pages/IndexFinal";
import NotFound from "./pages/NotFound";
import Menu from "./pages/Menu";
import WalletSimplified from "./pages/WalletSimplified";
import TasksSimplified from "./pages/TasksSimplified";
import SlotsSimplified from "./pages/SlotsSimplified";
import Swap from "./pages/Swap";

// Keep essential pages
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Referrals from "./pages/Referrals";
import Leaderboard from "./pages/Leaderboard";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";
import Bonuses from "./pages/Bonuses";
import Lottery from "./pages/Lottery";
import Settings from "./pages/Settings";

// Admin pages
import Admin from "./pages/Admin";
import AdminUserDetail from "./pages/AdminUserDetail";

import { MainLayoutSimplified } from "./components/layout/MainLayoutSimplified";
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

const AppFinal = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WaveBackground />
          <Sonner /> 
          <BrowserRouter>
            <AppInitializer />
            <Routes>
            <Route element={<MainLayoutSimplified />}>
              {/* Main simplified routes */}
              <Route path="/" element={<IndexFinal />} />
              <Route path="/wallet" element={<WalletSimplified />} />
              <Route path="/tasks" element={<TasksSimplified />} />
              <Route path="/slots" element={<SlotsSimplified />} />
              <Route path="/swap" element={<Swap />} />
              <Route path="/menu" element={<Menu />} />
              
              {/* Essential pages accessible through menu */}
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/bonuses" element={<Bonuses />} />
              <Route path="/lottery" element={<Lottery />} />
            </Route>
            
            {/* Standalone pages */}
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Admin routes */}
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

export default AppFinal;
