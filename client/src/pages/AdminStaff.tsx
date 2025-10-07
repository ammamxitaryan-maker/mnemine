import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

const AdminStaff = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useTelegramAuth();
  const [telegramId, setTelegramId] = useState('');
  const [role, setRole] = useState('STAFF');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddAdmin = async () => {
    if (!telegramId.trim()) {
      setMessage('Please enter a Telegram ID');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/admin/admins/add', {
        telegramId: telegramId.trim()
      });

      setMessage(`✅ ${response.data.message}`);
      setTelegramId('');
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.error || 'Error adding admin'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!telegramId.trim()) {
      setMessage('Please enter a Telegram ID');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/admin/staff/add', {
        telegramId: telegramId.trim(),
        role: role,
        permissions: []
      });

      setMessage(`✅ ${response.data.message}`);
      setTelegramId('');
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.error || 'Error adding staff'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
        <PageHeader titleKey="admin.staff" backTo="/admin" />

        {/* Add Admin Section (only for main admin) */}
        {(() => {
          const ADMIN_TELEGRAM_IDS = import.meta.env.VITE_ADMIN_TELEGRAM_IDS 
            ? import.meta.env.VITE_ADMIN_TELEGRAM_IDS.split(',').map((id: string) => id.trim())
            : ['6760298907'];
          return user ? ADMIN_TELEGRAM_IDS.includes(user.telegramId) : false;
        })() && (
          <div className="bg-gray-900 border border-gray-700 p-4 mb-4">
            <h3 className="text-white font-bold mb-3">Add Admin</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Telegram ID"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              />
              <button
                onClick={handleAddAdmin}
                disabled={loading}
                className="w-full bg-red-600 text-white p-2 rounded disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Admin'}
              </button>
            </div>
          </div>
        )}

        {/* Add Staff Section */}
        <div className="bg-gray-900 border border-gray-700 p-4 mb-4">
          <h3 className="text-white font-bold mb-3">Add Staff Member</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Telegram ID"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
            >
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
            </select>
            <button
              onClick={handleAddStaff}
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Staff'}
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded mb-4 ${
            message.includes('✅') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-900 border border-gray-700 p-4">
          <h3 className="text-white font-bold mb-2">Instructions</h3>
          <div className="text-sm text-gray-300 space-y-1">
            <p>• Only the main administrator can add other admins</p>
            <p>• Staff members can be MANAGER or STAFF role</p>
            <p>• Enter the user's Telegram ID to promote them</p>
            <p>• The user must exist in the system first</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStaff;