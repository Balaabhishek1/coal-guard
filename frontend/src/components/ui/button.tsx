import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-white text-black font-semibold shadow-sm hover:bg-zinc-200 active:bg-zinc-300",
        secondary:
          "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-white/[0.08]",
        statutory:
          "bg-emerald-600 text-white font-medium hover:bg-emerald-500 border border-emerald-500/30",
        destructive:
          "bg-rose-600 text-white font-medium hover:bg-rose-500 border border-rose-500/30",
        outline:
          "border border-white/[0.08] bg-transparent text-on-surface hover:bg-surface-container",
        ghost:
          "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
        pill:
          "rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-white/[0.08] text-on-surface text-xs",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        default: "h-9 px-4 py-2 text-xs",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-sm",
        pill: "h-7 px-3 text-xs",
        icon: "h-9 w-9 p-0 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
