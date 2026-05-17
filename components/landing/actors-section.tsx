import { SectionHeading } from '@/components/landing/section-heading';

const audiences = [
  {
    role: 'Tu zona',
    headline: 'Ve el riesgo donde vives',
    body: 'Capas de lluvia, zonas en riesgo y deslaves recientes muestran si el problema se acerca a tu ubicación.',
  },
  {
    role: 'Tu familia',
    headline: 'Recibe acciones según tu contexto',
    body: 'Hermes ajusta el plan si hay niños, adultos mayores, condiciones médicas, vehículo o refugio alterno.',
  },
  {
    role: 'Tu entorno',
    headline: 'Encuentra puntos útiles cercanos',
    body: 'Hospitales, farmacias y supermercados aparecen en el mapa; la ayuda temporal se resuelve desde el agente.',
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
          title='Hecho para ciudadanos que necesitan actuar, no interpretar datos.'
          description='La experiencia parte de tu ubicación y convierte el riesgo en decisiones familiares concretas.'
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
