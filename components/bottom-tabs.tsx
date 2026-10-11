"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Search, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/sell", label: "Sell", icon: Plus, accent: true },
  { href: "/dashboard", label: "Profile", icon: User },
] as const;

/** Mobile-only tab bar that replaces the desktop top bar. */
export function BottomTabs() {
  const path = usePathname();
  return (
    <>
      <div className="h-[88px] md:hidden" aria-hidden />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid h-[88px] grid-cols-4 items-center border-t border-line-soft bg-white/92 pb-4 backdrop-blur md:hidden"
      >
        {TABS.map(({ href, label, icon: Icon, ...t }) => {
          const on = href === "/" ? path === "/" : path.startsWith(href);
          if ("accent" in t) {
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-1 text-xs font-medium text-accent hover:no-underline">
                <span className="flex h-6 w-[30px] items-center justify-center rounded-full bg-accent text-white">
                  <Plus size={16} strokeWidth={2} />
                </span>
                {label}
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className={`flex min-h-11 flex-col items-center justify-center gap-1 text-xs hover:no-underline ${
                on ? "font-medium text-ink" : "text-ink-3"
              }`}
            >
              <Icon size={22} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
