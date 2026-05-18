import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeroArt } from '@/components/landing/hero-art';

const stats = [
  { value: '72h', label: 'Pronóstico accionable para tu zona' },
  { value: '24/7', label: 'Lluvia y deslaves recientes en el mapa' },
  { value: '1', label: 'Plan familiar guiado por Hermes' },
];

function ArrowIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
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

export function HeroSection() {
  return (
    <section className='landing-hero relative flex flex-col overflow-hidden bg-surface-base'>
      <div
        aria-hidden
        className='landing-hero__art-layer pointer-events-none absolute top-0 right-0 z-0 hidden w-[min(70vw,var(--hero-art-max-width))] lg:block'
      >
        <HeroArt className='hero-art--desktop h-full' />
      </div>

      <div className='relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 lg:px-10'>
        <div className='flex flex-1 flex-col justify-center py-6 sm:py-8'>
          <div className='grid w-full items-center lg:grid-cols-12'>
            <div className='relative lg:col-span-5 lg:max-w-[560px]'>
              <div
                aria-hidden
                className='relative -mr-6 mb-5 flex aspect-3/2 max-h-[min(28vh,220px)] justify-end sm:-mr-8 lg:hidden'
              >
                <HeroArt className='h-full justify-end' />
              </div>

              <h1 className='font-display text-[clamp(1.875rem,4.2vw,var(--font-size-3xl))] leading-[1.05] tracking-[0.01em]'>
                <span className='font-semibold text-text-primary'>
                  72h de anticipación{' '}
                </span>
                <span className='font-normal text-text-muted'>
                  ante lluvia y deslaves en tu zona
                </span>
              </h1>

              <p className='mt-4 max-w-lg text-base leading-relaxed text-text-muted sm:mt-5'>
                Aegis procesa datos satelitales, precipitación y susceptibilidad del
                terreno para convertir alertas en un plan familiar accionable.
              </p>

              <div className='mt-5 flex flex-wrap items-center gap-3 sm:mt-6'>
                <Button asChild className='bg-brand text-text-secondary hover:bg-[#0a2d6e] h-auto rounded-[var(--radius-xs)] px-5 py-2.5'>
                  <Link href='/sign-up'>
                    Crear mi plan
                    <ArrowIcon />
                  </Link>
                </Button>
                <Button asChild variant='outline' className='border-brand text-brand hover:bg-brand/10 px-5 py-2.5 h-auto rounded-[var(--radius-xs)]'>
                  <Link href='#producto'>Ver el producto</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className='landing-hero__stats relative z-20 w-full shrink-0 border-t border-border-subtle bg-surface-base'
        aria-label='Resultados que importan'
      >
        <div className='mx-auto max-w-7xl px-6 lg:px-10'>
          <ul className='grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-3 sm:divide-x sm:divide-border-subtle'>
            {stats.map((stat, index) => (
              <li
                key={stat.label}
                className={`flex flex-col items-center justify-center px-4 py-5 text-center sm:py-6 ${
                  index > 0 ? 'border-t border-border-subtle sm:border-t-0' : ''
                }`}
              >
                <p className='font-display text-[clamp(1.75rem,3vw,var(--font-size-2xl))] leading-none font-semibold tracking-[0.01em] text-text-primary'>
                  {stat.value}
                </p>
                <p className='mt-2 max-w-56 text-xs leading-snug text-text-muted sm:text-sm'>
                  {stat.label}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
