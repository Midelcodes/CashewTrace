import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAgent } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Hub sign-in · CashewTrace" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentAgent()) redirect("/hub");
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-8 text-center text-2xl font-bold text-brand">
        Cashew<span className="text-accent-dark">Trace</span>
      </Link>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-xl font-bold">Hub agent sign-in</h1>
        <p className="mt-1 mb-6 text-sm text-ink/70">Use the phone number and PIN your hub gave you.</p>
        <LoginForm next={next} />
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-brand/30 bg-brand-light/60 p-4 text-sm">
        <p className="font-semibold text-brand">Demo access</p>
        <p className="mt-1 text-ink/80">
          Agent phone <span className="font-mono">0800 000 9001</span>, PIN{" "}
          <span className="font-mono">1234</span>
        </p>
      </div>
    </main>
  );
}
