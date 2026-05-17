import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SIGN_IN_PATH } from '@/lib/auth-routes';

export default async function AppPage() {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated) {
    redirect(SIGN_IN_PATH);
  }

  return (
    <div className='min-h-screen bg-surface-base text-text-primary'>
      <header className='border-b border-border-subtle/60'>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10'>
          <Link
            href='/app'
            className='text-2xl font-semibold leading-none tracking-normal text-text-primary'
          >
            Nimbus
          </Link>
          <UserButton />
        </div>
      </header>

      <main className='mx-auto max-w-3xl px-6 py-16 lg:px-10'>
        <p className='text-sm font-medium uppercase tracking-[0.18em] text-text-muted'>
          Dashboard
        </p>
        <h1 className='mt-3 font-display text-4xl font-semibold tracking-[0.01em] text-text-primary'>
          Tu centro de operaciones
        </h1>
        <p className='mt-4 text-text-muted'>
          Sesión activa. Aquí irán las vistas por actor — gobierno, logística y
          salud — con mapas de riesgo, prioridades y planes de rerouting en
          tiempo real.
        </p>
        <p className='mt-6 text-sm text-text-muted'>Usuario: {userId}</p>
      </main>
    </div>
  );
}
