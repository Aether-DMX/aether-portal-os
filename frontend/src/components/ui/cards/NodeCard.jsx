/**
 * NodeCard - Unified node display card
 *
 * Built on UnifiedCard for consistent styling.
 * Displays hardware node with status and controls.
 */
import React, { memo } from 'react';
import { Wifi, Radio, RefreshCw, Settings, Activity, Clock, Signal } from 'lucide-react';
import UnifiedCard from '../UnifiedCard';
import ActionButton from '../ActionButton';
import StatusBadge from '../StatusBadge';

// Node type configurations
const NODE_CONFIG = {
  wifi: { icon: Wifi, color: '#3b82f6', label: 'WiFi' },
  hardwired: { icon: Radio, color: '#22c55e', label: 'Wired' },
  uart: { icon: Radio, color: '#22c55e', label: 'UART' },
  builtin: { icon: Activity, color: '#8b5cf6', label: 'Built-in' },
};

// Format uptime
function formatUptime(seconds) {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

const NodeCard = memo(function NodeCard({
  node,
  onRestart,
  onConfigure,
  onRefresh,
  disabled = false,
  className = '',
}) {
  if (!node) return null;

  const nodeType = node.type || 'wifi';
  const config = NODE_CONFIG[nodeType] || NODE_CONFIG.wifi;
  const isOnline = node.status === 'online';
  const isPaired = node.is_paired || node.isPaired;
  const isBuiltin = node.is_builtin || node.isBuiltin;

  // Channel range
  const channelStart = node.channel_start || node.channelStart || 1;
  const channelEnd = node.channel_end || node.channelEnd || 512;
  const channelRange = channelEnd === 512 && channelStart === 1
    ? 'All'
    : `${channelStart}-${channelEnd}`;

  return (
    <UnifiedCard
      colorAccent={isOnline ? config.color : '#64748b'}
      showColorBar
      colorBarPosition="left"
      disabled={disabled}
      className={className}
    >
      <UnifiedCard.Header>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <UnifiedCard.Icon icon={config.icon} color={isOnline ? config.color : '#64748b'} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <UnifiedCard.Title>{node.name || node.hostname || 'Unknown Node'}</UnifiedCard.Title>
              <StatusBadge
                status={isOnline ? 'online' : 'offline'}
                size="xs"
                variant="dot-only"
              />
            </div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.4)',
              fontFamily: 'monospace',
            }}>
              {node.ip || node.hostname}
            </div>
          </div>
        </div>
      </UnifiedCard.Header>

      <UnifiedCard.Body>
        <UnifiedCard.Meta>
          <UnifiedCard.MetaItem icon={Radio}>
            U{node.universe || 1}
          </UnifiedCard.MetaItem>
          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
            Ch {channelRange}
          </span>
          {node.rssi && (
            <UnifiedCard.MetaItem icon={Signal}>
              {node.rssi} dBm
            </UnifiedCard.MetaItem>
          )}
          {node.uptime && (
            <UnifiedCard.MetaItem icon={Clock}>
              {formatUptime(node.uptime)}
            </UnifiedCard.MetaItem>
          )}
        </UnifiedCard.Meta>

        {/* Additional info row */}
        <div style={{
          marginTop: '8px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            background: `${config.color}20`,
            color: config.color,
          }}>
            {config.label}
          </span>
          {isPaired && (
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
            }}>
              Paired
            </span>
          )}
          {isBuiltin && (
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#8b5cf6',
            }}>
              Built-in
            </span>
          )}
          {node.fps && (
            <span style={{
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}>
              {node.fps} FPS
            </span>
          )}
        </div>
      </UnifiedCard.Body>

      <UnifiedCard.Actions>
        {onRefresh && (
          <ActionButton
            variant="ghost"
            size="icon-sm"
            icon={RefreshCw}
            onClick={() => onRefresh?.(node)}
            disabled={disabled}
            aria-label="Refresh"
          />
        )}
        {onRestart && !isBuiltin && (
          <ActionButton
            variant="warning"
            icon={RefreshCw}
            onClick={() => onRestart?.(node)}
            fullWidth
            disabled={disabled || !isOnline}
          >
            Restart
          </ActionButton>
        )}
        {onConfigure && (
          <ActionButton
            variant="ghost"
            size="icon-sm"
            icon={Settings}
            onClick={() => onConfigure?.(node)}
            disabled={disabled}
            aria-label="Configure"
          />
        )}
      </UnifiedCard.Actions>
    </UnifiedCard>
  );
});

export default NodeCard;
