export const clerkAppearance = {
  variables: {
    colorPrimary: 'var(--color-brand)',
    colorBackground: 'var(--color-surface-base)',
    colorText: 'var(--color-text-primary)',
    colorTextSecondary: 'var(--color-text-muted)',
    colorInputBackground: 'var(--color-surface-base)',
    colorInputText: 'var(--color-text-primary)',
    borderRadius: '4px',
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
  },
  elements: {
    formButtonPrimary:
      'rounded-xs bg-brand text-text-secondary hover:bg-[#0a2d6e]',
    card: 'shadow-none',
    headerTitle: 'text-text-primary',
    headerSubtitle: 'text-text-muted',
    socialButtonsBlockButton: 'rounded-xs border border-border-subtle',
  },
} as const;
