import { type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass rounded-3xl shadow-[0_20px_60px_-30px_oklch(0_0_0/0.6)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function GlassIcon({
  children,
  className,
  tint,
}: {
  children: ReactNode;
  className?: string;
  tint?: "cyan" | "amber" | "red" | "green" | "violet" | "default";
}) {
  const tintMap: Record<string, string> = {
    cyan: "text-safety-cyan",
    amber: "text-safety-amber",
    red: "text-safety-red",
    green: "text-safety-green",
    violet: "text-safety-violet",
    default: "text-foreground",
  };
  return (
    <span
      className={cn(
        "glass-icon inline-flex size-11 items-center justify-center rounded-2xl",
        tintMap[tint ?? "default"],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
      </div>
      {action}
    </header>
  );
}

export function SeverityPill({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    low: "bg-safety-green/15 text-safety-green border-safety-green/30",
    medium: "bg-safety-amber/15 text-safety-amber border-safety-amber/30",
    high: "bg-safety-red/15 text-safety-red border-safety-red/40",
    critical: "bg-safety-red/25 text-safety-red border-safety-red/60",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
        map[severity] ?? map.low,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {severity}
    </span>
  );
}

export function StatusDot({ tone }: { tone: "green" | "amber" | "red" }) {
  const map = {
    green: "bg-safety-green",
    amber: "bg-safety-amber",
    red: "bg-safety-red",
  };
  return (
    <span className="live-dot relative inline-block">
      <span className={cn("block size-2 rounded-full", map[tone])} />
    </span>
  );
}
