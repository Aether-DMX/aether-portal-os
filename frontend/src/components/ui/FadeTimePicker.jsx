/**
 * FadeTimePicker - Fade time selection component
 *
 * Consistent fade time selection across the app.
 */
import React, { memo } from 'react';

const DEFAULT_OPTIONS = [
  { value: 0, label: 'Snap' },
  { value: 500, label: '0.5s' },
  { value: 1000, label: '1s' },
  { value: 2000, label: '2s' },
];

const FadeTimePicker = memo(function FadeTimePicker({
  value = 1000,
  onChange,
  options = DEFAULT_OPTIONS,
  disabled = false,
  size = 'sm', // 'xs' | 'sm' | 'md'
  className = '',
  style = {},
}) {
  const sizes = {
    xs: { padding: '4px 8px', fontSize: '9px', gap: '4px' },
    sm: { padding: '8px 10px', fontSize: '10px', gap: '6px' },
    md: { padding: '10px 14px', fontSize: '11px', gap: '8px' },
  };
  const s = sizes[size] || sizes.sm;

  return (
    <div
      className={`fade-time-picker ${className}`}
      style={{
        display: 'flex',
        gap: s.gap,
        ...style,
      }}
    >
      {options.map(opt => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange?.(opt.value)}
            disabled={disabled}
            style={{
              flex: 1,
              padding: s.padding,
              borderRadius: '8px',
              border: 'none',
              background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.4)',
              fontWeight: 700,
              fontSize: s.fontSize,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
});

export default FadeTimePicker;
