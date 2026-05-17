export const clerkAppearance = {
  variables: {
    colorPrimary: 'var(--color-brand)',
    colorBackground: 'var(--color-surface-base)',
    colorText: 'var(--color-text-primary)',
    colorTextSecondary: 'var(--color-text-muted)',
    colorInputBackground: 'var(--color-surface-base)',
    colorInputText: 'var(--color-text-primary)',
    borderRadius: 'var(--radius-xs)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--font-size-sm)',
  },
  elements: {
    formButtonPrimary:
      'rounded-[var(--radius-xs)] bg-brand text-text-secondary hover:bg-[#0a2d6e]',
    card: 'shadow-none',
    headerTitle: 'text-text-primary',
    headerSubtitle: 'text-text-muted',
    socialButtonsBlockButton:
      'rounded-[var(--radius-xs)] border border-border-subtle',
  },
} as const;
