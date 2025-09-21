import { useTranslation } from 'react-i18next';
import { AdminMainPanel } from '@/components/admin/AdminMainPanel';

const Admin = () => {
  const { t } = useTranslation();

  return <AdminMainPanel />;
};

export default Admin;