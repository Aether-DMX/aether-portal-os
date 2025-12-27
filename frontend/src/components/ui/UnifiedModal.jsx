/**
 * UnifiedModal - Base modal component for all dialogs
 *
 * Provides consistent styling, animations, and accessibility.
 * All modals (PlaySceneModal, ApplyTargetModal, etc.) should use this as their base.
 *
 * Features:
 * - Portal rendering to document.body
 * - Backdrop click/touch to close
 * - Keyboard escape to close
 * - Consistent sizing and animation
 * - Touch-optimized for 800x480 screens
 *
 * @example
 * <UnifiedModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Play Scene"
 *   icon={Play}
 *   iconColor="text-green-400"
 *   size="sm"
 * >
 *   <UnifiedModal.Body>...</UnifiedModal.Body>
 *   <UnifiedModal.Actions>...</UnifiedModal.Actions>
 * </UnifiedModal>
 */
import React, { memo, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

// Size presets
const MODAL_SIZES = {
  xs: { maxWidth: '280px' },
  sm: { maxWidth: '360px' },
  md: { maxWidth: '480px' },
  lg: { maxWidth: '640px' },
  xl: { maxWidth: '800px' },
  full: { maxWidth: '95vw', maxHeight: '95vh' },
};

const UnifiedModal = memo(function UnifiedModal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-white',
  size = 'sm',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  style = {},
  animateIn = true,
  testId,
}) {
  const modalRef = useRef(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Handle backdrop click/touch
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      e.preventDefault();
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  const handleBackdropTouch = useCallback((e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      e.preventDefault();
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  // Prevent event bubbling from modal content
  const stopPropagation = useCallback((e) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  const sizeStyle = MODAL_SIZES[size] || MODAL_SIZES.sm;

  const modalContent = (
    <div
      className="unified-modal__backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '12px',
        animation: animateIn ? 'modal-backdrop-fade 0.2s ease-out' : 'none',
      }}
      onClick={handleBackdropClick}
      onTouchEnd={handleBackdropTouch}
      data-testid={testId}
    >
      <div
        ref={modalRef}
        className={`unified-modal ${className}`}
        style={{
          background: '#0d0d12',
          borderRadius: 'var(--radius-xl, 20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          width: '100%',
          ...sizeStyle,
          maxHeight: size === 'full' ? '95vh' : '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          animation: animateIn ? 'modal-scale-in 0.2s ease-out' : 'none',
          ...style,
        }}
        onClick={stopPropagation}
        onTouchEnd={stopPropagation}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className="unified-modal__header"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              {Icon && (
                <Icon
                  size={18}
                  className={iconColor}
                  style={{ flexShrink: 0 }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                {title && (
                  <h2
                    id="modal-title"
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'white',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  minWidth: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s',
                  flexShrink: 0,
                }}
                className="unified-modal__close"
                aria-label="Close"
              >
                <X size={16} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className="unified-modal__content"
          style={{
            flex: 1,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
});

// Sub-components for structured content
UnifiedModal.Body = memo(function ModalBody({ children, className = '', style = {} }) {
  return (
    <div
      className={`unified-modal__body ${className}`}
      style={{
        padding: '12px 16px',
        ...style,
      }}
    >
      {children}
    </div>
  );
});

UnifiedModal.Section = memo(function ModalSection({
  children,
  title,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`unified-modal__section ${className}`}
      style={{
        marginBottom: '12px',
        ...style,
      }}
    >
      {title && (
        <label
          style={{
            display: 'block',
            fontSize: '10px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px',
          }}
        >
          {title}
        </label>
      )}
      {children}
    </div>
  );
});

UnifiedModal.Actions = memo(function ModalActions({
  children,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`unified-modal__actions ${className}`}
      style={{
        padding: '12px 16px',
        display: 'flex',
        gap: '10px',
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
});

UnifiedModal.Summary = memo(function ModalSummary({
  children,
  error,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`unified-modal__summary ${className}`}
      style={{
        textAlign: 'center',
        fontSize: '11px',
        padding: '8px 16px',
        color: error ? '#ef4444' : 'rgba(255, 255, 255, 0.4)',
        ...style,
      }}
    >
      {children}
    </div>
  );
});

export default UnifiedModal;
