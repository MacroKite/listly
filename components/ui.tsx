import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "strong" | "ghost";
type Size = 44 | 48 | 52 | 56;

const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-white shadow-primary hover:bg-accent-hover",
  secondary: "bg-surface text-ink border border-input shadow-secondary hover:bg-soft",
  strong: "bg-ink text-white hover:bg-ink/90",
  ghost: "bg-transparent text-ink-2 hover:bg-ink/5",
};

const SIZE: Record<Size, string> = {
  44: "h-11 px-5 text-[15px]",
  48: "h-12 px-6 text-[15px]",
  52: "h-[52px] px-8 text-base",
  56: "h-14 px-8 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = 44, extra = "") {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap",
    "transition-colors duration-150 ease-out disabled:opacity-50 disabled:pointer-events-none",
    VARIANT[variant],
    SIZE[size],
    extra,
  ].join(" ");
}

export function Button({
  variant,
  size,
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-[9px] text-ink hover:no-underline" aria-label="Listly home">
      <span className="flex size-6 items-center justify-center rounded-lg bg-ink">
        <span className="size-[9px] rounded-full bg-white" />
      </span>
      <span className="text-[19px] font-medium tracking-[-0.02em]">Listly</span>
    </Link>
  );
}

export function MonoTag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-lg bg-soft px-2.5 font-mono text-xs uppercase ${className}`}>
      {children}
    </span>
  );
}

/** Two-or-more option pill toggle (Any price / Free, Free / Paid). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className = "",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const item = size === "sm" ? "h-8 px-3.5 text-[13px]" : "h-11 flex-1 px-4 text-[15px]";
  return (
    <div role="radiogroup" className={`flex rounded-full bg-track p-1 ${className}`}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`flex items-center justify-center rounded-full transition-[background,box-shadow] duration-150 ease-out ${item} ${
              on ? "bg-surface font-medium text-ink shadow-seg" : "text-ink-2 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  active,
  children,
  className = "",
  ...props
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button type="button" className={chipClass(active, className)} aria-pressed={active} {...props}>
      {children}
    </button>
  );
}

export function chipClass(active?: boolean, extra = "") {
  return [
    "inline-flex h-10 flex-none items-center gap-1.5 rounded-full px-4 text-sm transition-colors duration-150 ease-out hover:no-underline",
    active ? "bg-ink font-medium text-white hover:text-white" : "border border-line bg-surface text-ink hover:border-input hover:bg-soft hover:text-ink",
    extra,
  ].join(" ");
}

export function Avatar({ name, size = 40, tone = "blue" }: { name: string; size?: number; tone?: "blue" | "teal" }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "·";
  const colors = tone === "teal" ? "bg-[#DCF3F9] text-[#0B5A6E]" : "bg-avatar text-accent-ink";
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full font-medium ${colors}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
