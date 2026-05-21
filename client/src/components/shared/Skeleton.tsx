import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md border-2 border-border bg-[repeating-linear-gradient(-45deg,var(--surface-muted),var(--surface-muted)_8px,var(--surface)_8px,var(--surface)_16px)]",
        className
      )}
    />
  );
}
