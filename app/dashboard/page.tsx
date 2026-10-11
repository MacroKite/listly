import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SignInButton, SignOutButton } from "@/components/account";
import { BottomTabs } from "@/components/bottom-tabs";
import { TopBar } from "@/components/top-bar";
import { Avatar, ButtonLink } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { hasSupabase } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "My products", robots: { index: false } };

/** Who's signed in, or a way in. Doubles as the mobile Profile tab's account controls. */
async function Account() {
  if (!hasSupabase) return null;
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex w-full max-w-[520px] flex-col gap-4 rounded-[20px] border border-line-soft bg-surface p-5">
        <p className="text-base leading-[1.6] text-ink-2">Sign in to see and manage the products you’ve listed.</p>
        <div className="flex flex-wrap gap-3">
          <SignInButton variant="primary" />
          <SignInButton label="Create account" initialMode="signup" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex w-full max-w-[520px] items-center gap-3 rounded-[20px] border border-line-soft bg-surface p-4">
      <Avatar name={user.name} />
      {user.handle ? (
        <Link href={`/@${user.handle}`} className="flex min-w-0 flex-1 flex-col text-ink hover:text-ink hover:no-underline">
          <span className="truncate text-[15px] font-medium hover:underline">{user.name}</span>
          <span className="truncate text-sm text-ink-3">@{user.handle} · View profile</span>
        </Link>
      ) : (
        <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{user.name}</span>
      )}
      <SignOutButton />
    </div>
  );
}

// Placeholder until D5/M3 "My products" is built.
export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-[1440px]">
      <TopBar variant="page" />
      <section className="flex flex-col items-start gap-4 px-5 pt-10 md:px-10 md:pt-16">
        <h1 className="text-[30px] font-medium tracking-[-0.025em] md:text-4xl">My products</h1>
        <Suspense fallback={null}>
          <Account />
        </Suspense>
        <p className="max-w-[520px] text-base leading-[1.6] text-ink-2">
          Views, clicks and link health for your listings will show up here soon.
        </p>
        <ButtonLink href="/sell" size={48}>
          List a product
        </ButtonLink>
      </section>
      <BottomTabs />
    </main>
  );
}
