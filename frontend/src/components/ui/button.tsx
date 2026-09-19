import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.99]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-container text-white font-semibold shadow-md hover:bg-sky-400 active:bg-sky-600 border border-sky-400/30",
        secondary:
          "bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/50",
        statutory:
          "bg-emerald-600 text-white font-semibold hover:bg-emerald-500 border border-emerald-400/30 shadow-sm",
        destructive:
          "bg-rose-600 text-white font-semibold hover:bg-rose-500 border border-rose-400/30 shadow-sm",
        outline:
          "border border-outline-variant bg-transparent text-on-surface hover:bg-surface-container",
        ghost:
          "text-on-surface hover:bg-surface-container hover:text-white",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        default: "h-9 px-4 py-2 text-headline-sm",
        sm: "h-8 px-3 text-label-sm",
        lg: "h-11 px-6 text-headline-md",
        icon: "h-9 w-9 p-0",
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
