export function MoonshotSection() {
  return (
    <section
      className="border-t border-border-subtle bg-brand text-text-secondary"
      aria-labelledby="historia-heading"
    >
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        <p
          id="historia-heading"
          className="text-xs font-semibold tracking-[0.2em] text-text-secondary/70 uppercase"
        >
          Así se siente operar con ventaja
        </p>

        <blockquote className="mt-6 max-w-3xl font-display text-[clamp(1.25rem,2.5vw,1.75rem)] leading-[1.35] font-normal">
          &ldquo;La lluvia empezó el viernes. El lunes supimos que el corredor
          principal tenía alto riesgo de cierre. Esa noche movimos la carga,
          preposicionamos insumos y priorizamos el tramo crítico. El martes
          cerró la vía. La operación no se detuvo.&rdquo;
        </blockquote>

        <p className="mt-6 text-sm text-text-secondary/80">
          Eso es lo que cambia cuando dejas de reaccionar y empiezas a
          anticipar.
        </p>
      </div>
    </section>
  );
}
