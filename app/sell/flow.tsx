"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { SignInDialog } from "@/components/sign-in";
import { Button, Logo } from "@/components/ui";
import { guessCategory, suggestFormats } from "@/lib/categories";
import { normaliseUrl, slugify, storeDomain } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { hasSupabase } from "@/lib/supabase/env";
import type { Draft, Unfurl } from "@/lib/types";
import { publishProduct } from "./publish";
import { DetailsStep, LinkStep, LiveStep, ReviewStep, type DetailErrors, type UnfurlStatus, type Upload } from "./steps";

type Step = "link" | "details" | "review" | "live";
const STEPS = ["link", "details", "review"] as const;
const LABELS = { link: "Link", details: "Details", review: "Review" };
const KEY = "listly:draft:v1";

const EMPTY: Draft = {
  url: "",
  domain: "",
  title: "",
  tagline: "",
  description: "",
  priceType: "free",
  amount: "",
  currency: "BDT",
  category: "",
  worksWith: [],
  formats: [],
  included: [],
  cover: null,
  screenshots: [],
};

function load(): { draft: Draft; step: Step } {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved?.draft) return { draft: { ...EMPTY, ...saved.draft }, step: saved.step ?? "link" };
  } catch {
    // Corrupt or blocked storage: start fresh.
  }
  return { draft: EMPTY, step: "link" };
}

