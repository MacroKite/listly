"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Segmented } from "./ui";

type Method = "email" | "phone";
type Mode = "signin" | "signup";
type Notice = { title: string; body: string };

/** Normalises BD numbers typed locally (01XXXXXXXXX) to E.164. */
function toE164(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("880")) return `+${digits}`;
  if (digits.startsWith("0")) return `+880${digits.slice(1)}`;
  return `+${digits}`;
}

const MIN_PASSWORD = 8;

/**
 * Sign in / Create account. Email takes a password by default, with a one-time
 * code as the fallback; phone is code-only. `publish` is the prompt at Publish,
 * `account` the header entry; they differ only in copy. Centered modal on
 * desktop, bottom sheet on mobile. Calls onSignedIn once a session exists;
 * Google and email links leave the page and come back to `returnTo`.
 */
export function SignInDialog({
  open,
  onClose,
  onSignedIn,
  returnTo,
  purpose = "publish",
  initialMode = "signin",
}: {
  open: boolean;
  onClose: () => void;
  onSignedIn: () => void;
  returnTo: string;
  purpose?: "publish" | "account";
  initialMode?: Mode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [method, setMethod] = useState<Method>("email");
  const [mode, setMode] = useState<Mode>(initialMode);
  const [useCode, setUseCode] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [noAccount, setNoAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const forPublish = purpose === "publish";
  const withPassword = method === "email" && !useCode;
  const callbackUrl = (next: string) => `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  function clearError() {
    setError(null);
    setNoAccount(false);
  }

  /** Validated email or E.164 number, or null after showing why not. */
  function contactValue() {
    const value = method === "email" ? contact.trim() : toE164(contact);
    if (method === "email" ? !/^\S+@\S+\.\S+$/.test(value) : value.length < 10) {
      setError(method === "email" ? "That email doesn’t look right — check for typos." : "That number doesn’t look right.");
      return null;
    }
    return value;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    const value = contactValue();
    if (!value) return;
    if (withPassword) return mode === "signup" ? signUp(value) : signInWithPassword(value);
    return sendCode(value);
  }

  async function signInWithPassword(email: string) {
    setBusy(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (!error) return onSignedIn();
    if (error.code === "email_not_confirmed") return setError("Confirm your email first — the link is in your inbox.");
    if (error.code === "invalid_credentials") return setError("Wrong email or password.");
    setError(error.message);
  }

  async function signUp(email: string) {
    if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters.`);
    setBusy(true);
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: { data: name.trim() ? { name: name.trim() } : undefined, emailRedirectTo: callbackUrl(returnTo) },
    });
    setBusy(false);
    if (error) {
      if (error.code === "user_already_exists") return showExisting();
      if (error.code === "weak_password") return setError("Pick a stronger password — mix in numbers or symbols.");
      return setError(error.message);
    }
    // With email confirmation on, Supabase hides existing accounts behind a user with no identities.
    if (data.user && data.user.identities?.length === 0) return showExisting();
    if (data.session) return onSignedIn();
    setNotice({
      title: "Confirm your email",
      body: `We sent a link to ${email}. Open it in this browser to finish creating your account${forPublish ? " and publish" : ""}.`,
    });
  }

  function showExisting() {
    setMode("signin");
    setError("You already have an account with that email. Sign in instead.");
  }

  async function forgotPassword() {
    clearError();
    const email = contactValue();
    if (!email) return;
    setBusy(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: callbackUrl("/reset-password") });
    setBusy(false);
    if (error) return setError(error.message);
    setNotice({ title: "Check your email", body: `If ${email} has an account, we sent a link to set a new password.` });
  }

  async function sendCode(value: string) {
    // Signing in shouldn't quietly make a second account from a typo.
    const shouldCreateUser = mode === "signup";
    const data = shouldCreateUser && name.trim() ? { name: name.trim() } : undefined;
    setBusy(true);
    const supabase = createClient();
    const { error } =
      method === "email"
        ? await supabase.auth.signInWithOtp({
            email: value,
            // The default Supabase email sends a link; it lands on /auth/callback and returns to `returnTo`.
            options: { shouldCreateUser, data, emailRedirectTo: callbackUrl(returnTo) },
          })
        : await supabase.auth.signInWithOtp({ phone: value, options: { shouldCreateUser, data } });
    setBusy(false);
    if (error) {
      if (!shouldCreateUser && (error.code === "otp_disabled" || /signups not allowed/i.test(error.message))) {
        setNoAccount(true);
        return setError(`No account with that ${method === "email" ? "email" : "number"} yet.`);
      }
      return setError(error.message);
    }
    setSentTo(value);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!sentTo) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const token = code.replace(/\D/g, "");
    const { error } =
      method === "email"
        ? await supabase.auth.verifyOtp({ email: sentTo, token, type: "email" })
        : await supabase.auth.verifyOtp({ phone: sentTo, token, type: "sms" });
    setBusy(false);
    if (error) return setError("That code didn’t work. Check it, or send a new one.");
    onSignedIn();
  }

  async function google() {
    setBusy(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl(returnTo) },
    });
    if (error) {
      setBusy(false);
      setError(error.message);
    }
  }

  function back() {
    setSentTo(null);
    setNotice(null);
    setCode("");
    setError(null);
  }

  const title = notice
    ? notice.title
    : sentTo
      ? method === "email"
        ? "Check your email"
        : "Enter your code"
      : mode === "signup"
        ? forPublish
          ? "Create an account to publish"
          : "Create your account"
        : forPublish
          ? "Sign in to publish"
          : "Welcome back";
  const intro = notice
    ? notice.body
    : sentTo
      ? method === "email"
        ? `We sent a sign-in link to ${sentTo}. Open it in this browser${forPublish ? " and we’ll publish your product" : " to finish"}. If the email has a 6-digit code instead, enter it below.`
        : `We sent a 6-digit code to ${sentTo}.`
      : forPublish
        ? "Your draft is saved. We’ll publish it right after you sign in."
        : mode === "signup"
          ? "Free to join. List products and track views and clicks."
          : "Sign in to manage your listings.";
  const submitLabel = busy
    ? withPassword
      ? mode === "signup"
        ? "Creating…"
        : "Signing in…"
      : "Sending…"
    : withPassword
      ? mode === "signup"
        ? "Create account"
        : "Sign in"
      : "Send code";

  const input =
    "focus-ring h-[52px] w-full rounded-[14px] border border-input bg-surface px-4 text-base outline-none placeholder:text-ink-3";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto w-full max-w-none bg-transparent p-0 backdrop:bg-ink/30 backdrop:backdrop-blur-[2px] md:m-auto md:w-[440px]"
    >
      <div className="flex flex-col gap-5 rounded-t-[28px] bg-surface px-5 pt-6 pb-8 shadow-panel md:rounded-[24px] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-medium tracking-[-0.02em]">{title}</h2>
            <p className="text-[15px] leading-[1.55] text-ink-2">{intro}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mt-1 -mr-2 flex size-11 flex-none items-center justify-center rounded-full text-ink-2 hover:bg-soft">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {notice ? (
          <Button variant="secondary" size={52} onClick={back} className="w-full">
            Back to sign in
          </Button>
        ) : sentTo ? (
          <form onSubmit={verify} className="flex flex-col gap-3">
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              aria-label="Code"
              className={`${input} text-center font-mono text-xl tracking-[0.3em]`}
            />
            {error && <p className="text-sm text-warn">{error}</p>}
            <Button type="submit" size={52} disabled={busy || code.replace(/\D/g, "").length < 6} className="w-full">
              {busy ? "Checking…" : forPublish ? "Verify and publish" : "Verify and continue"}
            </Button>
            <Button variant="ghost" onClick={back}>
              Use a different {method === "email" ? "email" : "number"}
            </Button>
          </form>
        ) : (
          <>
            <Segmented
              options={[
                { value: "signin", label: "Sign in" },
                { value: "signup", label: "Create account" },
              ]}
              value={mode}
              onChange={(m) => (setMode(m), clearError())}
            />
            <Button variant="secondary" size={52} onClick={google} disabled={busy} className="w-full">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
                <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8z" />
                <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
              </svg>
              Continue with Google
            </Button>
            <div className="flex items-center gap-3 text-[13px] text-ink-3">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>
            <form onSubmit={submit} className="flex flex-col gap-3">
              {mode === "signup" && (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Name</span>
                  <input
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name or studio"
                    className={input}
                  />
                </label>
              )}
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">{method === "email" ? "Email" : "Phone number"}</span>
                <input
                  type={method === "email" ? "email" : "tel"}
                  inputMode={method === "email" ? "email" : "tel"}
                  autoComplete={method === "email" ? "email" : "tel"}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={method === "email" ? "you@example.com" : "01XXXXXXXXX"}
                  className={`${input} ${error ? "border-warn-border" : ""}`}
                />
              </label>
              {withPassword && (
                <label className="flex flex-col gap-2">
                  <span className="flex items-center justify-between text-sm font-medium">
                    Password
                    {mode === "signin" && (
                      <button type="button" onClick={forgotPassword} disabled={busy} className="link text-sm font-normal">
                        Forgot password?
                      </button>
                    )}
                  </span>
                  <input
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? `At least ${MIN_PASSWORD} characters` : ""}
                    className={input}
                  />
                </label>
              )}
              {error && (
                <p className="text-sm text-warn">
                  {error}
                  {noAccount && (
                    <>
                      {" "}
                      <button type="button" onClick={() => (setMode("signup"), clearError())} className="link">
                        Create one
                      </button>
                    </>
                  )}
                </p>
              )}
              <Button
                type="submit"
                variant="strong"
                size={52}
                disabled={busy || !contact.trim() || (withPassword && !password)}
                className="w-full"
              >
                {submitLabel}
              </Button>
              <div className="flex flex-wrap justify-center gap-x-5">
                {method === "email" && (
                  <button type="button" onClick={() => (setUseCode(!useCode), clearError())} className="link min-h-11 text-sm">
                    {useCode ? "Use a password instead" : "Email me a code instead"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (setMethod(method === "email" ? "phone" : "email"), setContact(""), clearError())}
                  className="link min-h-11 text-sm"
                >
                  Use {method === "email" ? "phone number" : "email"} instead
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
