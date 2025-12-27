/**
 * MetaInfo - Metadata display component for cards
 *
 * Shows icon + value pairs consistently across cards.
 */
import React, { memo } from 'react';
import {
  Layers, Clock, Zap, Music, Calendar, Users, Radio,
  Wifi, Activity, Timer, Hash, Gauge
} from 'lucide-react';

// Common meta type configurations
const META_TYPES = {
  channels: { icon: Layers, format: (v) => `${v} ch` },
  steps: { icon: Zap, format: (v) => `${v} steps` },
  bpm: { icon: Music, format: (v) => `${v} BPM` },
  fade: { icon: Clock, format: (v) => `${v}ms` },
  duration: { icon: Timer, format: (v) => v },
  universe: { icon: Radio, format: (v) => `U${v}` },
  fixtures: { icon: Users, format: (v) => `${v} fixtures` },
  updated: { icon: Calendar, format: (v) => formatDate(v) },
  created: { icon: Calendar, format: (v) => formatDate(v) },
  status: { icon: Activity, format: (v) => v },
  signal: { icon: Wifi, format: (v) => `${v} dBm` },
  fps: { icon: Gauge, format: (v) => `${v} FPS` },
  count: { icon: Hash, format: (v) => v },
};

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Single meta item with icon and value
 */
export const MetaItem = memo(function MetaItem({
  type,
  icon: IconOverride,
  value,
  label,
  format,
  className = '',
  style = {},
}) {
  const config = META_TYPES[type] || {};
  const Icon = IconOverride || config.icon;
  const formatFn = format || config.format || ((v) => v);

  if (value === undefined || value === null) return null;

  return (
    <span
      className={`meta-item meta-item--${type} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.4)',
        ...style,
      }}
    >
      {Icon && <Icon size={12} style={{ opacity: 0.7 }} />}
      <span>{label || formatFn(value)}</span>
    </span>
  );
});

/**
 * Row of meta items with separators
 */
const MetaInfo = memo(function MetaInfo({
  items = [], // Array of { type, value, label, icon } or simple { icon, value }
  separator = '•',
  className = '',
  style = {},
}) {
  const validItems = items.filter(item =>
    item && (item.value !== undefined && item.value !== null)
  );

  if (validItems.length === 0) return null;

  return (
    <div
      className={`meta-info ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {validItems.map((item, index) => (
        <React.Fragment key={item.type || item.label || index}>
          <MetaItem {...item} />
          {separator && index < validItems.length - 1 && (
            <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '10px' }}>
              {separator}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
});

export default MetaInfo;
