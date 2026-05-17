'use client';

import { APP_HOME, SIGN_IN_PATH, SIGN_UP_PATH } from '@/lib/auth-routes';
import { UserButton, useAuth } from '@clerk/nextjs';
import Link from 'next/link';

const ghostButtonClass =
  'inline-flex items-center justify-center rounded-[var(--radius-xs)] border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-text-primary transition-colors duration-[var(--motion-instant)] hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-tertiary';

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-[var(--radius-xs)] border border-brand bg-brand px-4 py-2 text-sm font-medium text-text-secondary transition-colors duration-[var(--motion-instant)] hover:bg-[#0a2d6e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-tertiary';

function AuthActionsSkeleton() {
  return (
    <div className='flex items-center gap-3' aria-hidden>
      <div className='h-9 w-16 animate-pulse rounded-xs bg-surface-raised' />
      <div className='h-9 w-24 animate-pulse rounded-xs bg-surface-raised' />
    </div>
  );
}

export function AuthActions() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <AuthActionsSkeleton />;
  }

  if (isSignedIn) {
    return (
      <div className='flex items-center gap-3'>
        <Link href={APP_HOME} className={primaryButtonClass}>
          Entrar
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-9 w-9',
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className='flex items-center gap-3'>
      <Link href={SIGN_IN_PATH} className={ghostButtonClass}>
        Iniciar sesión
      </Link>
      <Link href={SIGN_UP_PATH} className={primaryButtonClass}>
        Entrar
      </Link>
    </div>
  );
}
