import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  children,
}) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger: React.FC<{
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, onClick, className }) => {
  const { onOpenChange } = React.useContext(DialogContext);
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

export const DialogContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const { open, onOpenChange } = React.useContext(DialogContext);

  // Close on Escape key
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Planar Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in-0"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Modal Card with Level 3 Planar Borders */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 w-full max-w-lg rounded bg-surface-container p-space-lg shadow-2xl border border-outline-variant/60 animate-in fade-in-0 zoom-in-95",
          className
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3.5 top-3.5 p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("flex flex-col space-y-1.5 pb-space-sm", className)}>
    {children}
  </div>
);

export const DialogTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <h2
    className={cn(
      "font-headline-md text-headline-md text-on-surface leading-none tracking-tight",
      className
    )}
  >
    {children}
  </h2>
);

export const DialogDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <p className={cn("text-body-sm text-on-surface-variant", className)}>
    {children}
  </p>
);

export const DialogFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-space-sm pt-space-md border-t border-outline-variant/30",
      className
    )}
  >
    {children}
  </div>
);
