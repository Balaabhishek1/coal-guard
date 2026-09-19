import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue>({
  open: false,
  onOpenChange: () => {},
});

export const Sheet: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}> = ({ open, onOpenChange, children }) => {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
};

export const SheetTrigger: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, onClick, className }) => {
  const { onOpenChange } = React.useContext(SheetContext);
  return (
    <div
      className={cn("inline-block cursor-pointer", className)}
      onClick={() => {
        onClick?.();
        onOpenChange(true);
      }}
    >
      {children}
    </div>
  );
};

export const SheetContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  side?: "right" | "left";
}> = ({ children, className, side = "right" }) => {
  const { open, onOpenChange } = React.useContext(SheetContext);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in-0"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Slide-Over Sheet Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 ml-auto h-full w-full max-w-xl bg-surface-container border-l border-outline-variant/60 p-space-lg shadow-2xl overflow-y-auto flex flex-col animate-in duration-200",
          side === "right" ? "slide-in-from-right" : "slide-in-from-left",
          className
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 p-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
          aria-label="Close sheet"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
};

export const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 pb-space-md border-b border-outline-variant/30", className)}
    {...props}
  />
);

export const SheetTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h2
    className={cn("text-lg font-bold text-on-surface tracking-tight", className)}
    {...props}
  />
);

export const SheetDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p
    className={cn("text-xs text-on-surface-variant leading-relaxed", className)}
    {...props}
  />
);

export const SheetFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("mt-auto pt-space-md flex items-center justify-end gap-2 border-t border-outline-variant/30", className)}
    {...props}
  />
);
