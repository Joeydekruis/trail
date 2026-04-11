import {
  useState,
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastType = "success" | "error" | "warning";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle size={16} className="text-green-400" />,
    error: <AlertCircle size={16} className="text-red-400" />,
    warning: <AlertCircle size={16} className="text-amber-400" />,
  };

  const borderColors: Record<ToastType, string> = {
    success: "border-green-500/30",
    error: "border-red-500/30",
    warning: "border-amber-500/30",
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-2 rounded-lg border bg-[#111827] px-4 py-3 text-sm text-[#e2e8f0] shadow-lg shadow-black/50",
              borderColors[t.type],
            )}
          >
            {icons[t.type]}
            <span>{t.message}</span>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="ml-2 text-[#8b9cb6] hover:text-[#e2e8f0]"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
