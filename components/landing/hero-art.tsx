const WIDTH = 1536;
const HEIGHT = 1024;

type HeroArtProps = {
  className?: string;
};

export function HeroArt({ className = "" }: HeroArtProps) {
  return (
    <picture className={className}>
      <source
        media="(min-width: 1024px)"
        srcSet="/hero-1280.webp"
        type="image/webp"
      />
      <source
        media="(min-width: 640px)"
        srcSet="/hero-960.webp"
        type="image/webp"
      />
      <source srcSet="/hero-640.webp" type="image/webp" />
      <img
        src="/hero-original.png"
        alt=""
        width={WIDTH}
        height={HEIGHT}
        className="h-full w-auto max-w-none object-contain object-right"
        decoding="async"
        fetchPriority="high"
      />
    </picture>
  );
}
