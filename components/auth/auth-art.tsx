const WIDTH = 1024;
const HEIGHT = 1548;

type AuthArtProps = {
  className?: string;
  priority?: boolean;
};

export function AuthArt({ className = '', priority = false }: AuthArtProps) {
  return (
    <picture className={className}>
      <source
        media='(min-width: 1024px)'
        srcSet='/auth-1280.webp'
        type='image/webp'
      />
      <source
        media='(min-width: 640px)'
        srcSet='/auth-960.webp'
        type='image/webp'
      />
      <source
        media='(min-width: 480px)'
        srcSet='/auth-640.webp'
        type='image/webp'
      />
      <source srcSet='/auth-480.webp' type='image/webp' />
      <img
        src='/auth-illustration.png'
        alt=''
        width={WIDTH}
        height={HEIGHT}
        decoding='async'
        fetchPriority={priority ? 'high' : 'auto'}
        className='auth-art__img h-auto w-auto max-h-full max-w-full object-contain object-top'
        sizes='(max-width: 479px) 100vw, (max-width: 1023px) 50vw, 52vw'
      />
    </picture>
  );
}
