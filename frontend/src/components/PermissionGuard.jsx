import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import useAuthStore from '../store/authStore';
import PinModal from './PinModal';

export default function PermissionGuard({ 
  action, 
  requiredRole = 'user',
  children, 
  fallback = null,
  showLockIcon = true 
}) {
  const { hasPermission, securityEnabled } = useAuthStore();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // If security disabled, render children
  if (!securityEnabled) {
    return <>{children}</>;
  }

  // Check permission
  const allowed = hasPermission(action);

  if (allowed) {
    return <>{children}</>;
  }

  // Not allowed - show fallback or lock icon
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        {showLockIcon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg backdrop-blur-sm">
            <button
              onClick={() => setShowPinModal(true)}
              className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all hover:scale-105"
              style={{
                background: 'var(--theme-primary)',
                color: '#fff',
              }}
            >
              <Lock size={16} />
              Unlock
            </button>
          </div>
        )}
      </div>

      {showPinModal && (
        <PinModal
          onClose={() => setShowPinModal(false)}
          onSuccess={() => {
            setShowPinModal(false);
            // Refresh permissions
            window.location.reload();
          }}
          requiredRole={requiredRole}
        />
      )}
    </>
  );
}
