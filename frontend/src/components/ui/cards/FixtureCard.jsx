/**
 * FixtureCard - Unified fixture display card
 *
 * Built on UnifiedCard for consistent styling.
 * Displays fixture with channel info and actions.
 */
import React, { memo } from 'react';
import { Edit, Trash2, Radio, Hash, Sliders } from 'lucide-react';
import UnifiedCard from '../UnifiedCard';
import ActionButton from '../ActionButton';
import { CrudActions } from '../ActionButtonGroup';

// Fixture type icons and colors
const FIXTURE_CONFIG = {
  rgb: { emoji: '🌈', color: '#ec4899', label: 'RGB' },
  rgbw: { emoji: '✨', color: '#8b5cf6', label: 'RGBW' },
  rgba: { emoji: '✨', color: '#8b5cf6', label: 'RGBA' },
  rgbwa: { emoji: '✨', color: '#a855f7', label: 'RGBWA' },
  dimmer: { emoji: '💡', color: '#f59e0b', label: 'Dimmer' },
  moving_head: { emoji: '🎯', color: '#3b82f6', label: 'Moving Head' },
  par: { emoji: '🔦', color: '#22c55e', label: 'PAR' },
  wash: { emoji: '🌊', color: '#06b6d4', label: 'Wash' },
  strobe: { emoji: '⚡', color: '#f97316', label: 'Strobe' },
  generic: { emoji: '💡', color: '#64748b', label: 'Generic' },
};

const FixtureCard = memo(function FixtureCard({
  fixture,
  onEdit,
  onDelete,
  onControl,
  disabled = false,
  className = '',
}) {
  if (!fixture) return null;

  const fixtureType = fixture.type || 'generic';
  const config = FIXTURE_CONFIG[fixtureType] || FIXTURE_CONFIG.generic;
  const channelCount = fixture.channel_count || fixture.channelCount || 1;
  const startChannel = fixture.start_channel || fixture.startChannel || 1;
  const endChannel = startChannel + channelCount - 1;
  const universe = fixture.universe || 1;

  return (
    <UnifiedCard
      colorAccent={config.color}
      showColorBar
      colorBarPosition="left"
      disabled={disabled}
      className={className}
    >
      <UnifiedCard.Header>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <UnifiedCard.Icon emoji={config.emoji} color={config.color} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <UnifiedCard.Title>{fixture.name}</UnifiedCard.Title>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: '2px',
            }}>
              {fixture.manufacturer && `${fixture.manufacturer} `}
              {fixture.model && fixture.model}
            </div>
          </div>
        </div>
      </UnifiedCard.Header>

      <UnifiedCard.Body>
        <UnifiedCard.Meta>
          <UnifiedCard.MetaItem icon={Radio}>
            U{universe}
          </UnifiedCard.MetaItem>
          <UnifiedCard.MetaItem icon={Hash}>
            {channelCount === 1 ? `Ch ${startChannel}` : `Ch ${startChannel}-${endChannel}`}
          </UnifiedCard.MetaItem>
          <span style={{
            fontSize: '11px',
            color: config.color,
            fontWeight: 600,
          }}>
            {config.label}
          </span>
        </UnifiedCard.Meta>

        {/* Channel map preview */}
        {fixture.channel_map && fixture.channel_map.length > 0 && (
          <div style={{
            marginTop: '8px',
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.3)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {fixture.channel_map.slice(0, 5).join(' · ')}
            {fixture.channel_map.length > 5 && ' ...'}
          </div>
        )}
      </UnifiedCard.Body>

      <UnifiedCard.Actions>
        {onControl && (
          <ActionButton
            variant="accent"
            icon={Sliders}
            onClick={() => onControl?.(fixture)}
            fullWidth
            disabled={disabled}
          >
            Control
          </ActionButton>
        )}

        <CrudActions
          onEdit={() => onEdit?.(fixture)}
          onDelete={() => onDelete?.(fixture)}
          showDuplicate={false}
          disabled={disabled}
        />
      </UnifiedCard.Actions>
    </UnifiedCard>
  );
});

export default FixtureCard;
