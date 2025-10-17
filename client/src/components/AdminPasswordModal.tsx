import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { verifyAdminPassword, getLockoutInfo } from '@/utils/adminAuth';
import { Eye, EyeOff, Lock, Shield, AlertTriangle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AdminPasswordModalProps {
  onPasswordCorrect: () => void;
}

export const AdminPasswordModal = ({ onPasswordCorrect }: AdminPasswordModalProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{ isLocked: boolean; remainingTime?: number }>({ isLocked: false });

  // Проверяем состояние блокировки
  useEffect(() => {
    const checkLockout = () => {
      const info = getLockoutInfo();
      setLockoutInfo(info);
    };
    
    checkLockout();
    const interval = setInterval(checkLockout, 1000); // Проверяем каждую секунду
    
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lockoutInfo.isLocked) {
      setError('Аккаунт заблокирован из-за слишком большого количества неудачных попыток.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (verifyAdminPassword(password)) {
      onPasswordCorrect();
    } else {
      const newLockoutInfo = getLockoutInfo();
      setLockoutInfo(newLockoutInfo);
      
      if (newLockoutInfo.isLocked) {
        setError('Аккаунт заблокирован из-за слишком большого количества неудачных попыток.');
      } else {
        setError('Неверный пароль. Попробуйте снова.');
      }
      setPassword('');
    }

    setIsLoading(false);
  };

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-purple-600 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl text-white">Доступ к админ панели</CardTitle>
          <CardDescription className="text-gray-400">
            Введите пароль для доступа к административной панели.<br />
            Пароль будет запомнен на время текущей сессии.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lockoutInfo.isLocked ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="p-3 bg-red-600 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">Аккаунт заблокирован</h3>
                <p className="text-gray-400 mb-4">
                  Слишком много неудачных попыток входа. Попробуйте снова через:
                </p>
                <div className="flex items-center justify-center space-x-2 text-2xl font-mono text-red-400">
                  <Clock className="h-6 w-6" />
                  <span>{lockoutInfo.remainingTime ? formatTime(lockoutInfo.remainingTime) : '0:00'}</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                    required
                    autoFocus
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {error && (
                  <p className="text-sm text-red-400 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {error}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? 'Проверка...' : 'Войти'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
