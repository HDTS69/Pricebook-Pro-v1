import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Define types
export interface SimpleToastProps {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
  className?: string;
}

// Create context for toast state
const SimpleToastContext = React.createContext<{
  toasts: SimpleToastProps[];
  addToast: (props: SimpleToastProps) => string;
  removeToast: (id: string) => void;
}>({
  toasts: [],
  addToast: () => "",
  removeToast: () => {},
});

// Provider component
export function SimpleToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<SimpleToastProps[]>([]);

  const addToast = React.useCallback((props: SimpleToastProps) => {
    const id = props.id || Math.random().toString(36).substring(2, 9);
    const toast = { ...props, id };
    
    setToasts((prev) => [...prev, toast]);
    
    if (toast.duration !== Infinity) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration || 5000);
    }
    
    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <SimpleToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <SimpleToaster />
    </SimpleToastContext.Provider>
  );
}

// Hook for using toasts
export function useSimpleToast() {
  const context = React.useContext(SimpleToastContext);
  
  if (!context) {
    throw new Error("useSimpleToast must be used within a SimpleToastProvider");
  }
  
  return {
    toast: (props: SimpleToastProps) => context.addToast(props),
    dismiss: (id: string) => context.removeToast(id),
    toasts: context.toasts,
  };
}

// Toast component
export function SimpleToast({
  className,
  variant = "default",
  id,
  title,
  description,
  action,
  ...props
}: SimpleToastProps & React.HTMLAttributes<HTMLDivElement>) {
  const { dismiss } = useSimpleToast();

  const baseClasses = "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 shadow-lg";
  const variantClasses = {
    default: "border bg-background text-foreground",
    destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant || "default"], className)}
      {...props}
    >
      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      <div className="flex items-center gap-2">
        {action}
        <button
          onClick={() => id && dismiss(id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-transparent p-0 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}

// Toaster component (viewport)
export function SimpleToaster() {
  const { toasts } = useSimpleToast();

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((props) => (
        <SimpleToast key={props.id} {...props} />
      ))}
    </div>
  );
} 