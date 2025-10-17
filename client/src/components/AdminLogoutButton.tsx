import { Button } from '@/components/ui/button';
import { clearAdminPasswordVerification } from '@/utils/adminAuth';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminLogoutButtonProps {
  className?: string;
}

export const AdminLogoutButton = ({ className }: AdminLogoutButtonProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear password verification
    clearAdminPasswordVerification();
    console.log('[ADMIN_LOGOUT] Password verification cleared');

    // Navigate to main page
    navigate('/');
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      size="sm"
      className={`text-gray-400 hover:text-white border-gray-600 hover:border-gray-500 ${className}`}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Выйти
    </Button>
  );
};
