/**
 * ActionButton - Unified button component for cards and modals
 *
 * Provides consistent styling for all interactive buttons.
 * Supports various variants, sizes, and states.
 */
import React, { memo, forwardRef } from 'react';

const BUTTON_VARIANTS = {
  primary: {
    background: 'var(--theme-primary, #00ffaa)',
    color: 'black',
    border: 'none',
    hoverBg: 'var(--theme-primary, #00ffaa)',
    hoverOpacity: 0.9,
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    hoverBg: 'rgba(255, 255, 255, 0.15)',
  },
  ghost: {
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.6)',
    border: 'none',
    hoverBg: 'rgba(255, 255, 255, 0.1)',
  },
  success: {
    background: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    hoverBg: 'rgba(34, 197, 94, 0.3)',
  },
  danger: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    hoverBg: 'rgba(239, 68, 68, 0.25)',
  },
  warning: {
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    hoverBg: 'rgba(245, 158, 11, 0.25)',
  },
  accent: {
    background: 'rgba(var(--theme-primary-rgb, 0, 255, 170), 0.15)',
    color: 'var(--theme-primary, #00ffaa)',
    border: '1px solid rgba(var(--theme-primary-rgb, 0, 255, 170), 0.3)',
    hoverBg: 'rgba(var(--theme-primary-rgb, 0, 255, 170), 0.25)',
  },
};

const BUTTON_SIZES = {
  xs: {
    padding: '4px 8px',
    fontSize: '10px',
    minHeight: '28px',
    borderRadius: '6px',
    iconSize: 12,
  },
  sm: {
    padding: '6px 12px',
    fontSize: '12px',
    minHeight: '36px',
    borderRadius: '8px',
    iconSize: 14,
  },
  md: {
    padding: '10px 16px',
    fontSize: '13px',
    minHeight: '44px',
    borderRadius: '10px',
    iconSize: 16,
  },
  lg: {
    padding: '12px 20px',
    fontSize: '14px',
    minHeight: '52px',
    borderRadius: '12px',
    iconSize: 18,
  },
  icon: {
    padding: '0',
    fontSize: '14px',
    minHeight: '44px',
    width: '44px',
    borderRadius: '10px',
    iconSize: 18,
  },
  'icon-sm': {
    padding: '0',
    fontSize: '12px',
    minHeight: '36px',
    width: '36px',
    borderRadius: '8px',
    iconSize: 16,
  },
};

const ActionButton = memo(forwardRef(function ActionButton(
  {
    children,
    variant = 'secondary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    fullWidth = false,
    loading = false,
    disabled = false,
    active = false,
    className = '',
    style = {},
    onClick,
    type = 'button',
    ...props
  },
  ref
) {
  const variantStyles = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.secondary;
  const sizeStyles = BUTTON_SIZES[size] || BUTTON_SIZES.md;

  const isIconOnly = size === 'icon' || size === 'icon-sm';

  const computedStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isIconOnly ? 0 : '6px',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
    flexShrink: 0,
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    // Variant styles
    background: variantStyles.background,
    color: variantStyles.color,
    border: variantStyles.border || 'none',
    // Size styles
    padding: sizeStyles.padding,
    fontSize: sizeStyles.fontSize,
    minHeight: sizeStyles.minHeight,
    borderRadius: sizeStyles.borderRadius,
    ...(sizeStyles.width ? { width: sizeStyles.width, minWidth: sizeStyles.width } : {}),
    // Full width
    ...(fullWidth ? { width: '100%', flex: 1 } : {}),
    // Disabled/loading state
    ...(disabled || loading ? { opacity: 0.5 } : {}),
    // Active state
    ...(active ? {
      background: variantStyles.hoverBg || variantStyles.background,
      borderColor: 'var(--theme-primary, #00ffaa)',
    } : {}),
    // Custom styles
    ...style,
  };

  return (
    <button
      ref={ref}
      type={type}
      className={`action-button action-button--${variant} action-button--${size} ${className}`}
      style={computedStyle}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: sizeStyles.iconSize,
            height: sizeStyles.iconSize,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon size={sizeStyles.iconSize} style={{ flexShrink: 0 }} />
          )}
          {!isIconOnly && children}
          {Icon && iconPosition === 'right' && (
            <Icon size={sizeStyles.iconSize} style={{ flexShrink: 0 }} />
          )}
        </>
      )}
    </button>
  );
}));

export default ActionButton;
