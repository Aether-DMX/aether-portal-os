/**
 * GroupCard - Unified fixture group display card
 *
 * Built on UnifiedCard for consistent styling.
 * Displays group with control, edit, delete actions.
 */
import React, { memo } from 'react';
import { Play, Users } from 'lucide-react';
import UnifiedCard from '../UnifiedCard';
import ActionButton from '../ActionButton';
import { CrudActions } from '../ActionButtonGroup';

// Fixture type icons (emoji) and colors
const FIXTURE_CONFIG = {
  dimmer: { emoji: '💡', color: '#f59e0b' },
  rgb: { emoji: '🌈', color: '#ec4899' },
  rgbw: { emoji: '✨', color: '#8b5cf6' },
  rgba: { emoji: '✨', color: '#8b5cf6' },
  rgbwa: { emoji: '✨', color: '#8b5cf6' },
  moving: { emoji: '🎯', color: '#3b82f6' },
  moving_head: { emoji: '🎯', color: '#3b82f6' },
  strobe: { emoji: '⚡', color: '#f97316' },
  par: { emoji: '🔦', color: '#22c55e' },
  wash: { emoji: '🌊', color: '#06b6d4' },
  generic: { emoji: '💡', color: '#64748b' },
};

const GroupCard = memo(function GroupCard({
  group,
  onControl,
  onEdit,
  onDelete,
  disabled = false,
  className = '',
}) {
  if (!group) return null;

  const fixtureType = group.fixtureType || 'generic';
  const config = FIXTURE_CONFIG[fixtureType] || FIXTURE_CONFIG.generic;
  const channelCount = group.channels?.length || 0;

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
            <UnifiedCard.Title>{group.name}</UnifiedCard.Title>
            {group.description && (
              <UnifiedCard.Description lines={1}>
                {group.description}
              </UnifiedCard.Description>
            )}
          </div>
        </div>
      </UnifiedCard.Header>

      <UnifiedCard.Body>
        <UnifiedCard.Meta>
          <UnifiedCard.MetaItem icon={Users}>
            {channelCount} channels
          </UnifiedCard.MetaItem>
          <span style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'capitalize',
          }}>
            {fixtureType.replace('_', ' ')}
          </span>
        </UnifiedCard.Meta>
      </UnifiedCard.Body>

      <UnifiedCard.Actions>
        <ActionButton
          variant="accent"
          icon={Play}
          onClick={() => onControl?.(group)}
          fullWidth
          disabled={disabled}
        >
          Control
        </ActionButton>

        <CrudActions
          onEdit={() => onEdit?.(group)}
          onDelete={() => onDelete?.(group)}
          showDuplicate={false}
          disabled={disabled}
        />
      </UnifiedCard.Actions>
    </UnifiedCard>
  );
});

export default GroupCard;
