import { AuthArt } from '@/components/auth/auth-art';
import { ClerkCaptcha } from '@/components/auth/clerk-captcha';
import Link from 'next/link';
import type { ReactNode } from 'react';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className='auth-shell flex h-full max-h-dvh flex-col overflow-hidden bg-surface-base text-text-primary'>
      <header className='auth-shell__header shrink-0 border-b border-border-subtle/60'>
        <div className='mx-auto flex h-[var(--header-height)] max-w-7xl items-center justify-between px-6 lg:px-10'>
          <Link
            href='/'
            className='text-2xl font-semibold leading-none tracking-normal text-text-primary'
            aria-label='Nimbus home'
          >
            Nimbus
          </Link>
          <Link
            href='/'
            className='text-sm text-text-muted transition-colors hover:text-text-primary'
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className='auth-shell__main relative grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]'>
        <div className='auth-shell__form flex min-h-0 flex-col overflow-hidden lg:justify-center'>
          <div
            aria-hidden
            className='auth-shell__mobile-art relative mx-auto mb-3 flex h-[min(22dvh,180px)] w-full max-w-md shrink-0 items-end justify-end overflow-hidden px-6 sm:px-8 lg:hidden'
          >
            <AuthArt priority className='h-full w-full justify-end' />
          </div>

          <div className='mx-auto flex w-full min-h-0 max-w-md flex-1 flex-col justify-center gap-5 overflow-hidden px-6 pb-5 pt-1 sm:gap-6 sm:px-8 sm:pb-6 lg:flex-none lg:gap-6 lg:px-10 lg:py-6 xl:px-16'>
            <div className='shrink-0 space-y-1.5 sm:space-y-2'>
              <h1 className='font-display text-[clamp(1.625rem,2.8vw,2.125rem)] font-semibold leading-tight tracking-[0.01em] text-text-primary'>
                {title}
              </h1>
              <p className='text-sm leading-relaxed text-text-muted sm:text-base'>
                {description}
              </p>
            </div>

            <div className='min-h-0 shrink'>{children}</div>
            <ClerkCaptcha />

            <div className='shrink-0 text-center text-sm text-text-muted'>
              {footer}
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className='auth-shell__art relative hidden min-h-0 overflow-hidden bg-surface-base lg:flex'
        >
          <div className='relative flex h-full w-full items-center justify-end overflow-hidden'>
            <AuthArt className='auth-art--desktop' />
          </div>
        </div>
      </main>
    </div>
  );
}
