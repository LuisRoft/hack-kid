import { SectionHeading } from '@/components/landing/section-heading';

const pains = [
  {
    title: 'La carretera ya cerró',
    body: 'Te enteras cuando el daño ya está hecho y los recursos llegan tarde.',
  },
  {
    title: 'La carga se queda varada',
    body: 'Un cierre inesperado paraliza rutas, almacenes y abastecimiento urbano.',
  },
  {
    title: 'Salud entra en crisis',
    body: 'Los hospitales reciben el pico sin insumos ni tiempo para prepararse.',
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
          eyebrow='Por qué Nimbus'
          title='El clima avisa. Tu operación llega tarde.'
          description='Los pronósticos te dicen que va a llover. Nadie te dice qué va a pasarle a tus carreteras, a tu logística ni a tu sistema de salud — hasta que ya es tarde.'
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
