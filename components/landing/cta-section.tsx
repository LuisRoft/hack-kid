import Link from "next/link";
import { Button } from "@/components/ui/button";

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CtaSection() {
  return (
    <section
      className="border-t border-border-subtle bg-surface-raised/60"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-10 lg:py-20">
        <h2
          id="cta-heading"
          className="mx-auto max-w-2xl font-display text-[clamp(1.75rem,3vw,var(--font-size-2xl))] leading-[1.1] font-semibold text-text-primary"
        >
          El Niño no espera. Tu operación tampoco debería improvisar.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-text-muted">
          Únete a los equipos que ya están usando Nimbus para ganar tiempo,
          reducir pérdidas y tomar mejores decisiones bajo presión.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="bg-brand text-white border-brand hover:bg-[#0a2d6e] active:bg-[#051a42] px-5 py-2.5 h-auto rounded-[var(--radius-xs)] gap-2">
            <Link href="/sign-up">
              Solicitar acceso
              <ArrowIcon />
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border-subtle text-text-primary hover:bg-surface-raised px-5 py-2.5 h-auto rounded-[var(--radius-xs)]">
            <Link href="/sign-in">
              Ya tengo cuenta
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
