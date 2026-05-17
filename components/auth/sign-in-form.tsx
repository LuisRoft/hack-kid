'use client';

import { AuthField } from '@/components/auth/auth-field';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthDivider } from '@/components/auth/auth-divider';
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button';
import { SIGN_UP_PATH } from '@/lib/auth-routes';
import { navigateAfterAuth } from '@/lib/auth-navigation';
import { useSignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const submitClass =
  'inline-flex w-full items-center justify-center rounded-[var(--radius-xs)] border border-brand bg-brand px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-[#0a2d6e] disabled:cursor-not-allowed disabled:opacity-50';

export function SignInForm() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');

  const isSubmitting = fetchStatus === 'fetching';

  async function finalizeSession() {
    await signIn.finalize({
      navigate: (args) => navigateAfterAuth(args, router),
    });
  }

  async function handleCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const emailAddress = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');

    await signIn.password({ emailAddress, password });

    if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
      setStep('mfa');
      if (signIn.status === 'needs_second_factor') {
        await signIn.mfa.sendEmailCode();
      }
      return;
    }

    if (signIn.status === 'complete') {
      await finalizeSession();
    }
  }

  async function handleMfa(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get('code') ?? '');

    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === 'complete') {
      await finalizeSession();
    }
  }

  if (step === 'mfa') {
    return (
      <AuthShell
        title='Verify it’s you'
        description='Enter the code we sent to your email to finish signing in.'
        footer={
          <button
            type='button'
            className='text-text-tertiary hover:underline'
            onClick={() => {
              signIn.reset();
              setStep('credentials');
            }}
          >
            Use a different account
          </button>
        }
      >
        <form className='space-y-4' onSubmit={handleMfa}>
          <AuthField
            label='Verification code'
            name='code'
            inputMode='numeric'
            autoComplete='one-time-code'
            required
            error={errors?.fields?.code?.message}
          />
          {errors?.global?.[0]?.message ? (
            <p className='text-sm text-red-600'>{errors.global[0].message}</p>
          ) : null}
          <button type='submit' className={submitClass} disabled={isSubmitting}>
            {isSubmitting ? 'Verifying…' : 'Continue'}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title='Welcome back'
      description='Accede a tu mapa ciudadano y a Hermes para convertir alertas en un plan familiar.'
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href={SIGN_UP_PATH} className='font-medium text-text-tertiary hover:underline'>
            Create one
          </Link>
        </>
      }
    >
      <div className='space-y-4'>
        <GoogleOAuthButton mode='sign-in' disabled={isSubmitting} />
        <AuthDivider />
      </div>
      <form className='mt-4 space-y-4' onSubmit={handleCredentials}>
        <AuthField
          label='Email'
          name='email'
          type='email'
          autoComplete='email'
          required
          error={errors?.fields?.identifier?.message}
        />
        <AuthField
          label='Password'
          name='password'
          type='password'
          autoComplete='current-password'
          required
          error={errors?.fields?.password?.message}
        />
        {errors?.global?.[0]?.message ? (
          <p className='text-sm text-red-600'>{errors.global[0].message}</p>
        ) : null}
        <button type='submit' className={submitClass} disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in with email'}
        </button>
      </form>
    </AuthShell>
  );
}
