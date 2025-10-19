import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import {
  clearAdminPasswordVerification,
  getAdminAuthStatus,
  getLockoutInfo,
  verifyAdminPassword
} from '@/utils/adminAuth';
import { AlertTriangle, Lock, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{ isLocked: boolean; remainingTime?: number }>({ isLocked: false });

  // Check if user is admin
  const adminAuthStatus = user ? getAdminAuthStatus(user.telegramId) : null;
  const isAdmin = adminAuthStatus?.isAdmin || false;

  useEffect(() => {
    if (user && !isAdmin) {
      // User is not admin, redirect to main app
      navigate('/', { replace: true });
    } else if (user && isAdmin && adminAuthStatus?.hasAccess) {
      // User is admin and already has access, redirect to admin panel
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, adminAuthStatus, navigate]);

  useEffect(() => {
    // Check lockout status
    const checkLockout = () => {
      const lockout = getLockoutInfo();
      setLockoutInfo(lockout);
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const isValid = verifyAdminPassword(password);

      if (isValid) {
        // Password is correct, redirect to admin panel
        navigate('/admin', { replace: true });
      } else {
        // Password is incorrect
        const lockout = getLockoutInfo();
        setLockoutInfo(lockout);

        if (lockout.isLocked) {
          setError('Account locked due to too many failed attempts. Please try again later.');
        } else {
          setError('Invalid password. Please try again.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminPasswordVerification();
    navigate('/', { replace: true });
  };

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // If user is not admin, redirect to main app
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If user is admin and already has access, redirect to admin panel
  if (isAdmin && adminAuthStatus?.hasAccess) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your admin password to access the administration panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lockoutInfo.isLocked ? (
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-red-600">Account Locked</h3>
                <p className="text-sm text-muted-foreground">
                  Too many failed login attempts. Please try again in:
                </p>
                <p className="text-2xl font-mono text-red-600">
                  {lockoutInfo.remainingTime ? formatTimeRemaining(lockoutInfo.remainingTime) : '0:00'}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !password.trim()}
                >
                  {isLoading ? 'Verifying...' : 'Login'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <User className="h-4 w-4 mr-2" />
                  Back to Main App
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>Admin access is restricted to authorized personnel only.</p>
            <p>All login attempts are logged and monitored.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
