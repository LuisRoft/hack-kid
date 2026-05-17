'use client';

import { AuthActions } from '@/components/landing/auth-actions';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const navLinks = [
  { label: 'Por qué', href: '#por-que' },
  { label: 'Producto', href: '#producto' },
  { label: 'Clientes', href: '#clientes' },
  { label: 'Plataforma', href: '#plataforma' },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full shrink-0 border-b transition-[background-color,box-shadow,border-color] duration-[var(--motion-instant)] ${
        scrolled
          ? 'border-border-subtle/80 bg-surface-base/95 shadow-[0_1px_0_rgba(7,35,91,0.06)] backdrop-blur-md'
          : 'border-border-subtle/60 bg-surface-base'
      }`}
    >
      <div className='mx-auto flex h-[var(--header-height)] max-w-7xl items-center justify-between px-6 lg:px-10'>
        <Link
          href='/'
          className='text-xl font-bold leading-none tracking-normal text-text-primary'
          aria-label='Nimbus home'
        >
          Nimbus
        </Link>

        <nav
          className='hidden items-center gap-8 md:flex'
          aria-label='Primary navigation'
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className='text-sm text-text-muted transition-colors duration-(--motion-instant) hover:text-text-primary focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-text-tertiary'
            >
              {link.label}
            </a>
          ))}
        </nav>

        <AuthActions />
      </div>
    </header>
  );
}
