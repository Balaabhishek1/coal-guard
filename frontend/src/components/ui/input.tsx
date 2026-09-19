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
          "flex h-9 w-full rounded bg-surface-container px-3 py-1.5 text-body-md text-on-surface placeholder:text-on-surface-variant/50 transition-colors file:border-0 file:bg-transparent file:text-body-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 border",
          error
            ? "border-rose-500 focus-visible:ring-rose-500"
            : "border-outline-variant/60 hover:border-outline focus-visible:border-primary",
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
