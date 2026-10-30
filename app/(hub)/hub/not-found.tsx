import Link from "next/link";

// Shown inside the hub shell when a farmer or lot doesn't exist or belongs to another hub.
export default function HubNotFound() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="mt-2 text-ink/70">
        This record doesn’t exist, or it belongs to another hub. Search for it from the lists instead.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/hub/lots" className="flex h-12 items-center rounded-xl bg-brand px-5 font-semibold text-cream">
          Lots
        </Link>
        <Link href="/hub/farmers" className="flex h-12 items-center rounded-xl px-5 font-semibold text-brand ring-1 ring-brand/30">
          Farmers
        </Link>
      </div>
    </div>
  );
}
