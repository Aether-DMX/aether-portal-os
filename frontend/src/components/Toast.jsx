import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import useToastStore from '../store/toastStore';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: {
    bg: 'rgba(34, 197, 94, 0.15)',
    border: 'rgba(34, 197, 94, 0.4)',
    icon: '#22c55e',
    text: '#86efac'
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
    icon: '#ef4444',
    text: '#fca5a5'
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    icon: '#f59e0b',
    text: '#fcd34d'
  },
  info: {
    bg: 'rgba(var(--theme-primary-rgb), 0.15)',
    border: 'rgba(var(--theme-primary-rgb), 0.4)',
    icon: 'var(--theme-primary)',
    text: 'rgba(255, 255, 255, 0.9)'
  }
};

function ToastItem({ toast }) {
  const { removeToast } = useToastStore();
  const Icon = iconMap[toast.type] || Info;
  const colors = colorMap[toast.type] || colorMap.info;

  return (
    <div
      className="animate-fadeInUp flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl shadow-lg"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <Icon size={20} style={{ color: colors.icon, flexShrink: 0 }} />
      <span className="flex-1 text-sm font-medium" style={{ color: colors.text }}>
        {toast.message}
      </span>
      <button
        onClick={() => removeToast(toast.id)}
        className="p-1 rounded-lg hover:bg-white/10 transition-colors"
        style={{ color: 'rgba(255, 255, 255, 0.5)' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-auto">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
