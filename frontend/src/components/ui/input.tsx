import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-xl bg-surface-container-high/80 px-3.5 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 transition-all file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50 border",
          error
            ? "border-rose-500/60 focus-visible:ring-rose-500/30"
            : "border-white/[0.08] hover:border-white/[0.15] focus-visible:border-white/30",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
