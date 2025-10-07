"use client";

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Loader2,
  UserX,
  UserCheck,
  Ban,
  Shield,
  Trash2,
  UserCog
} from 'lucide-react';

interface BulkActionsProps {
  selectedUsers: string[];
  onClose: () => void;
  onSuccess: () => void;
}

interface BulkResult {
  userId: string;
  action: string;
  success: boolean;
  newRole?: string;
  userInfo?: Record<string, unknown>;
}

interface BulkError {
  userId: string;
  error: string;
  success: boolean;
}

const BulkActions = ({ selectedUsers, onClose, onSuccess }: BulkActionsProps) => {
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkResult[]>([]);
  const [errors, setErrors] = useState<BulkError[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleBulkAction = async () => {
    if (!action) {
      alert('Please select an action');
      return;
    }

    if (action === 'changeRole' && !newRole) {
      alert('Please select a new role');
      return;
    }

    if (action === 'delete' && !window.confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setResults([]);
    setErrors([]);

    try {
      const response = await api.post('/admin/users/bulk-actions', {
        userIds: selectedUsers,
        action,
        reason,
        newRole: action === 'changeRole' ? newRole : undefined,
        adminId: '6760298907' // Admin Telegram ID
      });

      setResults(response.data.data.results || []);
      setErrors(response.data.data.errors || []);
      setShowResults(true);
      
      if (response.data.data.summary.failed === 0) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error('Bulk action error:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Unknown error';
      alert(`Failed to perform bulk action: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'freeze': return <UserX className="h-4 w-4" />;
      case 'unfreeze': return <UserCheck className="h-4 w-4" />;
      case 'ban': return <Ban className="h-4 w-4" />;
      case 'unban': return <UserCheck className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'changeRole': return <UserCog className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'freeze':
      case 'ban':
      case 'delete':
        return 'text-red-400';
      case 'unfreeze':
      case 'unban':
        return 'text-green-400';
      case 'changeRole':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  if (showResults) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="bg-gray-900 border-gray-700 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Bulk Action Results</span>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-white">{selectedUsers.length}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
              <div className="bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{results.length}</div>
                <div className="text-sm text-gray-400">Successful</div>
              </div>
              <div className="bg-red-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-400">{errors.length}</div>
                <div className="text-sm text-gray-400">Failed</div>
              </div>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Successful Operations</h3>
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between bg-green-900/20 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-white">User {result.userId}</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          {result.action}
                        </Badge>
                        {result.newRole && (
                          <Badge variant="outline" className="text-blue-400 border-blue-400">
                            Role: {result.newRole}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Failed Operations</h3>
                <div className="space-y-2">
                  {errors.map((error, index) => (
                    <div key={index} className="flex items-center justify-between bg-red-900/20 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span className="text-white">User {error.userId}</span>
                        <span className="text-red-400 text-sm">{error.error}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={onSuccess}>
                Refresh Users
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="bg-gray-900 border-gray-700 w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bulk User Actions</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selected Users Count */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">{selectedUsers.length} users selected</span>
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Action
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={action === 'freeze' ? 'default' : 'outline'}
                  onClick={() => setAction('freeze')}
                  className="justify-start"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Freeze Accounts
                </Button>
                <Button
                  variant={action === 'unfreeze' ? 'default' : 'outline'}
                  onClick={() => setAction('unfreeze')}
                  className="justify-start"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Unfreeze Accounts
                </Button>
                <Button
                  variant={action === 'ban' ? 'default' : 'outline'}
                  onClick={() => setAction('ban')}
                  className="justify-start"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Ban Accounts
                </Button>
                <Button
                  variant={action === 'unban' ? 'default' : 'outline'}
                  onClick={() => setAction('unban')}
                  className="justify-start"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Unban Accounts
                </Button>
                <Button
                  variant={action === 'changeRole' ? 'default' : 'outline'}
                  onClick={() => setAction('changeRole')}
                  className="justify-start"
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Change Role
                </Button>
                <Button
                  variant={action === 'delete' ? 'default' : 'outline'}
                  onClick={() => setAction('delete')}
                  className="justify-start text-red-400 border-red-600 hover:bg-red-600/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Accounts
                </Button>
              </div>
            </div>

            {/* Role Selection for Change Role */}
            {action === 'changeRole' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="">Select Role</option>
                  <option value="USER">User</option>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            )}

            {/* Reason Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason (Optional)
              </label>
              <Input
                placeholder="Enter reason for this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-gray-800 border-gray-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={loading || !action}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {getActionIcon(action)}
                  <span className="ml-2">
                    {action === 'changeRole' ? 'Change Roles' : 
                     action === 'delete' ? 'Delete Users' :
                     action ? `Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}` : 
                     'Select Action'}
                  </span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkActions;
