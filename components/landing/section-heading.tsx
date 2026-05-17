type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
}: SectionHeadingProps) {
  return (
    <div id={id} className='max-w-2xl scroll-mt-(--scroll-anchor-offset)'>
      {eyebrow ? (
        <p className='text-xs font-semibold tracking-[0.2em] text-text-tertiary uppercase'>
          {eyebrow}
        </p>
      ) : null}
      <h2 className='mt-3 font-display text-[clamp(1.75rem,3vw,var(--font-size-2xl))] leading-[1.1] font-semibold tracking-[0.01em] text-text-primary'>
        {title}
      </h2>
      {description ? (
        <p className='mt-4 text-base leading-relaxed text-text-muted'>
          {description}
        </p>
      ) : null}
    </div>
  );
}
