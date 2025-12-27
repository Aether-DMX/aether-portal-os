/**
 * ShowCard - Unified show display card
 *
 * Built on UnifiedCard for consistent styling.
 * Displays timeline-based show with playback controls.
 */
import React, { memo } from 'react';
import { Play, Square, Film, Clock, Layers } from 'lucide-react';
import UnifiedCard from '../UnifiedCard';
import ActionButton from '../ActionButton';
import { CrudActions } from '../ActionButtonGroup';
import StatusBadge from '../StatusBadge';

const ShowCard = memo(function ShowCard({
  show,
  isRunning = false,
  onPlay,
  onStop,
  onEdit,
  onDuplicate,
  onDelete,
  disabled = false,
  className = '',
}) {
  if (!show) return null;

  const eventCount = show.timeline?.length || 0;
  const durationMs = show.duration_ms || show.durationMs || 0;

  // Format duration
  const formatDuration = (ms) => {
    if (!ms) return '';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  return (
    <UnifiedCard
      colorAccent="#ec4899"
      showColorBar
      colorBarPosition="top"
      isPlaying={isRunning}
      disabled={disabled}
      className={className}
    >
      <UnifiedCard.Header>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <UnifiedCard.Icon icon={Film} color="#ec4899" size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <UnifiedCard.Title>{show.name}</UnifiedCard.Title>
              {isRunning && <StatusBadge status="playing" size="xs" variant="pill" />}
            </div>
            {show.description && (
              <UnifiedCard.Description lines={1}>
                {show.description}
              </UnifiedCard.Description>
            )}
          </div>
        </div>
      </UnifiedCard.Header>

      <UnifiedCard.Body>
        <UnifiedCard.Meta>
          <UnifiedCard.MetaItem icon={Layers}>
            {eventCount} events
          </UnifiedCard.MetaItem>
          {durationMs > 0 && (
            <UnifiedCard.MetaItem icon={Clock}>
              {formatDuration(durationMs)}
            </UnifiedCard.MetaItem>
          )}
          {show.distributed && (
            <StatusBadge status="synced" label="Multi-U" size="xs" showDot={false} />
          )}
        </UnifiedCard.Meta>
      </UnifiedCard.Body>

      <UnifiedCard.Actions>
        {isRunning ? (
          <ActionButton
            variant="danger"
            icon={Square}
            onClick={() => onStop?.(show)}
            fullWidth
            disabled={disabled}
          >
            Stop
          </ActionButton>
        ) : (
          <ActionButton
            variant="success"
            icon={Play}
            onClick={() => onPlay?.(show)}
            fullWidth
            disabled={disabled}
          >
            Run
          </ActionButton>
        )}

        <CrudActions
          onEdit={() => onEdit?.(show)}
          onDuplicate={() => onDuplicate?.(show)}
          onDelete={() => onDelete?.(show)}
          disabled={disabled}
        />
      </UnifiedCard.Actions>
    </UnifiedCard>
  );
});

export default ShowCard;
