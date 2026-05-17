import Image from 'next/image';
import Link from 'next/link';

export const APP_BRAND_NAME = 'Aegis';

type AppBrandLinkProps = {
  href?: string;
  className?: string;
  priority?: boolean;
};

export function AppBrandLink({
  href = '/',
  className = '',
  priority = false,
}: AppBrandLinkProps) {
  return (
    <Link
      href={href}
      className={[
        'flex items-center gap-2.5 text-xl font-bold leading-none tracking-normal text-text-primary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${APP_BRAND_NAME} home`}
    >
      <Image
        src='/logo.svg'
        alt=''
        width={50}
        height={50}
        className='h-5 w-auto shrink-0'
        priority={priority}
      />
      {APP_BRAND_NAME}
    </Link>
  );
}
