import type { Metadata } from "next";
import { Logo } from "@/components/ui";
import { ResetPasswordForm } from "./form";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

/** "Forgot password?" email → /auth/callback (signs the user in) → here. */
export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col gap-8 px-5 pt-8 md:pt-16">
      <Logo />
      <ResetPasswordForm />
    </main>
  );
}
