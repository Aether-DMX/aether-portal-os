/**
 * SceneCard - Unified scene display card
 *
 * Built on UnifiedCard for consistent styling.
 * Displays scene with recall, edit, duplicate, delete actions.
 */
import React, { memo, useCallback } from 'react';
import { Play, Layers, Clock } from 'lucide-react';
import UnifiedCard from '../UnifiedCard';
import ActionButton from '../ActionButton';
import { CrudActions } from '../ActionButtonGroup';
import StatusBadge from '../StatusBadge';

// Color mappings for scene colors
const COLOR_MAP = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  green: '#22c55e',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  pink: '#ec4899',
};

const SceneCard = memo(function SceneCard({
  scene,
  isPlaying = false,
  onRecall,
  onEdit,
  onDuplicate,
  onDelete,
  disabled = false,
  className = '',
}) {
  if (!scene) return null;

  const channelCount = scene.channels ? Object.keys(scene.channels).length : 0;
  const colorHex = COLOR_MAP[scene.color] || COLOR_MAP.blue;

  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  return (
    <UnifiedCard
      colorAccent={colorHex}
      showColorBar
      colorBarPosition="top"
      isPlaying={isPlaying}
      disabled={disabled}
      className={className}
    >
      <UnifiedCard.Header>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <UnifiedCard.Title>{scene.name}</UnifiedCard.Title>
              {isPlaying && <StatusBadge status="playing" size="xs" variant="pill" />}
            </div>
            {scene.description && (
              <UnifiedCard.Description lines={2}>
                {scene.description}
              </UnifiedCard.Description>
            )}
          </div>
        </div>
      </UnifiedCard.Header>

      <UnifiedCard.Body>
        <UnifiedCard.Meta>
          <UnifiedCard.MetaItem icon={Layers}>
            {channelCount} channels
          </UnifiedCard.MetaItem>
          {scene.fadeTime > 0 && (
            <UnifiedCard.MetaItem icon={Clock}>
              {scene.fadeTime}ms
            </UnifiedCard.MetaItem>
          )}
        </UnifiedCard.Meta>

        {scene.updatedAt && (
          <div style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.3)',
            marginTop: '8px',
          }}>
            Modified {formatDate(scene.updatedAt)}
          </div>
        )}
      </UnifiedCard.Body>

      <UnifiedCard.Actions>
        <ActionButton
          variant="success"
          icon={Play}
          onClick={() => onRecall?.(scene)}
          fullWidth
          disabled={disabled}
        >
          Recall
        </ActionButton>

        <CrudActions
          onEdit={() => onEdit?.(scene)}
          onDuplicate={() => onDuplicate?.(scene)}
          onDelete={() => onDelete?.(scene)}
          disabled={disabled}
        />
      </UnifiedCard.Actions>
    </UnifiedCard>
  );
});

export default SceneCard;
