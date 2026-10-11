"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD = 8;

export function ResetPasswordForm() {
  const router = useRouter();
  // null while checking; the reset link signs the user in before landing here.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getClaims()
      .then(({ data }) => setSignedIn(!!data?.claims?.sub));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters.`);
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      if (error.code === "same_password") return setError("That’s your current password — pick a new one.");
      if (error.code === "weak_password") return setError("Pick a stronger password — mix in numbers or symbols.");
      return setError(error.message);
    }
    router.replace("/");
    router.refresh();
  }

  if (signedIn === null) return null;

  if (!signedIn) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-[30px] font-medium tracking-[-0.025em]">This link has expired</h1>
        <p className="text-base leading-[1.6] text-ink-2">
          Reset links work once and only for a short while. Choose “Forgot password?” when signing in to get a new one.
        </p>
        <ButtonLink href="/" size={48} className="self-start">
          Back to Listly
        </ButtonLink>
      </section>
    );
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <h1 className="text-[30px] font-medium tracking-[-0.025em]">Set a new password</h1>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">New password</span>
        <input
          autoFocus
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={`At least ${MIN_PASSWORD} characters`}
          className="focus-ring h-[52px] w-full rounded-[14px] border border-input bg-surface px-4 text-base outline-none placeholder:text-ink-3"
        />
      </label>
      {error && <p className="text-sm text-warn">{error}</p>}
      <Button type="submit" variant="strong" size={52} disabled={busy || !password} className="w-full">
        {busy ? "Saving…" : "Save password"}
      </Button>
    </form>
  );
}
