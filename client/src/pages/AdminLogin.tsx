"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/types/errors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/admin/login', { password });
      
      if (response.data.success) {
        // Store admin token
        localStorage.setItem('admin_token', response.data.token);
        
        // Redirect to admin dashboard
        navigate('/admin');
      } else {
        setError(response.data.error || 'Login failed');
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Login failed');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-600 rounded-full">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Admin Panel</CardTitle>
            <p className="text-gray-400 text-sm">
              nemesisN3M3616
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Admin Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white pr-10"
                    placeholder="nemesisN3M3616"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-900/50 border border-red-700 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white"
              >
                ← Back to App
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
