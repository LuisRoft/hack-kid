import { SectionHeading } from '@/components/landing/section-heading';

const benefits = [
  {
    title: 'Entiende tu riesgo local',
    body: 'Cruza lluvia, zonas administrativas, corredores y deslaves recientes para responder qué está pasando cerca de ti.',
  },
  {
    title: 'Encuentra recursos cercanos',
    body: 'Ubica hospitales, clínicas, farmacias y supermercados sin depender de una búsqueda manual en medio de la emergencia.',
  },
  {
    title: 'Actúa con Hermes',
    body: 'El agente usa tu ubicación, familia y recursos disponibles para armar un plan de acción concreto y fácil de seguir.',
  },
];

export function CascadesSection() {
  return (
    <section
      id='producto'
      className='scroll-mt-(--scroll-anchor-offset)border-t border-border-subtle'
      aria-labelledby='producto-heading'
    >
      <div className='mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20'>
        <SectionHeading
          eyebrow='El producto'
          title='Mapa vivo y agente ciudadano en una sola experiencia.'
          description='Aegis conecta el evento climático con lo que realmente necesitas decidir: qué riesgo tengo, qué recursos hay cerca y qué hago ahora.'
        />

        <ul className='mt-12 grid list-none gap-6 p-0 lg:grid-cols-3'>
          {benefits.map((benefit) => (
            <li
              key={benefit.title}
              className='flex flex-col rounded-xs border border-border-subtle bg-surface-base p-8'
            >
              <h3 className='font-display text-xl font-semibold text-text-primary'>
                {benefit.title}
              </h3>
              <p className='mt-4 flex-1 text-sm leading-relaxed text-text-muted'>
                {benefit.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
