"use client";

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function MicrosoftSignOut() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Call the API to logout from Microsoft first
      await fetch('/api/microsoft/logout', { method: 'POST' });

      // Then use NextAuth's signOut function
      await signOut({ redirect: true, callbackUrl: '/integrations/microsoft/connect' });
    } catch (error) {
      console.log('Error signing out from Microsoft:', error);
    }
  };

  return (
    <Button variant="destructive" onClick={handleSignOut}>
      Sign Out from Microsoft 365
    </Button>
  );
}
