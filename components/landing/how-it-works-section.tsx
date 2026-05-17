import { SectionHeading } from "@/components/landing/section-heading";

const steps = [
  {
    title: "Detectamos el riesgo",
    body: "Traducimos señales climáticas en impacto real sobre tu red vial y tus operaciones.",
  },
  {
    title: "Te decimos qué hacer",
    body: "Cada equipo recibe prioridades claras: dónde actuar, cómo rerutear y qué mover.",
  },
  {
    title: "Actúas con ventaja",
    body: "Tu organización se mueve días antes del cierre — no cuando el daño ya está hecho.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="plataforma"
      className="scroll-mt-[var(--scroll-anchor-offset)] border-t border-border-subtle"
      aria-labelledby="plataforma-heading"
    >
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        <SectionHeading
          eyebrow="Cómo funciona"
          title="De la alerta a la acción, sin fricción"
          description="Sin configuraciones interminables. Sin equipos de datos dedicados. Solo inteligencia lista para operar."
        />

        <ol className="mt-12 grid list-none gap-8 p-0 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="relative">
              <span className="font-display text-5xl font-semibold leading-none text-text-tertiary/25">
                {index + 1}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
