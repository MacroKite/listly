"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronDown, ImagePlus, Plus, X } from "lucide-react";
import { Cover } from "@/components/product-card";
import { Button, Chip, MonoTag, Segmented, buttonClass } from "@/components/ui";
import { CATEGORIES, suggestCategories } from "@/lib/categories";
import { currencySymbol, displayUrl, formatPrice, siteUrl } from "@/lib/format";
import type { Draft } from "@/lib/types";
import { Field, TagInput, TextInput, inputClass } from "./fields";

export type UnfurlStatus = "idle" | "loading" | "found" | "failed";
export type Upload = { file: File; preview: string };
type Update = (patch: Partial<Draft>) => void;

const draftPrice = (d: Draft) =>
  formatPrice(d.priceType, d.priceType === "paid" ? Number(d.amount) || null : null, d.currency);

/* ------------------------------------------------------------------ Link */

export function LinkStep({
  draft,
  status,
  invalid,
  onUrl,
  onBlur,
}: {
  draft: Draft;
  status: UnfurlStatus;
  invalid: boolean;
  onUrl: (v: string) => void;
  onBlur: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const hasPreview = status === "found" || (status === "idle" && !!draft.title && !invalid);

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onUrl(text.trim());
    } catch {
      input.current?.focus();
    }
  }

  return (
    <div className="flex flex-col gap-5 md:gap-7">
      <div className="flex flex-col gap-1.5 md:gap-2">
        <h1 className="text-[30px] leading-[1.1] font-medium tracking-[-0.025em] md:text-[40px] md:tracking-[-0.03em]">
          Where do people get it?
        </h1>
        <p className="text-base leading-[1.55] text-ink-2">
          <span className="md:hidden">Paste your product link. We’ll fill in the rest.</span>
          <span className="hidden md:inline">
            Paste the link to your product: Gumroad, Payhip, Notion, Google Drive or your own site.
          </span>
        </p>
      </div>

      <Field label="Product link" htmlFor="product-link" warn={invalid ? "That link didn’t open — check it starts with https://" : null}>
        <div
          className={`focus-ring flex h-14 items-center gap-3 rounded-[14px] border bg-surface pr-2 pl-4 transition-[border-color,box-shadow] duration-150 md:h-[60px] md:rounded-2xl md:pl-[18px] ${
            invalid ? "border-warn-border" : "border-input"
          }`}
        >
          <input
            ref={input}
            id="product-link"
            aria-invalid={invalid}
            type="url"
            inputMode="url"
            autoComplete="off"
            autoFocus
            spellCheck={false}
            value={draft.url}
            onChange={(e) => onUrl(e.target.value)}
            onBlur={onBlur}
            placeholder="https://you.gumroad.com/l/your-product"
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-3 md:text-[17px]"
          />
          <button
            type="button"
            onClick={paste}
            className="h-10 flex-none rounded-full bg-soft px-3.5 text-sm font-medium transition-colors duration-150 hover:bg-track"
          >
            Paste
          </button>
        </div>
      </Field>

      {status === "loading" && (
        <div className="flex flex-col gap-2.5" aria-live="polite">
          <span className="text-sm text-ink-3">Reading your link…</span>
          <div className="flex items-center gap-4 rounded-[20px] bg-surface p-3 shadow-float">
            <div className="aspect-[4/3] w-28 flex-none rounded-xl bg-skeleton md:w-40" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3 w-20 rounded bg-skeleton" />
              <div className="h-4 w-4/5 rounded bg-skeleton" />
              <div className="h-3 w-12 rounded bg-skeleton" />
            </div>
          </div>
        </div>
      )}

      {status === "failed" && (
        <p className="rounded-2xl border border-warn-line bg-notice px-4 py-3 text-[15px] leading-[1.5] text-warn" aria-live="polite">
          We couldn’t read that page. You can still continue and fill in the details yourself.
        </p>
      )}

      {hasPreview && (
        <div className="flex flex-col gap-2.5" aria-live="polite">
          {status === "found" && (
            <span className="flex items-center gap-2 text-sm text-accent-ink">
              <Check size={16} strokeWidth={2} />
              <span className="md:hidden">Found it</span>
              <span className="hidden md:inline">Found it. We filled in what we could.</span>
            </span>
          )}
          <div className="overflow-hidden rounded-[20px] border border-line-soft bg-surface shadow-float md:flex md:items-center md:gap-4 md:border-white md:p-3">
            <Cover src={draft.cover} alt="" className="aspect-[16/9] md:aspect-[4/3] md:w-40 md:flex-none md:rounded-xl">
              {!draft.cover && (
                <span className="absolute bottom-2 left-2 hidden rounded-[5px] bg-white/85 px-1.5 py-0.5 font-mono text-[10px] text-ink-3 md:block">
                  no cover found
                </span>
              )}
            </Cover>
            <div className="flex min-w-0 flex-col gap-[3px] p-3.5 md:gap-1 md:p-0">
              <span className="text-[13px] text-ink-3">{draft.domain}</span>
              <span className="text-base font-medium md:text-lg">{draft.title || "Untitled"}</span>
              <span className="text-[15px]">{draftPrice(draft)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Details */

export type DetailErrors = Partial<Record<"title" | "amount", string>>;

export function DetailsStep({
  draft,
  update,
  errors,
  uploads,
  setUploads,
}: {
  draft: Draft;
  update: Update;
  errors: DetailErrors;
  uploads: Upload[];
  setUploads: (u: Upload[]) => void;
}) {
  const [allCats, setAllCats] = useState(false);
  const [more, setMore] = useState(
    () => !!(draft.description || draft.included.length || uploads.length),
  );
  const ranked = suggestCategories(`${draft.title} ${draft.tagline} ${draft.url}`);
  const shown = allCats ? CATEGORIES : ranked.slice(0, 3);
  // Keep the chosen category visible even when it isn't a top suggestion.
  const cats = draft.category && !shown.includes(draft.category as never) ? [draft.category, ...shown.slice(0, 2)] : shown;

  return (
    <div className="flex flex-col gap-[18px] md:gap-[22px]">
      <h1 className="text-[30px] font-medium tracking-[-0.025em] md:text-[40px] md:tracking-[-0.03em]">Tell people what it is</h1>

      <Field label="Name" htmlFor="name" warn={errors.title}>
        <TextInput
          id="name"
          aria-invalid={!!errors.title}
          value={draft.title}
          maxLength={140}
          onChange={(e) => update({ title: e.target.value })}
          warn={!!errors.title}
          placeholder="Dhaka Streets — 40 Lightroom presets"
        />
      </Field>

      <Field label="One-line description" htmlFor="tagline">
        <TextInput
          id="tagline"
          value={draft.tagline}
          maxLength={200}
          onChange={(e) => update({ tagline: e.target.value })}
          placeholder="Warm, cinematic edits for city photos."
        />
      </Field>

      <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-4">
        <Field label="Price">
          <div className="flex gap-2">
            <Segmented
              className="flex-none md:flex-1"
              value={draft.priceType}
              onChange={(v) => update({ priceType: v })}
              options={[
                { value: "free", label: "Free" },
                { value: "paid", label: "Paid" },
              ]}
            />
            {/* Mobile puts the amount beside the toggle. */}
            {draft.priceType === "paid" && (
              <div className="flex-1 md:hidden">
                <AmountInput draft={draft} update={update} warn={!!errors.amount} />
              </div>
            )}
          </div>
        </Field>
        {draft.priceType === "paid" && (
          <div className="hidden md:block">
            <Field label="Amount">
              <AmountInput draft={draft} update={update} warn={!!errors.amount} />
            </Field>
          </div>
        )}
        {errors.amount && <p className="text-sm text-warn md:col-span-2">{errors.amount}</p>}
      </div>

      <Field label="Category" hint={draft.url ? <span className="hidden md:inline">— suggested from your link</span> : null}>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <Chip key={c} active={draft.category === c} onClick={() => update({ category: draft.category === c ? "" : c })}>
              {draft.category === c && <Check size={14} strokeWidth={2} />}
              {c}
            </Chip>
          ))}
          {!allCats && <Chip onClick={() => setAllCats(true)}>More…</Chip>}
        </div>
      </Field>

      <Field label="Works with">
        <TagInput label="Works with" value={draft.worksWith} onChange={(v) => update({ worksWith: v })} />
      </Field>

      {!more ? (
        <button
          type="button"
          onClick={() => setMore(true)}
          className="flex h-11 items-center gap-2 self-start text-[15px] font-medium text-ink-2 hover:text-ink"
        >
          <Plus size={18} strokeWidth={1.5} />
          <span className="md:hidden">Screenshots &amp; more</span>
          <span className="hidden md:inline">Add screenshots, what’s included, longer description</span>
          <span className="font-normal text-ink-3">(optional)</span>
        </button>
      ) : (
        <MoreDetails draft={draft} update={update} uploads={uploads} setUploads={setUploads} />
      )}
    </div>
  );
}

function AmountInput({ draft, update, warn }: { draft: Draft; update: Update; warn: boolean }) {
  return (
    <div
      className={`focus-ring flex h-[52px] items-center gap-2.5 rounded-[14px] border bg-surface pr-2 pl-4 transition-[border-color,box-shadow] duration-150 ${
        warn ? "border-warn-border" : "border-input"
      }`}
    >
      <span className="text-ink-3 md:hidden">{currencySymbol(draft.currency)}</span>
      <input
        inputMode="decimal"
        aria-label="Amount"
        value={draft.amount}
        onChange={(e) => update({ amount: e.target.value.replace(/[^\d.]/g, "") })}
        placeholder="0"
        className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-3"
      />
      <label className="relative flex h-9 flex-none items-center gap-1.5 rounded-[10px] bg-soft px-3 text-sm">
        <span>
          {currencySymbol(draft.currency)} {draft.currency}
        </span>
        <ChevronDown size={12} strokeWidth={2} />
        <select
          aria-label="Currency"
          value={draft.currency}
          onChange={(e) => update({ currency: e.target.value as Draft["currency"] })}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          <option value="BDT">৳ BDT</option>
          <option value="USD">$ USD</option>
        </select>
      </label>
    </div>
  );
}

function MoreDetails({
  draft,
  update,
  uploads,
  setUploads,
}: {
  draft: Draft;
  update: Update;
  uploads: Upload[];
  setUploads: (u: Upload[]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileWarn, setFileWarn] = useState<string | null>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const ok = [...list].filter((f) => /^image\/(png|jpe?g|webp|gif)$/.test(f.type) && f.size <= 5 * 1024 * 1024);
    setFileWarn(ok.length < list.length ? "Some files were skipped — use PNG, JPG or WebP under 5 MB." : null);
    setUploads([...uploads, ...ok.map((file) => ({ file, preview: URL.createObjectURL(file) }))].slice(0, 5));
  }

  const rows = draft.included;
  const setRow = (i: number, patch: Partial<Draft["included"][number]>) =>
    update({ included: rows.map((r, n) => (n === i ? { ...r, ...patch } : r)) });

  return (
    <div className="flex flex-col gap-[18px] border-t border-line-soft pt-5 md:gap-[22px]">
      <Field label="Screenshots" hint="(up to 5, uploaded when you publish)" warn={fileWarn}>
        <div className="grid grid-cols-3 gap-2.5 md:grid-cols-6">
          {uploads.map((u, i) => (
            <div key={u.preview} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stripes">
              <img src={u.preview} alt="" className="absolute inset-0 size-full object-cover" />
              <button
                type="button"
                onClick={() => setUploads(uploads.filter((_, n) => n !== i))}
                aria-label="Remove screenshot"
                className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-white/92"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>
          ))}
          {uploads.length < 5 && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-input bg-surface text-[13px] text-ink-3 hover:border-ink-3 hover:text-ink"
            >
              <ImagePlus size={20} strokeWidth={1.5} />
              Add
            </button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))}
        />
      </Field>

      <Field label="What’s included">
        <div className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={r.label}
                onChange={(e) => setRow(i, { label: e.target.value })}
                placeholder="40 presets for Lightroom Classic & CC"
                aria-label="Item"
                className={inputClass(false, "flex-1")}
              />
              <input
                value={r.format}
                onChange={(e) => setRow(i, { format: e.target.value.toUpperCase() })}
                placeholder="XMP"
                aria-label="Format"
                maxLength={12}
                className={inputClass(false, "w-24 font-mono text-sm uppercase md:w-28")}
              />
              <button
                type="button"
                onClick={() => update({ included: rows.filter((_, n) => n !== i) })}
                aria-label="Remove row"
                className="flex size-[52px] flex-none items-center justify-center rounded-full text-ink-3 hover:bg-soft hover:text-ink"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => update({ included: [...rows, { label: "", format: "" }] })}
            className="flex h-11 items-center gap-2 self-start text-[15px] font-medium text-ink-2 hover:text-ink"
          >
            <Plus size={18} strokeWidth={1.5} />
            Add a row
          </button>
        </div>
      </Field>

      <Field label="Longer description" htmlFor="description">
        <textarea
          id="description"
          value={draft.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={5}
          maxLength={5000}
          placeholder="What it is, who it’s for, and what makes it good."
          className={inputClass(false, "h-auto py-3.5 leading-[1.6]")}
        />
      </Field>
    </div>
  );
}

