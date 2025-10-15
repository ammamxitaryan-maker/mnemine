"use client";

import { AuthWrapper } from '@/components/AuthWrapper';
import { AuthenticatedUser } from '@/types/telegram';
import { MinimalistHomePage } from '@/components/MinimalistHomePage';

const IndexContent = ({ user }: { user: AuthenticatedUser }) => {
  return <MinimalistHomePage user={user} />;
};

const Index = () => {
  return (
    <AuthWrapper>
      {(user) => <IndexContent user={user} />}
    </AuthWrapper>
  );
};

export default Index;