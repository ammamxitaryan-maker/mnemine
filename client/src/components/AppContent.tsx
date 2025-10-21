import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminAnalytics from "../pages/admin/AdminAnalytics";
import AdminDashboardUltraCompact from "../pages/admin/AdminDashboardUltraCompact";
import AdminExchange from "../pages/admin/AdminExchange";
import AdminLogs from "../pages/admin/AdminLogs";
import { AdminNotificationsPage } from "../pages/admin/AdminNotifications";
import AdminProcessing from "../pages/admin/AdminProcessing";
import AdminSettings from "../pages/admin/AdminSettings";
import AdminTransactions from "../pages/admin/AdminTransactions";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminDashboardCompact from "../pages/AdminDashboardCompact";
import AdminLogin from "../pages/AdminLogin";
import AdminLottery from "../pages/AdminLottery";
import AdminPanel from "../pages/AdminPanel";
import AdminStaff from "../pages/AdminStaff";
import AdminUserDetail from "../pages/AdminUserDetail";
import Deposit from "../pages/Deposit";
import Index from "../pages/Index";
import InvestmentSlots from "../pages/InvestmentSlots";
import Leaderboard from "../pages/Leaderboard";
import Lottery from "../pages/Lottery";
import LotteryHistory from "../pages/LotteryHistory";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile";
import Referrals from "../pages/Referrals";
import Settings from "../pages/Settings";
import Slots from "../pages/Slots";
import Stats from "../pages/Stats";
import USDTPayment from "../pages/USDTPayment";
import Wallet from "../pages/Wallet";
import Withdraw from "../pages/Withdraw";
import { AppInitializer } from "./AppInitializer";
import GlassGlowOverlay from "./GlassGlowOverlay";
import { AdminLayoutCompact } from "./layout/AdminLayoutCompact";
import { AdminRoute } from "./layout/AdminRoute";
import { MainLayout } from "./layout/MainLayout";
import { MinimalistLayout } from "./layout/MinimalistLayout";
import { LoadingTest } from "./LoadingTest";
import { LocalDevAuth } from "./LocalDevAuth";
import { PaymentSuccess } from "./PaymentSuccess";
import { ViewportOptimizer } from "./ViewportOptimizer";
import WaveBackground from "./WaveBackground";

export const AppContent: React.FC = () => {
  return (
    <>
      <WaveBackground />
      <GlassGlowOverlay />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AppInitializer />
        <ViewportOptimizer />
        <LocalDevAuth />
        <Routes>
          {/* Routes with the minimalist layout */}
          <Route element={<MinimalistLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
          </Route>

          {/* Individual page routes */}
          <Route path="/slots" element={<Slots />} />
          <Route path="/lottery" element={<Lottery />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile />} />

          {/* Routes with the main layout for other pages */}
          <Route element={<MainLayout />}>
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/investment-slots" element={<InvestmentSlots />} />
            <Route path="/stats" element={<Stats />} />
          </Route>

          {/* Routes without the main layout (modal-like pages) */}
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/payment/usdt" element={<USDTPayment />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/lottery-history" element={<LotteryHistory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/loading-test" element={<LoadingTest />} />

          {/* Admin Login Route - Not protected */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Admin Routes - Protected by AdminRoute component */}
          {/* Only user with Telegram ID '6760298907' can access these routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayoutCompact />}>
              <Route path="/admin" element={<AdminDashboardUltraCompact />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/transactions" element={<AdminTransactions />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/lottery" element={<AdminLottery />} />
              <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
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
      </BrowserRouter>
    </>
  );
};
