import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-telemetry font-medium uppercase tracking-wider text-[11px] transition-colors border",
  {
    variants: {
      variant: {
        default:
          "border-outline-variant/60 bg-surface-container-high text-on-surface",
        safe:
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
        warning:
          "border-amber-500/40 bg-amber-500/10 text-amber-400",
        critical:
          "border-rose-500/40 bg-rose-500/15 text-rose-400 font-semibold",
        identity:
          "border-sky-500/40 bg-sky-500/15 text-sky-300",
        outline:
          "border-outline-variant text-on-surface-variant bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "safe" && "bg-emerald-400",
            variant === "warning" && "bg-amber-400 animate-pulse",
            variant === "critical" && "bg-rose-400 animate-ping",
            variant === "identity" && "bg-sky-400",
            (!variant || variant === "default" || variant === "outline") && "bg-slate-400"
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