/* ---------------------------------------------------------------- Review */

export function ReviewStep({
  draft,
  slug,
  cover,
  onEdit,
  error,
}: {
  draft: Draft;
  slug: string;
  cover: string | null;
  onEdit: () => void;
  error: string | null;
}) {
  const tags = [...draft.formats, ...draft.worksWith].map((t) => t.toUpperCase());
  const price = draftPrice(draft);
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5 md:gap-2">
          <h1 className="text-[30px] font-medium tracking-[-0.025em] md:text-[40px] md:tracking-[-0.03em]">Looks good?</h1>
          <p className="text-[15px] text-ink-2 md:text-base">
            <span className="hidden md:inline">Your page will live at </span>
            <span className="font-mono text-sm text-ink">{displayUrl(`/p/${slug}`)}</span>
          </p>
        </div>
        <button type="button" onClick={onEdit} className="link hidden min-h-11 text-[15px] md:block">
          Edit
        </button>
      </div>

      {error && <p className="rounded-2xl border border-warn-line bg-notice px-4 py-3 text-[15px] text-warn">{error}</p>}

      <div className="overflow-hidden rounded-3xl border border-line-soft bg-surface shadow-[0_20px_50px_-24px_rgba(20,35,80,.22)] md:grid md:grid-cols-[minmax(0,1fr)_320px] md:gap-7 md:border-white md:p-5">
        <Cover src={cover} alt="" className="aspect-[16/10] md:rounded-2xl">
          <button
            type="button"
            onClick={onEdit}
            className="absolute top-3 right-3 flex h-8 items-center rounded-full bg-white/92 px-3 text-sm font-medium md:hidden"
          >
            Edit
          </button>
        </Cover>
        <div className="flex flex-col gap-2 p-4 md:gap-3.5 md:py-1.5 md:pr-1.5 md:pl-0">
          <div className="text-[19px] leading-[1.15] font-medium tracking-[-0.01em] md:text-2xl md:tracking-[-0.02em]">
            {draft.title}
          </div>
          {draft.tagline && <div className="text-sm text-ink-2 md:text-[15px]">{draft.tagline}</div>}
          <div className="flex items-center justify-between pt-1.5 md:hidden">
            <span className="text-lg font-medium">{price}</span>
            {tags.length > 0 && (
              <span className="rounded-md bg-soft px-2 py-1 font-mono text-xs">{tags.slice(0, 2).join(" · ")}</span>
            )}
          </div>
          <div className="hidden text-[22px] font-medium md:block">{price}</div>
          <div className="hidden md:block" aria-hidden>
            <div className={buttonClass("primary", 48, "pointer-events-none w-full opacity-90")}>
              Get it on {draft.domain}
              <ArrowUpRight size={14} strokeWidth={1.75} />
            </div>
          </div>
          {tags.length > 0 && (
            <div className="hidden flex-wrap gap-1.5 md:flex">
              {tags.slice(0, 4).map((t) => (
                <MonoTag key={t}>{t}</MonoTag>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Live */

export function LiveStep({ slug, onAnother }: { slug: string; onAnother: () => void }) {
  const [copied, setCopied] = useState(false);
  const path = `/p/${slug}`;
  const shown = displayUrl(path);
  const url = `${siteUrl()}${path}`;
  const enc = encodeURIComponent(url);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const share = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { label: "X", href: `https://x.com/intent/post?url=${enc}`, desktopOnly: true },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-wash px-6 pb-20 text-center md:gap-5 md:pb-0">
      <div className="flex size-[72px] items-center justify-center rounded-full bg-surface text-accent shadow-[0_12px_30px_-12px_rgba(29,91,240,.5)]">
        <Check size={32} strokeWidth={1.75} />
      </div>
      <h1 className="mt-2 text-[32px] leading-[1.1] font-medium tracking-[-0.03em] md:text-5xl md:leading-[1.05]">
        <span className="md:hidden">Your page is live</span>
        <span className="hidden md:inline">Your product page is live</span>
      </h1>
      <p className="text-base leading-[1.5] text-ink-2 md:text-[17px]">
        Share{" "}
        <span className="md:hidden">the link</span>
        <span className="hidden md:inline">this link anywhere</span>. Buyers land here, then go to your store.
      </p>
      <div className="mt-0 flex h-14 w-full items-center gap-2 rounded-full border border-input bg-surface pr-1.5 pl-[18px] md:mt-2 md:h-[60px] md:w-[520px] md:gap-3 md:pr-2 md:pl-6">
        <span className="min-w-0 flex-1 truncate text-left font-mono text-[13px] md:text-[15px]">{shown}</span>
        <Button variant="strong" onClick={copy} className="px-4 text-sm md:px-5 md:text-[15px]" aria-live="polite">
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:gap-2.5">
        {share.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary", 44, `h-12 px-[18px] text-sm hover:text-ink hover:no-underline md:h-11 ${s.desktopOnly ? "max-md:hidden" : ""}`)}
          >
            {s.label}
          </a>
        ))}
      </div>
      <Link href={path} className={buttonClass("primary", 52, "mt-2 w-full hover:text-white hover:no-underline md:mt-4 md:w-auto")}>
        View your page
      </Link>
      <Button variant="ghost" onClick={onAnother} className="px-[18px]">
        List another
      </Button>
    </div>
  );
}
