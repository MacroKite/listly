import { ButtonLink, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-wash px-6 text-center">
      <Logo />
      <h1 className="mt-4 text-[32px] font-medium tracking-[-0.03em] md:text-5xl">This page isn’t here</h1>
      <p className="text-base text-ink-2 md:text-[17px]">It may have been unlisted, or the link has a typo.</p>
      <ButtonLink href="/" variant="strong" size={48} className="mt-2">
        Browse products
      </ButtonLink>
    </main>
  );
}
