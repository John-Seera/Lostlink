import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />
  };

  const borderColors = {
    success: 'border-emerald-500/30 bg-emerald-950/80',
    error: 'border-rose-500/30 bg-rose-950/80',
    info: 'border-blue-500/30 bg-blue-950/80'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-bounce-in">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl ${
          borderColors[toast.type || 'info']
        }`}
      >
        {icons[toast.type || 'info']}
        <div className="flex-1 pr-2">
          {toast.title && <h5 className="text-sm font-semibold text-white">{toast.title}</h5>}
          <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{toast.message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
