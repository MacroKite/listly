import { Suspense } from "react";
import Form from "next/form";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { hasSupabase } from "@/lib/supabase/env";
import { AccountMenu } from "./account";
import { ButtonLink, Logo } from "./ui";

async function HeaderUser() {
  // Demo mode has no accounts to sign in to.
  if (!hasSupabase) return null;
  return <AccountMenu user={await getCurrentUser()} />;
}

/**
 * Desktop top bar. `discover` puts the accent "List a product" pill on its own;
 * `page` adds the inline search and demotes the pill to secondary, since the
 * page's own primary action ("Get it") owns the accent.
 */
export function TopBar({ variant = "discover", query = "" }: { variant?: "discover" | "page"; query?: string }) {
  return (
    <header
      className={`hidden h-[72px] items-center justify-between gap-6 px-10 md:flex ${
        variant === "page" ? "border-b border-line-soft" : ""
      }`}
    >
      <Logo />
      {variant === "page" && (
        <Form action="/search" className="focus-ring flex h-11 max-w-[440px] flex-1 items-center gap-2.5 rounded-full border border-transparent bg-soft px-4 text-ink-3">
          <Search size={18} strokeWidth={1.5} aria-hidden />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search Listly"
            aria-label="Search Listly"
            className="h-full flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-3"
          />
        </Form>
      )}
      <div className="flex items-center gap-3">
        <ButtonLink href="/sell" variant={variant === "page" ? "secondary" : "primary"} size={44}>
          List a product
        </ButtonLink>
        <Suspense fallback={null}>
          <HeaderUser />
        </Suspense>
      </div>
    </header>
  );
}

export { HeaderUser };
