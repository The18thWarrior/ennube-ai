'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@auth0/nextjs-auth0';

export default function WelcomeMessage() {
  const { user } = useUser();
  const { profile } = useProfile();
  
  return (
    <div className="bg-background rounded-lg p-2 ">
       <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl mb-4 text-center w-full">Welcome <span className={'font-semibold'}>{profile?.name || user?.name  || user?.email}</span></h2>
        </div>
        
    </div>
  );
}
