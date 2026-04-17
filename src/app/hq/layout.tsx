import React from 'react';
import './theme.css';
import { getSuperAdminSession } from '@/core/next_auth_utils';
import { redirect } from 'next/navigation';
import HqSidebarLayout from '@/features/hq/components/HqSidebarLayout';

export default async function HQLayout({ children }: { children: React.ReactNode }) {
  const session = await getSuperAdminSession();

  return (
    <HqSidebarLayout session={session}>
      {children}
    </HqSidebarLayout>
  );
}
