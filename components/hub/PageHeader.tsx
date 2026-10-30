import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  badge,
  action,
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          {title}
          {badge}
        </h1>
        {description && <p className="mt-1 text-sm text-ink/70">{description}</p>}
      </div>
      {action}
    </div>
  );
}
