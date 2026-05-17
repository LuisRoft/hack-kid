'use client';

import { AuthField } from '@/components/auth/auth-field';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthDivider } from '@/components/auth/auth-divider';
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button';
import { SIGN_IN_PATH } from '@/lib/auth-routes';
import { navigateAfterAuth } from '@/lib/auth-navigation';
import { useSignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const submitClass =
  'inline-flex w-full items-center justify-center rounded-[var(--radius-xs)] border border-brand bg-brand px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-[#0a2d6e] disabled:cursor-not-allowed disabled:opacity-50';

export function SignUpForm() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'verify'>('credentials');

  const isSubmitting = fetchStatus === 'fetching';

  async function finalizeSession() {
    await signUp.finalize({
      navigate: (args) => navigateAfterAuth(args, router),
    });
  }

  async function handleCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const emailAddress = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');

    await signUp.password({ emailAddress, password });

    if (signUp.status === 'missing_requirements') {
      await signUp.verifications.sendEmailCode();
      setStep('verify');
      return;
    }

    if (signUp.status === 'complete') {
      await finalizeSession();
    }
  }

  async function handleVerification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get('code') ?? '');

    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === 'complete') {
      await finalizeSession();
    }
  }

  if (step === 'verify') {
    return (
      <AuthShell
        title='Check your email'
        description='We sent you a verification code. Enter it below to activate your account.'
        footer={
          <button
            type='button'
            className='text-text-tertiary hover:underline'
            onClick={() => {
              signUp.reset();
              setStep('credentials');
            }}
          >
            Start over
          </button>
        }
      >
        <form className='space-y-4' onSubmit={handleVerification}>
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
            {isSubmitting ? 'Verifying…' : 'Create account'}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title='Create your account'
      description='Crea tu cuenta para acceder a inteligencia de cascadas para gobierno, logística o salud.'
      footer={
        <>
          Already have an account?{' '}
          <Link href={SIGN_IN_PATH} className='font-medium text-text-tertiary hover:underline'>
            Sign in
          </Link>
        </>
      }
    >
      <div className='space-y-4'>
        <GoogleOAuthButton mode='sign-up' disabled={isSubmitting} />
        <AuthDivider />
      </div>
      <form className='mt-4 space-y-4' onSubmit={handleCredentials}>
        <AuthField
          label='Email'
          name='email'
          type='email'
          autoComplete='email'
          required
          error={errors?.fields?.emailAddress?.message}
        />
        <AuthField
          label='Password'
          name='password'
          type='password'
          autoComplete='new-password'
          required
          error={errors?.fields?.password?.message}
        />
        {errors?.global?.[0]?.message ? (
          <p className='text-sm text-red-600'>{errors.global[0].message}</p>
        ) : null}
        <button type='submit' className={submitClass} disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account with email'}
        </button>
      </form>
    </AuthShell>
  );
}
