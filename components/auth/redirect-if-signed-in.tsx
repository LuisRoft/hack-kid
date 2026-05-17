'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { APP_HOME } from '@/lib/auth-routes';

export function RedirectIfSignedIn() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(APP_HOME);
    }
  }, [isLoaded, isSignedIn, router]);

  return null;
}
