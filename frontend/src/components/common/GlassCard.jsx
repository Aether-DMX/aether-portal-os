import React from 'react';

export const GlassCard = ({ children, className = '', style = {}, onClick, hover = true }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-2xl border-2 transition-all ${hover ? 'hover:scale-105 active:scale-95' : ''} ${className}`}
      style={{
        borderColor: 'rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export const IconContainer = ({ children, color, active = false }) => {
  return (
    <div
      className="flex items-center justify-center rounded-xl transition-all"
      style={{
        background: active 
          ? `linear-gradient(135deg, ${color}, ${color}CC)`
          : `${color}20`,
        border: `2px solid ${color}`,
        boxShadow: active 
          ? `0 0 20px ${color}80, 0 0 40px ${color}40, 0 8px 16px rgba(0, 0, 0, 0.3)`
          : 'none'
      }}
    >
      {children}
    </div>
  );
};

export const StatusBadge = ({ online, label }) => {
  const color = online ? '#22c55e' : '#ef4444';
  return (
    <div
      className="flex items-center justify-center border-2"
      style={{
        background: `${color}20`,
        borderColor: color,
      }}
    >
      {label}
    </div>
  );
};
