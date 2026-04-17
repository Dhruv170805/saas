import React from 'react';
import './theme.css';
import { getSuperAdminSession } from '@/lib/next_auth_utils';
import { redirect } from 'next/navigation';
import HqSidebarLayout from './components/HqSidebarLayout';

export default async function HQLayout({ children }: { children: React.ReactNode }) {
  const session = await getSuperAdminSession();

  return (
    <HqSidebarLayout session={session}>
      {children}
    </HqSidebarLayout>
  );
}
