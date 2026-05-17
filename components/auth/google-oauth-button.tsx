'use client';

import { APP_HOME, SSO_CALLBACK_PATH } from '@/lib/auth-routes';
import { useSignIn, useSignUp } from '@clerk/nextjs';

const buttonClass =
  'inline-flex w-full items-center justify-center gap-3 rounded-[var(--radius-xs)] border border-border-subtle bg-surface-base px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50';

type GoogleOAuthButtonProps = {
  mode: 'sign-in' | 'sign-up';
  disabled?: boolean;
};

function GoogleIcon() {
  return (
    <svg width='18' height='18' viewBox='0 0 18 18' aria-hidden>
      <path
        fill='#4285F4'
        d='M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.61z'
      />
      <path
        fill='#34A853'
        d='M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.99 8.99 0 0 0 9 18z'
      />
      <path
        fill='#FBBC05'
        d='M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.16.29-1.71V4.96H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z'
      />
      <path
        fill='#EA4335'
        d='M9 3.58c1.32 0 2.5.45 3.44 1.33l2.58-2.58C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z'
      />
    </svg>
  );
}

function GoogleSignInButton({ disabled }: { disabled?: boolean }) {
  const { signIn, fetchStatus } = useSignIn();

  async function handleClick() {
    await signIn.sso({
      strategy: 'oauth_google',
      redirectUrl: `${window.location.origin}${APP_HOME}`,
      redirectCallbackUrl: `${window.location.origin}${SSO_CALLBACK_PATH}`,
    });
  }

  return (
    <button
      type='button'
      onClick={handleClick}
      disabled={disabled || fetchStatus === 'fetching'}
      className={buttonClass}
    >
      <GoogleIcon />
      {fetchStatus === 'fetching' ? 'Connecting…' : 'Continue with Google'}
    </button>
  );
}

function GoogleSignUpButton({ disabled }: { disabled?: boolean }) {
  const { signUp, fetchStatus } = useSignUp();

  async function handleClick() {
    await signUp.sso({
      strategy: 'oauth_google',
      redirectUrl: `${window.location.origin}${APP_HOME}`,
      redirectCallbackUrl: `${window.location.origin}${SSO_CALLBACK_PATH}`,
    });
  }

  return (
    <button
      type='button'
      onClick={handleClick}
      disabled={disabled || fetchStatus === 'fetching'}
      className={buttonClass}
    >
      <GoogleIcon />
      {fetchStatus === 'fetching' ? 'Connecting…' : 'Continue with Google'}
    </button>
  );
}

export function GoogleOAuthButton({ mode, disabled }: GoogleOAuthButtonProps) {
  if (mode === 'sign-in') {
    return <GoogleSignInButton disabled={disabled} />;
  }

  return <GoogleSignUpButton disabled={disabled} />;
}
