"use client";

import { AuthWrapper } from '@/components/AuthWrapper';
import { AuthenticatedUser } from '@/types/telegram';
import { ExpandedHomePage } from '@/components/ExpandedHomePage';

const IndexContent = ({ user }: { user: AuthenticatedUser }) => {
  return <ExpandedHomePage user={user} />;
};

const Index = () => {
  return (
    <AuthWrapper>
      {(user) => <IndexContent user={user} />}
    </AuthWrapper>
  );
};

export default Index;