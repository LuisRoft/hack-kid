const partners = [
  "ats",
  "SubWallet",
  "TAO INSTITUTE",
  "Bittensor.ai",
  "Crucible",
  "Taostats",
];

export function PartnersSection() {
  return (
    <section className="border-t border-border-subtle" aria-label="Partners">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-text-tertiary uppercase">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-text-tertiary"
              aria-hidden="true"
            />
            Our Partners
          </p>

          <ul className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {partners.map((name) => (
              <li key={name}>
                <span
                  className="text-sm font-medium tracking-wide text-text-muted/80 grayscale select-none"
                  aria-label={`Partner: ${name}`}
                >
                  {name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
