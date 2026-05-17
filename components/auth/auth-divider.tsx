export function AuthDivider() {
  return (
    <div className='relative py-1'>
      <div className='absolute inset-0 flex items-center' aria-hidden>
        <div className='w-full border-t border-border-subtle' />
      </div>
      <p className='relative mx-auto w-fit bg-surface-base px-3 text-xs text-text-muted'>
        or continue with email
      </p>
    </div>
  );
}
