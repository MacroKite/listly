"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { X } from "lucide-react";

export const inputClass = (warn?: boolean, extra = "") =>
  [
    "focus-ring h-[52px] w-full rounded-[14px] border bg-surface px-4 text-base outline-none placeholder:text-ink-3 transition-[border-color,box-shadow] duration-150",
    warn ? "border-warn-border" : "border-input",
    extra,
  ].join(" ");

/**
 * Label + control + inline amber warning. Pass `htmlFor` for single text inputs;
 * groups (chips, toggles) get a plain caption so clicking it doesn't press a button.
 */
export function Field({
  label,
  htmlFor,
  hint,
  warn,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  warn?: string | null;
  children: ReactNode;
}) {
  const caption = (
    <>
      {label}
      {hint && <span className="font-normal text-ink-3"> {hint}</span>}
    </>
  );
  return (
    <div className="flex flex-col gap-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {caption}
        </label>
      ) : (
        <span className="text-sm font-medium">{caption}</span>
      )}
      {children}
      {warn && (
        <p className="text-sm text-warn" id={htmlFor ? `${htmlFor}-warn` : undefined}>
          {warn}
        </p>
      )}
    </div>
  );
}

export function TextInput({ warn, className = "", ...props }: ComponentProps<"input"> & { warn?: boolean }) {
  return <input className={inputClass(warn, className)} {...props} />;
}

/** Chip-style tag entry: Enter or comma adds, Backspace on empty removes the last. */
export function TagInput({
  value,
  onChange,
  placeholder = "Add…",
  label,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  label: string;
}) {
  const [text, setText] = useState("");
  const add = (raw: string) => {
    const t = raw.trim().replace(/,$/, "").trim();
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t].slice(0, 12));
    setText("");
  };
  return (
    <div className="focus-ring flex min-h-[52px] flex-wrap items-center gap-1.5 rounded-[14px] border border-input bg-surface px-3 py-2 transition-[border-color,box-shadow] duration-150">
      {value.map((t) => (
        <span key={t} className="flex h-8 items-center gap-1 rounded-lg bg-soft pr-1 pl-2.5 text-sm">
          {t}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== t))}
            aria-label={`Remove ${t}`}
            className="flex size-6 items-center justify-center rounded-md text-ink-3 hover:bg-ink/5 hover:text-ink"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </span>
      ))}
      <input
        value={text}
        aria-label={label}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setText(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(text);
          } else if (e.key === "Backspace" && !text && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => text && add(text)}
        placeholder={placeholder}
        className="h-8 min-w-24 flex-1 bg-transparent pl-1.5 text-[15px] outline-none placeholder:text-ink-3"
      />
    </div>
  );
}
