const sources = [
  { name: "NOAA + Open-Meteo", detail: "Pronóstico El Niño y precipitación extrema" },
  { name: "NASA LHASA", detail: "Deslaves recientes y susceptibilidad" },
  { name: "INEC / zonas EC", detail: "Cantones y parroquias para riesgo local" },
  { name: "OpenStreetMap", detail: "Hospitales, farmacias y supermercados" },
  { name: "Tavily Search", detail: "Ayuda temporal y noticias locales bajo demanda" },
  { name: "PAHO / SIVIGILA", detail: "Contexto epidemiológico interno del agente" },
];

export function DataSourcesSection() {
  return (
    <section
      id="datos"
      className="border-t border-border-subtle"
      aria-label="Fuentes de datos"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-sm">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-text-tertiary uppercase">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-text-tertiary"
                aria-hidden
              />
              Fuentes de datos
            </p>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              Todo es público y gratuito. Sin acuerdos institucionales para el
              MVP del hackathon.
            </p>
          </div>

          <ul className="grid list-none gap-x-10 gap-y-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {sources.map((source) => (
              <li key={source.name}>
                <p className="text-sm font-medium text-text-primary">
                  {source.name}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">{source.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
