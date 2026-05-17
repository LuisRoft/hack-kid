import type { InputHTMLAttributes } from 'react';

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function AuthField({ label, error, id, className = '', ...props }: AuthFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <div className='flex flex-col gap-1.5'>
      <label htmlFor={fieldId} className='text-sm font-medium text-text-primary'>
        {label}
      </label>
      <input
        id={fieldId}
        className={`w-full rounded-[var(--radius-xs)] border border-border-subtle bg-surface-base px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand focus:ring-2 focus:ring-brand/15 ${className}`}
        {...props}
      />
      {error ? <p className='text-sm text-red-600'>{error}</p> : null}
    </div>
  );
}
