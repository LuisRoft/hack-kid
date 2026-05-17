import { SectionHeading } from "@/components/landing/section-heading";

const benefits = [
  {
    title: "Prioriza antes del cierre",
    body: "Sabe qué tramos importan más y dónde conviene actuar primero — con impacto poblacional claro, no con suposiciones.",
  },
  {
    title: "Mueve la carga con tiempo",
    body: "Recibe rutas alternativas listas para ejecutar antes de que tu operación quede atrapada en el corredor.",
  },
  {
    title: "Prepara salud con anticipación",
    body: "Identifica municipios en riesgo y qué insumos conviene mover mientras los caminos todavía están abiertos.",
  },
];

export function CascadesSection() {
  return (
    <section
      id="producto"
      className="scroll-mt-[var(--scroll-anchor-offset)] border-t border-border-subtle"
      aria-labelledby="producto-heading"
    >
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        <SectionHeading
          eyebrow="El producto"
          title="Una plataforma. Tres frentes bajo control."
          description="Nimbus conecta el evento climático con lo que realmente le importa a tu operación: infraestructura, logística y salud pública."
        />

        <ul className="mt-12 grid list-none gap-6 p-0 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <li
              key={benefit.title}
              className="flex flex-col rounded-[var(--radius-xs)] border border-border-subtle bg-surface-base p-8"
            >
              <h3 className="font-display text-xl font-semibold text-text-primary">
                {benefit.title}
              </h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-text-muted">
                {benefit.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