export default function SellFlow() {
  const router = useRouter();
  const [initial] = useState(load);
  const [draft, setDraft] = useState<Draft>(initial.draft);
  const [step, setStep] = useState<Step>(initial.step === "live" ? "link" : initial.step);
  const [status, setStatus] = useState<UnfurlStatus>("idle");
  const [urlTouched, setUrlTouched] = useState(false);
  const [errors, setErrors] = useState<DetailErrors>({});
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(() =>
    new URLSearchParams(location.search).has("auth_error") ? "Sign-in didn’t finish. Try again." : null,
  );
  const [signInOpen, setSignInOpen] = useState(false);
  const [liveSlug, setLiveSlug] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inflight = useRef<AbortController>(undefined);
  const autoPublished = useRef(false);

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    // A warning goes away as soon as the creator touches that field.
    if ("title" in patch && errors.title) setErrors((e) => ({ ...e, title: undefined }));
    if (("amount" in patch || "priceType" in patch) && errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
  };
  const validUrl = normaliseUrl(draft.url);
  const urlInvalid = urlTouched && !!draft.url.trim() && !validUrl;
  const dirty = !!(draft.url || draft.title);

  // Autosave on every change. Uploads are File objects and stay in memory.
  useEffect(() => {
    try {
      if (step === "live") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, JSON.stringify({ draft, step }));
    } catch {
      // Storage full or blocked; the flow still works for this visit.
    }
  }, [draft, step]);

  // Back from Google sign-in with ?publish=1: finish what the creator started.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has("publish") && !params.has("auth_error")) return;
    router.replace("/sell");
    if (params.has("publish") && step === "review" && !autoPublished.current) {
      autoPublished.current = true;
      void publish();
    }
    // Runs once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyUnfurl(u: Unfurl, typed: string) {
    const text = `${u.title ?? ""} ${u.tagline ?? ""} ${u.url}`;
    setDraft((d) => ({
      ...d,
      url: typed,
      domain: u.domain,
      title: u.title ?? "",
      tagline: u.tagline ?? "",
      cover: u.cover,
      ...(u.price != null
        ? { priceType: u.price > 0 ? "paid" : "free", amount: u.price > 0 ? String(u.price) : "", currency: u.currency ?? d.currency }
        : {}),
      category: guessCategory(text) ?? d.category,
      formats: d.formats.length ? d.formats : suggestFormats(text),
    }));
    setStatus("found");
  }

  function onUrl(value: string) {
    update({ url: value });
    clearTimeout(timer.current);
    inflight.current?.abort();
    const url = normaliseUrl(value);
    if (!url) {
      setStatus("idle");
      return;
    }
    setStatus("loading");
    timer.current = setTimeout(async () => {
      const ac = new AbortController();
      inflight.current = ac;
      try {
        const res = await fetch(`/api/unfurl?url=${encodeURIComponent(url)}`, { signal: ac.signal });
        if (!res.ok) throw new Error(String(res.status));
        applyUnfurl((await res.json()) as Unfurl, value);
      } catch {
        if (ac.signal.aborted) return;
        // Still allow Continue; leave the fields empty for the creator to fill.
        setDraft((d) => ({ ...d, domain: storeDomain(url), title: "", tagline: "", cover: null }));
        setStatus("failed");
      }
    }, 450);
  }

  function next() {
    if (step === "link") {
      setUrlTouched(true);
      if (!validUrl) return;
      if (!draft.domain) update({ domain: storeDomain(validUrl) });
      setStep("details");
    } else if (step === "details") {
      const e: DetailErrors = {};
      if (!draft.title.trim()) e.title = "Give it a name so people know what it is.";
      if (draft.priceType === "paid" && !(Number(draft.amount) > 0)) e.amount = "Add a price, or switch to Free.";
      setErrors(e);
      if (Object.keys(e).length === 0) setStep("review");
    }
    window.scrollTo({ top: 0 });
  }

  function back() {
    setPublishError(null);
    if (step === "details") setStep("link");
    else if (step === "review") setStep("details");
    else router.push("/");
  }

  async function uploadScreenshots(userId: string): Promise<string[]> {
    const supabase = createClient();
    const urls: string[] = [];
    for (const { file } of uploads) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      urls.push(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
    }
    return urls;
  }

  async function publish() {
    setPublishing(true);
    setPublishError(null);
    try {
      let screenshots: string[] = [];
      if (hasSupabase) {
        const { data } = await createClient().auth.getClaims();
        const userId = data?.claims?.sub;
        if (!userId) {
          setSignInOpen(true);
          return;
        }
        screenshots = await uploadScreenshots(userId);
      }
      const res = await publishProduct({ ...draft, screenshots });
      if (res.ok) {
        uploads.forEach((u) => URL.revokeObjectURL(u.preview));
        setUploads([]);
        setLiveSlug(res.slug);
        setStep("live");
      } else if (res.needsSignIn) {
        setSignInOpen(true);
      } else {
        setPublishError(res.error);
      }
    } catch {
      setPublishError("Something went wrong uploading. Your draft is safe — try again.");
    } finally {
      setPublishing(false);
    }
  }

  function another() {
    setDraft(EMPTY);
    setStatus("idle");
    setUrlTouched(false);
    setErrors({});
    setLiveSlug(null);
    setStep("link");
  }

  if (step === "live" && liveSlug) {
    return (
      <main className="flex min-h-dvh flex-col">
        <LiveStep slug={liveSlug} onAnother={another} />
      </main>
    );
  }

  const index = STEPS.indexOf(step as (typeof STEPS)[number]);
  const width = step === "review" ? "md:max-w-[920px]" : step === "details" ? "md:max-w-[680px]" : "md:max-w-[640px]";
  const primary =
    step === "review" ? (
      <Button size={52} onClick={publish} disabled={publishing} className="w-full md:w-auto md:px-9">
        {publishing ? "Publishing…" : "Publish"}
      </Button>
    ) : (
      <Button size={52} onClick={next} disabled={step === "link" && !draft.url.trim()} className="w-full md:w-auto">
        Continue
      </Button>
    );

  return (
    <main className="flex min-h-dvh flex-col bg-canvas md:bg-wash-flow">
      {/* Desktop header: logo · progress · Draft saved + Exit */}
      <header className="hidden h-[72px] grid-cols-[1fr_auto_1fr] items-center px-10 md:grid">
        <Logo />
        <ol className="flex gap-6 text-sm">
          {STEPS.map((s, i) => (
            <li key={s} className="flex w-[120px] flex-col gap-2" aria-current={s === step ? "step" : undefined}>
              <span className={`h-1 rounded transition-colors duration-200 ${i <= index ? "bg-ink" : "bg-[#DDE1E8]"}`} />
              <span className={s === step ? "font-medium" : i < index ? "text-ink-2" : "text-ink-3"}>
                {i + 1} {LABELS[s]}
              </span>
            </li>
          ))}
        </ol>
        <div className="flex items-center justify-end gap-2 text-sm text-ink-3">
          {dirty && <span aria-live="polite">Draft saved</span>}
          <Button variant="ghost" onClick={() => router.push("/")} className="px-[18px]">
            Exit
          </Button>
        </div>
      </header>

      {/* Mobile header: close/back · Step n of 3 · Saved */}
      <header className="md:hidden">
        <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center px-3">
          <button
            type="button"
            onClick={step === "link" ? () => router.push("/") : back}
            aria-label={step === "link" ? "Exit" : "Back"}
            className="flex size-11 items-center justify-center"
          >
            {step === "link" ? <X size={20} strokeWidth={1.5} /> : <ChevronLeft size={20} strokeWidth={1.5} />}
          </button>
          <span className="text-[15px] font-medium">Step {index + 1} of 3</span>
          <span className="pr-2 text-right text-[13px] text-ink-3">{dirty ? "Saved" : ""}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 px-5">
          {STEPS.map((s, i) => (
            <span key={s} className={`h-1 rounded ${i <= index ? "bg-ink" : "bg-[#DDE1E8]"}`} />
          ))}
        </div>
      </header>

      <div className={`mx-auto w-full flex-1 px-5 pt-6 pb-10 md:px-0 ${step === "link" ? "md:pt-[72px]" : "md:pt-8"} ${width}`}>
        {step === "link" && (
          <LinkStep draft={draft} status={status} invalid={urlInvalid} onUrl={onUrl} onBlur={() => setUrlTouched(true)} />
        )}
        {step === "details" && (
          <DetailsStep draft={draft} update={update} errors={errors} uploads={uploads} setUploads={setUploads} />
        )}
        {step === "review" && (
          <ReviewStep
            draft={draft}
            slug={slugify(draft.title) || "your-product"}
            cover={draft.cover ?? uploads[0]?.preview ?? null}
            onEdit={() => setStep("details")}
            error={publishError}
          />
        )}
      </div>

      {/* Desktop footer: Back left, the one primary action right. */}
      <footer className="hidden h-[88px] items-center justify-between border-t border-white/80 px-10 md:flex">
        {step !== "link" ? (
          <Button variant="ghost" size={52} onClick={back} className="px-5">
            Back
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-5">
          {step === "review" && <span className="text-sm text-ink-3">Free to list · no commission</span>}
          {primary}
        </div>
      </footer>

      {/* Mobile sticky action bar. */}
      <div className="sticky bottom-0 z-30 flex flex-col items-center gap-2.5 border-t border-line-soft bg-white/94 px-5 pt-3.5 pb-8 backdrop-blur md:hidden">
        {step === "review" && <span className="text-[13px] text-ink-3">Free to list · no commission</span>}
        {primary}
      </div>

      {hasSupabase && (
        <SignInDialog
          open={signInOpen}
          onClose={() => setSignInOpen(false)}
          returnTo="/sell?publish=1"
          onSignedIn={() => {
            setSignInOpen(false);
            void publish();
          }}
        />
      )}
    </main>
  );
}
