/**
 * ConfirmModal - Unified confirmation dialog
 *
 * Simple confirm/cancel dialog for destructive actions.
 */
import React, { memo } from 'react';
import { AlertTriangle, Trash2, Info, CheckCircle } from 'lucide-react';
import UnifiedModal from '../UnifiedModal';
import ActionButton from '../ActionButton';

const VARIANT_CONFIG = {
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-red-400',
    confirmVariant: 'danger',
    confirmLabel: 'Delete',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    confirmVariant: 'warning',
    confirmLabel: 'Continue',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-400',
    confirmVariant: 'primary',
    confirmLabel: 'OK',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-400',
    confirmVariant: 'success',
    confirmLabel: 'Confirm',
  },
};

const ConfirmModal = memo(function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  loading = false,
  showCancel = true,
  icon: IconOverride,
}) {
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger;
  const Icon = IconOverride || config.icon;

  const handleConfirm = () => {
    onConfirm?.();
  };

  if (!isOpen) return null;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={Icon}
      iconColor={config.iconColor}
      size="xs"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
      <UnifiedModal.Body>
        {message && (
          <p style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1.5,
            margin: 0,
            textAlign: 'center',
          }}>
            {message}
          </p>
        )}
      </UnifiedModal.Body>

      <UnifiedModal.Actions>
        {showCancel && (
          <ActionButton
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            fullWidth
          >
            {cancelLabel}
          </ActionButton>
        )}
        <ActionButton
          variant={config.confirmVariant}
          onClick={handleConfirm}
          loading={loading}
          fullWidth
        >
          {confirmLabel || config.confirmLabel}
        </ActionButton>
      </UnifiedModal.Actions>
    </UnifiedModal>
  );
});

export default ConfirmModal;
