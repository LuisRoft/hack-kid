import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AuthArt } from '@/components/auth/auth-art';
import { AppBrandLink } from '@/components/brand/app-brand-link';
import { CitizenOnboardingForm } from '@/components/onboarding/citizen-onboarding-form';
import { APP_HOME, SIGN_IN_PATH } from '@/lib/auth-routes';
import { hasCompletedOnboarding } from '@/lib/onboarding';

export default async function OnboardingPage() {
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    redirect(SIGN_IN_PATH);
  }

  const user = await currentUser();

  if (hasCompletedOnboarding(user?.publicMetadata)) {
    redirect(APP_HOME);
  }

  return (
    <div className='auth-shell flex h-full max-h-dvh flex-col overflow-hidden bg-surface-base text-text-primary'>
      <header className='shrink-0 border-b border-border-subtle/60'>
        <div className='grid h-(--header-height) grid-cols-[1fr_auto] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]'>
          <div className='flex items-center px-6 lg:px-10'>
            <AppBrandLink />
          </div>
          <div className='flex items-center justify-end px-6 lg:px-10'>
            <Link
              href='/'
              className='text-xs text-text-muted transition-colors hover:text-text-primary'
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </header>

      <main className='grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]'>
        <div className='flex min-h-0 flex-col overflow-hidden'>
          <div className='flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-6 lg:px-10'>
            <div className='mx-auto w-full max-w-lg space-y-5 py-6 lg:py-8'>
              <div className='space-y-2'>
                <p className='text-[11px] font-medium uppercase tracking-[0.16em] text-text-muted'>
                  Onboarding ciudadano
                </p>
                <h1 className='text-2xl font-semibold leading-tight text-text-primary'>
                  Tu contexto cambia el plan de riesgo.
                </h1>
                <p className='text-xs leading-5 text-text-muted'>
                  Guardamos esta información para que el bot y la app puedan
                  convertir una predicción de inundación, cierre vial o alerta
                  sanitaria en instrucciones concretas para tu familia.
                </p>
              </div>

              <div className='border border-border-subtle bg-surface-base p-5'>
                <CitizenOnboardingForm />
              </div>
            </div>
          </div>
        </div>

        <section
          aria-hidden
          className='relative hidden min-h-0 overflow-hidden bg-surface-base lg:flex'
        >
          <div className='relative flex h-full w-full items-center justify-end overflow-hidden'>
            <AuthArt className='auth-art--desktop' priority />
          </div>
        </section>
      </main>
    </div>
  );
}
