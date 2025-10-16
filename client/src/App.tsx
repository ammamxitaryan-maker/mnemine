import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Referrals from "./pages/Referrals";
import Leaderboard from "./pages/Leaderboard";
import Slots from "./pages/Slots";
import InvestmentSlots from "./pages/InvestmentSlots";
import Wallet from "./pages/Wallet";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Profile from "./pages/Profile";
import Lottery from "./pages/Lottery";
import LotteryHistory from "./pages/LotteryHistory";
import Admin from "./pages/Admin";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminStaff from "./pages/AdminStaff";
import AdminLottery from "./pages/AdminLottery";
import AdminPanel from "./pages/AdminPanel";
import AdminDashboardCompact from "./pages/AdminDashboardCompact";
import { AdminLayout } from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminProcessing from "./pages/admin/AdminProcessing";
import AdminExchange from "./pages/admin/AdminExchange";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminSettings from "./pages/admin/AdminSettings";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import { MainLayout } from "./components/layout/MainLayout";
import { MinimalistLayout } from "./components/layout/MinimalistLayout";
import { AdminRoute } from "./components/layout/AdminRoute";
import WaveBackground from "./components/WaveBackground";
import GlassGlowOverlay from "./components/GlassGlowOverlay"; // Import the new component
import { AppInitializer } from "./components/AppInitializer"; // Import the new component
import { ViewportOptimizer } from "./components/ViewportOptimizer"; // Import the new component
import { LocalDevAuth } from "./components/LocalDevAuth"; // Import the local dev auth component
import { DevWarning } from "./components/DevWarning"; // Import the dev warning component
import { EarningsWrapper } from "./components/EarningsWrapper";
import { AutoLanguageInitializer } from "./components/AutoLanguageInitializer";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WaveBackground />
        <GlassGlowOverlay /> {/* Add the new component here */}
        <DevWarning /> {/* Development warnings */}
        <Sonner /> 
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
                 <AppInitializer /> {/* Render AppInitializer inside BrowserRouter */}
                 <ViewportOptimizer /> {/* Render ViewportOptimizer for Telegram Web App */}
                 <LocalDevAuth /> {/* Local development auth switcher */}
                 <AutoLanguageInitializer> {/* Auto language detection */}
            <Routes>
            {/* Routes with the minimalist layout */}
            <Route element={<MinimalistLayout />}>
              <Route path="/" element={<Index />} />
            </Route>
            
            {/* Individual page routes */}
            <Route path="/slots" element={<Slots />} />
            <Route path="/lottery" element={<Lottery />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Routes with the main layout for other pages */}
            <Route element={<MainLayout />}>
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/investment-slots" element={<InvestmentSlots />} />
              <Route path="/stats" element={<Stats />} />
            </Route>
            
            {/* Routes without the main layout (modal-like pages) */}
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/lottery-history" element={<LotteryHistory />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Admin Routes - Protected by AdminRoute component */}
            {/* Only user with Telegram ID '6760298907' can access these routes */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/transactions" element={<AdminTransactions />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/lottery" element={<AdminLottery />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/processing" element={<AdminProcessing />} />
                <Route path="/admin/exchange" element={<AdminExchange />} />
                <Route path="/admin/logs" element={<AdminLogs />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/user/:userId" element={<AdminUserDetail />} />
                <Route path="/admin/staff" element={<AdminStaff />} />
              </Route>
            </Route>
            
            {/* Legacy Admin Panel Route - Now protected */}
            <Route element={<AdminRoute />}>
              <Route path="/admin-panel" element={<AdminPanel />} />
              <Route path="/admin/dashboard" element={<AdminDashboardCompact />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
            </Routes>
                 </AutoLanguageInitializer>
               </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;