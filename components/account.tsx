"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SessionUser } from "@/lib/auth";
import { SignInDialog } from "./sign-in";
import { Avatar, Button } from "./ui";

/** "Sign in" button that opens the account dialog and refreshes server data once signed in. */
export function SignInButton({
  label = "Sign in",
  initialMode = "signin",
  variant = "secondary",
  size = 44,
}: {
  label?: string;
  initialMode?: "signin" | "signup";
  variant?: "primary" | "secondary";
  size?: 44 | 48;
}) {
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <SignInDialog
        purpose="account"
        initialMode={initialMode}
        open={open}
        onClose={() => setOpen(false)}
        returnTo={path}
        onSignedIn={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}

export function useSignOut() {
  const router = useRouter();
  return async () => {
    await createClient().auth.signOut();
    router.refresh();
  };
}

/** Header entry: Sign in when signed out, avatar menu with Sign out when signed in. */
export function AccountMenu({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const signOut = useSignOut();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!user) return <SignInButton />;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className="focus-ring flex rounded-full"
      >
        <Avatar name={user.name} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+8px)] right-0 z-40 flex w-60 flex-col rounded-[18px] border border-line-soft bg-surface p-2 shadow-panel"
        >
          {user.handle ? (
            <Link
              role="menuitem"
              href={`/@${user.handle}`}
              onClick={() => setOpen(false)}
              className="flex flex-col rounded-xl px-3 py-2.5 text-ink hover:bg-soft hover:text-ink hover:no-underline"
            >
              <span className="truncate text-[15px] font-medium">{user.name}</span>
              <span className="truncate text-sm text-ink-3">@{user.handle} · View profile</span>
            </Link>
          ) : (
            <span className="truncate px-3 py-2.5 text-[15px] font-medium">{user.name}</span>
          )}
          <span className="my-1 h-px bg-line-soft" />
          <Link
            role="menuitem"
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center rounded-xl px-3 text-[15px] text-ink hover:bg-soft hover:text-ink hover:no-underline"
          >
            My products
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => (setOpen(false), void signOut())}
            className="flex min-h-11 items-center rounded-xl px-3 text-left text-[15px] text-ink hover:bg-soft"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function SignOutButton() {
  const signOut = useSignOut();
  return (
    <Button variant="secondary" size={44} onClick={() => void signOut()}>
      Sign out
    </Button>
  );
}
