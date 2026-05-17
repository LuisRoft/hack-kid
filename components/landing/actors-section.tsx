import { SectionHeading } from '@/components/landing/section-heading';

const audiences = [
  {
    role: 'Gobierno',
    headline: 'Actúa donde más duele',
    body: 'Prioriza corredores críticos y despliega equipos antes del cierre, no cuando la vía ya cayó.',
  },
  {
    role: 'Logística',
    headline: 'Tu flota no se queda atrapada',
    body: 'Rerutea con tiempo, protege entregas y evita días de operación perdida por un cierre sorpresa.',
  },
  {
    role: 'Salud',
    headline: 'Llega antes del colapso',
    body: 'Preposiciona insumos en los municipios correctos mientras todavía hay camino para moverlos.',
  },
];

export function ActorsSection() {
  return (
    <section
      id='clientes'
      className='scroll-mt-(--scroll-anchor-offset) border-t border-border-subtle bg-surface-raised/40'
      aria-labelledby='clientes-heading'
    >
      <div className='mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20'>
        <SectionHeading
          eyebrow='Para quién'
          title='Hecho para equipos que no pueden improvisar'
          description='Cada vista está pensada para el rol que toma la decisión — sin ruido, sin pantallas genéricas.'
        />

        <ul className='mt-12 grid list-none gap-6 p-0 lg:grid-cols-3'>
          {audiences.map((item) => (
            <li
              key={item.role}
              className='rounded-xs border border-border-subtle bg-surface-base p-6 lg:p-8'
            >
              <p className='text-xs font-semibold tracking-[0.15em] text-text-tertiary uppercase'>
                {item.role}
              </p>
              <h3 className='mt-3 font-display text-xl font-semibold text-text-primary'>
                {item.headline}
              </h3>
              <p className='mt-4 text-sm leading-relaxed text-text-muted'>
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
