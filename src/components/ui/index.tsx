import React, { createContext, useContext, useState, useEffect } from 'react';
import { LucideIcon, X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

// --- CARD COMPONENT ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}
export const Card: React.FC<CardProps> = ({ children, className, interactive = false, ...props }) => {
  return (
    <div
      className={cn(
        "bg-white border border-slate-950 p-6 transition-all duration-150 rounded-xl",
        interactive 
          ? "hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer" 
          : "",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// --- BUTTON COMPONENT ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: LucideIcon;
}
export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon: Icon,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-lg border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  
  const variants = {
    primary: "bg-slate-950 hover:bg-slate-800 text-white border-slate-950",
    secondary: "bg-white hover:bg-slate-100 text-slate-950 border-slate-950",
    outline: "bg-transparent border-slate-950 text-slate-950 hover:bg-slate-100",
    danger: "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-950",
    ghost: "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4.5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon ? (
        <Icon className={cn("w-4 h-4", size === 'sm' ? 'w-3.5 h-3.5' : '')} />
      ) : null}
      {children}
    </button>
  );
};

// --- INPUT COMPONENT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, icon: Icon, ...props }, ref) => {
    return (
      <div className="w-full text-left">
        {label && (
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              "w-full rounded-lg border border-slate-950 bg-white px-3.5 py-2.5 text-sm transition-all focus:ring-1 focus:ring-slate-950 focus:border-slate-950 outline-none text-slate-900 placeholder-slate-400",
              Icon ? "pl-10" : "",
              error ? "border-rose-600 focus:ring-rose-500/20" : "",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-rose-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// --- SELECT COMPONENT ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full text-left">
        {label && (
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full rounded-lg border border-slate-950 bg-white px-3.5 py-2.5 text-sm transition-all focus:ring-1 focus:ring-slate-950 focus:border-slate-950 outline-none text-slate-900",
            error ? "border-rose-600 focus:ring-rose-500/20" : "",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-xs text-rose-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

// --- BADGE COMPONENT ---
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}
export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral' }) => {
  const styles = {
    success: "bg-emerald-50 text-emerald-950 border border-emerald-950",
    warning: "bg-amber-50 text-amber-950 border border-amber-950",
    error: "bg-rose-50 text-rose-950 border border-rose-950",
    info: "bg-sky-50 text-sky-950 border border-sky-950",
    neutral: "bg-slate-50 text-slate-950 border border-slate-950",
  };
  
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase", styles[variant])}>
      {children}
    </span>
  );
};

// --- TABLE COMPONENT ---
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers: string[];
  isLoading?: boolean;
}
export const Table: React.FC<TableProps> = ({ headers, children, isLoading = false, className, ...props }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-950 bg-white">
      <table className={cn("w-full text-left border-collapse", className)} {...props}>
        <thead>
          <tr className="border-b border-slate-950 bg-slate-50 text-xs font-bold text-slate-800 uppercase tracking-wider">
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {isLoading ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center">
                <div className="flex justify-center items-center gap-2">
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-bold text-slate-600">Loading details...</span>
                </div>
              </td>
            </tr>
          ) : children ? (
            children
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                No active records.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- MODAL / DIALOG COMPONENT ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/40 cursor-pointer"
        onClick={onClose}
      />
      {/* Container */}
      <div className="relative bg-white border border-slate-950 rounded-xl w-full max-w-lg p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-10 max-h-[90vh] overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-100">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
          <h3 className="text-base font-bold text-slate-950">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 border border-slate-200 hover:border-slate-950 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

// --- TABS COMPONENT ---
interface TabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}
export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn("flex space-x-1 bg-slate-50 border border-slate-950 p-1 rounded-lg", className)}>
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer w-full text-center",
              isActive 
                ? "bg-slate-950 text-white" 
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
};

// --- TOAST PROVIDER ---
export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

const ToastContext = createContext<{
  toasts: ToastMessage[];
  addToast: (title: string, description?: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
} | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, description?: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="p-4 rounded-xl border border-slate-950 bg-white flex gap-3.5 items-start justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-5 duration-150"
          >
            <div className="flex gap-2.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-650 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-650 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />}
              
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-950">{toast.title}</h4>
                {toast.description && (
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">{toast.description}</p>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-950 shrink-0 p-0.5 hover:bg-slate-100 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  
  return {
    toast: (title: string, description?: string) => context.addToast(title, description, 'info'),
    success: (title: string, description?: string) => context.addToast(title, description, 'success'),
    error: (title: string, description?: string) => context.addToast(title, description, 'error'),
  };
};
