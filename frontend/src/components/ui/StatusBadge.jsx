/**
 * StatusBadge - Unified status indicator component
 *
 * Shows status with consistent styling across the app.
 * Supports various statuses: online, offline, running, paused, etc.
 */
import React, { memo } from 'react';

const STATUS_CONFIGS = {
  online: {
    color: '#22c55e',
    label: 'Online',
    pulse: false,
  },
  offline: {
    color: '#ef4444',
    label: 'Offline',
    pulse: false,
  },
  running: {
    color: '#22c55e',
    label: 'Running',
    pulse: true,
  },
  playing: {
    color: '#22c55e',
    label: 'Playing',
    pulse: true,
  },
  paused: {
    color: '#f59e0b',
    label: 'Paused',
    pulse: false,
  },
  stopped: {
    color: '#64748b',
    label: 'Stopped',
    pulse: false,
  },
  error: {
    color: '#ef4444',
    label: 'Error',
    pulse: false,
  },
  warning: {
    color: '#f59e0b',
    label: 'Warning',
    pulse: false,
  },
  synced: {
    color: '#22c55e',
    label: 'Synced',
    pulse: false,
  },
  pending: {
    color: '#64748b',
    label: 'Pending',
    pulse: true,
  },
  scheduled: {
    color: '#8b5cf6',
    label: 'Scheduled',
    pulse: false,
  },
  enabled: {
    color: '#22c55e',
    label: 'Enabled',
    pulse: false,
  },
  disabled: {
    color: '#64748b',
    label: 'Disabled',
    pulse: false,
  },
  loop: {
    color: 'var(--theme-primary, #00ffaa)',
    label: 'Loop',
    pulse: false,
  },
};

const StatusBadge = memo(function StatusBadge({
  status,
  label,
  showDot = true,
  showLabel = true,
  size = 'sm', // 'xs' | 'sm' | 'md'
  variant = 'default', // 'default' | 'pill' | 'dot-only'
  className = '',
  style = {},
}) {
  const config = STATUS_CONFIGS[status] || {
    color: '#64748b',
    label: status || 'Unknown',
    pulse: false,
  };

  const displayLabel = label || config.label;

  const sizes = {
    xs: { dot: 5, font: '9px', padding: '2px 6px', gap: '4px' },
    sm: { dot: 6, font: '10px', padding: '3px 8px', gap: '5px' },
    md: { dot: 8, font: '11px', padding: '4px 10px', gap: '6px' },
  };
  const s = sizes[size] || sizes.sm;

  if (variant === 'dot-only') {
    return (
      <span
        className={`status-badge status-badge--dot ${className}`}
        style={{
          display: 'inline-block',
          width: s.dot,
          height: s.dot,
          borderRadius: '50%',
          backgroundColor: config.color,
          boxShadow: `0 0 6px ${config.color}`,
          animation: config.pulse ? 'status-pulse 2s ease-in-out infinite' : 'none',
          ...style,
        }}
        title={displayLabel}
      />
    );
  }

  return (
    <span
      className={`status-badge status-badge--${status} status-badge--${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.font,
        fontWeight: 600,
        borderRadius: variant === 'pill' ? '9999px' : '6px',
        background: `${config.color}20`,
        color: config.color,
        ...style,
      }}
    >
      {showDot && (
        <span
          style={{
            width: s.dot,
            height: s.dot,
            borderRadius: '50%',
            backgroundColor: config.color,
            boxShadow: `0 0 4px ${config.color}`,
            animation: config.pulse ? 'status-pulse 2s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }}
        />
      )}
      {showLabel && displayLabel}
    </span>
  );
});

/**
 * Simple online/offline indicator for universe buttons
 */
export const OnlineIndicator = memo(function OnlineIndicator({
  isOnline,
  size = 6,
  className = '',
  style = {},
}) {
  return (
    <span
      className={`online-indicator ${className}`}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: isOnline ? '#22c55e' : '#ef4444',
        flexShrink: 0,
        ...style,
      }}
    />
  );
});

export default StatusBadge;
