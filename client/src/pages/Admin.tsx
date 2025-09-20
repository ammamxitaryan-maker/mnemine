import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useAdminData, AdminUser } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const Admin = () => {
  const { t } = useTranslation();
  const { data: users, isLoading, error } = useAdminData();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col text-white p-4">
      <PageHeader titleKey="admin.title" backTo="/profile" />

      <Card className="bg-gray-900/80 backdrop-blur-sm border-purple-500">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-500 text-center">Failed to load users. Are you an admin?</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead>User</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Balance (CFM)</TableHead>
                  <TableHead className="text-right">Referrals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user: AdminUser) => (
                  <TableRow 
                    key={user.id} 
                    className="border-gray-800 hover:bg-gray-800 cursor-pointer"
                    onClick={() => navigate(`/admin/user/${user.id}`)}
                  >
                    <TableCell>{user.firstName || user.username}</TableCell>
                    <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right font-mono">
                      {user.wallets.find(w => w.currency === 'CFM')?.balance.toFixed(4) ?? 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">{user._count.referrals}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;