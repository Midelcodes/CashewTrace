import { LoadingScreen } from "@/components/ui/Skeleton";

export default function Loading() {
  return <main className="flex-1 px-4 py-6"><LoadingScreen variant="cards" label="Loading impact figures…" /></main>;
}
