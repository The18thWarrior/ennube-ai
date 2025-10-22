/**
 * Layout for the User Management section
 */
import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getCustomerSubscription } from '@/lib/stripe';

interface UserManagementLayoutProps {
  children: React.ReactNode;
}

export default async function UserManagementLayout({
  children,
}: UserManagementLayoutProps) {
  // Check if user is authenticated and has an active subscription
  const session = await auth();
  
  if (!session || !session.user) {
    redirect('/authentication/login');
  }

  // Verify the user is a primary subscription holder
  const userSub = session.user.sub;
  if (!userSub) {
    redirect('/dashboard');
  }

  const subscription = await getCustomerSubscription(userSub);
  if (!subscription || subscription.status !== 'active') {
    redirect('/subscription');
  }

  return (
    <div className="user-management-container">
      <div className="py-4 md:py-8">
        <div className="container mx-auto px-4">
          <div className="border rounded-lg shadow-lg overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
