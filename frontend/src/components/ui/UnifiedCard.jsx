/**
 * UnifiedCard - Base card component for all element types
 *
 * Provides consistent styling, animations, and touch interactions.
 * All specific card types (SceneCard, ChaseCard, etc.) should use this as their base.
 *
 * @example
 * <UnifiedCard
 *   colorAccent="#22c55e"
 *   isActive={isPlaying}
 *   onClick={() => handleClick()}
 * >
 *   <UnifiedCard.Header>...</UnifiedCard.Header>
 *   <UnifiedCard.Body>...</UnifiedCard.Body>
 *   <UnifiedCard.Actions>...</UnifiedCard.Actions>
 * </UnifiedCard>
 */
import React, { memo, useCallback, useState } from 'react';

// Design constants
const CARD_STYLES = {
  base: {
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 'var(--radius-lg, 16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    position: 'relative',
  },
  hover: {
    background: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    transform: 'scale(1.02)',
  },
  active: {
    transform: 'scale(0.98)',
  },
  playing: {
    boxShadow: '0 0 0 2px var(--theme-primary), 0 0 20px rgba(var(--theme-primary-rgb), 0.3)',
  },
};

const UnifiedCard = memo(function UnifiedCard({
  children,
  className = '',
  style = {},
  colorAccent,
  isActive = false,
  isPlaying = false,
  onClick,
  onLongPress,
  disabled = false,
  variant = 'default', // 'default' | 'compact' | 'minimal'
  showColorBar = false,
  colorBarPosition = 'top', // 'top' | 'left'
  testId,
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Long press handling
  const longPressTimer = React.useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (disabled) return;
    setIsPressed(true);
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress(e);
        setIsPressed(false);
      }, 500);
    }
  }, [disabled, onLongPress]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback((e) => {
    if (disabled || !onClick) return;
    onClick(e);
  }, [disabled, onClick]);

  // Compute styles
  const computedStyle = {
    ...CARD_STYLES.base,
    ...(isHovered && !disabled ? CARD_STYLES.hover : {}),
    ...(isPressed && !disabled ? CARD_STYLES.active : {}),
    ...(isPlaying ? CARD_STYLES.playing : {}),
    ...(isActive ? {
      borderColor: colorAccent || 'var(--theme-primary)',
      boxShadow: `0 0 0 1px ${colorAccent || 'var(--theme-primary)'}`,
    } : {}),
    ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
    ...(onClick ? { cursor: 'pointer' } : {}),
    ...style,
  };

  // Variant-specific padding
  const variantPadding = {
    default: '0',
    compact: '0',
    minimal: '0',
  };

  return (
    <div
      className={`unified-card unified-card--${variant} ${isPlaying ? 'unified-card--playing' : ''} ${className}`}
      style={computedStyle}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      data-testid={testId}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Color bar */}
      {showColorBar && colorAccent && (
        <div
          className="unified-card__color-bar"
          style={{
            position: 'absolute',
            ...(colorBarPosition === 'top' ? {
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
            } : {
              top: 0,
              left: 0,
              bottom: 0,
              width: '3px',
            }),
            background: colorAccent,
            transition: 'background 0.2s ease',
          }}
        />
      )}

      {/* Hover overlay */}
      {isHovered && !disabled && (
        <div
          className="unified-card__hover-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            background: `${colorAccent || 'var(--theme-primary)'}10`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Playing pulse animation */}
      {isPlaying && (
        <div
          className="unified-card__playing-indicator"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            animation: 'card-pulse 2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {children}
    </div>
  );
});

// Sub-components for structured content
UnifiedCard.Header = memo(function CardHeader({ children, className = '', style = {} }) {
  return (
    <div
      className={`unified-card__header ${className}`}
      style={{
        padding: '12px 12px 8px 12px',
        ...style,
      }}
    >
      {children}
    </div>
  );
});

UnifiedCard.Body = memo(function CardBody({ children, className = '', style = {} }) {
  return (
    <div
      className={`unified-card__body ${className}`}
      style={{
        padding: '0 12px 8px 12px',
        ...style,
      }}
    >
      {children}
    </div>
  );
});

UnifiedCard.Actions = memo(function CardActions({
  children,
  className = '',
  style = {},
  layout = 'row', // 'row' | 'grid'
}) {
  return (
    <div
      className={`unified-card__actions ${className}`}
      style={{
        padding: '8px 12px 12px 12px',
        display: 'flex',
        gap: '8px',
        ...(layout === 'grid' ? {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(36px, 1fr))',
        } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
});

UnifiedCard.Title = memo(function CardTitle({ children, className = '', style = {} }) {
  return (
    <h3
      className={`unified-card__title ${className}`}
      style={{
        fontSize: '16px',
        fontWeight: 700,
        color: 'white',
        margin: 0,
        marginBottom: '4px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </h3>
  );
});

UnifiedCard.Description = memo(function CardDescription({ children, className = '', style = {}, lines = 2 }) {
  return (
    <p
      className={`unified-card__description ${className}`}
      style={{
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.5)',
        margin: 0,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical',
        lineHeight: '1.4',
        ...style,
      }}
    >
      {children}
    </p>
  );
});

UnifiedCard.Meta = memo(function CardMeta({ children, className = '', style = {} }) {
  return (
    <div
      className={`unified-card__meta ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.4)',
        ...style,
      }}
    >
      {children}
    </div>
  );
});

UnifiedCard.MetaItem = memo(function CardMetaItem({ icon: Icon, children, className = '', style = {} }) {
  return (
    <span
      className={`unified-card__meta-item ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        ...style,
      }}
    >
      {Icon && <Icon size={12} style={{ opacity: 0.7 }} />}
      {children}
    </span>
  );
});

UnifiedCard.Icon = memo(function CardIcon({
  children,
  emoji,
  icon: Icon,
  color,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  style = {},
}) {
  const sizes = {
    sm: { container: 28, icon: 14, emoji: 16 },
    md: { container: 36, icon: 18, emoji: 22 },
    lg: { container: 48, icon: 24, emoji: 28 },
  };
  const s = sizes[size];

  return (
    <div
      className={`unified-card__icon ${className}`}
      style={{
        width: s.container,
        height: s.container,
        minWidth: s.container,
        borderRadius: 'var(--radius-md, 12px)',
        background: color ? `${color}20` : 'rgba(255, 255, 255, 0.1)',
        border: color ? `1px solid ${color}40` : '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      {emoji && <span style={{ fontSize: s.emoji }}>{emoji}</span>}
      {Icon && <Icon size={s.icon} style={{ color: color || 'rgba(255, 255, 255, 0.6)' }} />}
      {children}
    </div>
  );
});

export default UnifiedCard;
