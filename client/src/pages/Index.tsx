"use client";

import { AuthWrapper } from '@/components/AuthWrapper';
import { AuthenticatedUser } from '@/types/telegram';
import { ExpandedHomePage } from '@/components/ExpandedHomePage';
import { EarningsWrapper } from '@/components/EarningsWrapper';

const IndexContent = ({ user }: { user: AuthenticatedUser }) => {
  return <ExpandedHomePage user={user} />;
};

const Index = () => {
  return (
    <EarningsWrapper>
      <AuthWrapper>
        {(user) => <IndexContent user={user} />}
      </AuthWrapper>
    </EarningsWrapper>
  );
};

export default Index;