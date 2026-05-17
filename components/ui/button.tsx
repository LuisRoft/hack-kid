import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-text-secondary border border-brand hover:bg-[#0a2d6e] active:bg-[#051a42] disabled:opacity-50",
  secondary:
    "bg-surface-base text-text-primary border border-border-subtle hover:bg-surface-raised active:bg-[#eef1f4] disabled:opacity-50",
  ghost:
    "bg-transparent text-text-primary border border-transparent hover:bg-surface-raised active:bg-[#eef1f4] disabled:opacity-50",
};

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  className?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  ariaLabel?: string;
};

export function Button({
  children,
  href = "#",
  variant = "primary",
  className = "",
  icon,
  iconPosition = "right",
  ariaLabel,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-xs)] px-5 py-2.5 text-sm font-medium transition-colors duration-[var(--motion-instant)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-tertiary";

  const classes = `${base} ${variantClasses[variant]} ${className}`;

  return (
    <Link href={href} className={classes} aria-label={ariaLabel}>
      {icon && iconPosition === "left" ? icon : null}
      <span>{children}</span>
      {icon && iconPosition === "right" ? icon : null}
    </Link>
  );
}
