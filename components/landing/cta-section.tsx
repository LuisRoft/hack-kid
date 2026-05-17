import { Button } from '@/components/ui/button';

function ArrowIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden>
      <path
        d='M3 8h10M9 4l4 4-4 4'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

export function CtaSection() {
  return (
    <section
      className='border-t border-border-subtle bg-surface-raised/60'
      aria-labelledby='cta-heading'
    >
      <div className='mx-auto max-w-7xl px-6 py-16 text-center lg:px-10 lg:py-20'>
        <h2
          id='cta-heading'
          className='mx-auto max-w-2xl font-display text-[clamp(1.75rem,3vw,var(--font-size-2xl))] leading-[1.1] font-semibold text-text-primary'
        >
          El Niño no espera. Tu familia tampoco debería improvisar.
        </h2>
        <p className='mx-auto mt-4 max-w-xl text-base text-text-muted'>
          Crea tu perfil ciudadano, revisa el riesgo cerca de ti y deja que
          Hermes convierta la alerta en un plan accionable.
        </p>
<div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
          <Button href='/sign-up' variant='primary' icon={<ArrowIcon />}>
            Crear mi plan
          </Button>
          <Button href='/sign-in' variant='secondary'>
            Ya tengo cuenta
          </Button>
        </div>
      </div>
    </section>
  );
}
