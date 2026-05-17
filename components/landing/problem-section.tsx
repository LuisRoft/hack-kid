import { SectionHeading } from '@/components/landing/section-heading';

const pains = [
  {
    title: 'No sabes si tu zona está en riesgo',
    body: 'El pronóstico dice lluvia, pero no traduce eso a una decisión para tu barrio o tu casa.',
  },
  {
    title: 'Tu familia necesita un plan distinto',
    body: 'Niños, adultos mayores, medicinas, vehículo o refugio cambian lo que debes hacer primero.',
  },
  {
    title: 'La ayuda cambia en tiempo real',
    body: 'Los puntos útiles, albergues y noticias locales no viven en una pantalla estática.',
  },
];

export function ProblemSection() {
  return (
    <section
      id='por-que'
      className='scroll-mt-(--scroll-anchor-offset) border-t border-border-subtle bg-surface-raised/40'
      aria-labelledby='por-que-heading'
    >
      <div className='mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20'>
        <SectionHeading
          eyebrow='Por qué Aegis'
          title='El clima avisa. Las familias necesitan pasos concretos.'
          description='Los pronósticos te dicen que va a llover. Aegis lo traduce a riesgo local, recursos cercanos y un plan personalizado para actuar a tiempo.'
        />

        <ul className='mt-12 grid list-none gap-4 p-0 sm:grid-cols-3'>
          {pains.map((pain) => (
            <li
              key={pain.title}
              className='rounded-xs border border-border-subtle bg-surface-base p-6'
            >
              <h3 className='font-display text-lg font-semibold text-text-primary'>
                {pain.title}
              </h3>
              <p className='mt-2 text-sm leading-relaxed text-text-muted'>
                {pain.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
