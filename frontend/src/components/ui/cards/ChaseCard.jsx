/**
 * ChaseCard - Unified chase display card
 *
 * Built on UnifiedCard for consistent styling.
 * Displays chase with play/stop, edit, duplicate, delete actions.
 */
import React, { memo } from 'react';
import { Play, Square, Zap, Clock } from 'lucide-react';
import UnifiedCard from '../UnifiedCard';
import ActionButton from '../ActionButton';
import { CrudActions } from '../ActionButtonGroup';
import StatusBadge from '../StatusBadge';

const ChaseCard = memo(function ChaseCard({
  chase,
  isRunning = false,
  onStart,
  onStop,
  onEdit,
  onDuplicate,
  onDelete,
  disabled = false,
  className = '',
}) {
  if (!chase) return null;

  const stepCount = chase.steps?.length || 0;
  const speed = chase.speed || chase.bpm || 120;

  return (
    <UnifiedCard
      colorAccent="#8b5cf6"
      showColorBar
      colorBarPosition="top"
      isPlaying={isRunning}
      disabled={disabled}
      className={className}
    >
      <UnifiedCard.Header>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <UnifiedCard.Title>{chase.name}</UnifiedCard.Title>
              {isRunning && <StatusBadge status="running" size="xs" variant="pill" />}
            </div>
            {chase.description && (
              <UnifiedCard.Description lines={2}>
                {chase.description}
              </UnifiedCard.Description>
            )}
          </div>
        </div>
      </UnifiedCard.Header>

      <UnifiedCard.Body>
        <UnifiedCard.Meta>
          <UnifiedCard.MetaItem icon={Zap}>
            {stepCount} steps
          </UnifiedCard.MetaItem>
          <UnifiedCard.MetaItem icon={Clock}>
            {speed}ms
          </UnifiedCard.MetaItem>
          {chase.loop && (
            <StatusBadge status="loop" size="xs" showDot={false} />
          )}
        </UnifiedCard.Meta>
      </UnifiedCard.Body>

      <UnifiedCard.Actions>
        {isRunning ? (
          <ActionButton
            variant="danger"
            icon={Square}
            onClick={() => onStop?.(chase)}
            fullWidth
            disabled={disabled}
          >
            Stop
          </ActionButton>
        ) : (
          <ActionButton
            variant="success"
            icon={Play}
            onClick={() => onStart?.(chase)}
            fullWidth
            disabled={disabled}
          >
            Start
          </ActionButton>
        )}

        <CrudActions
          onEdit={() => onEdit?.(chase)}
          onDuplicate={() => onDuplicate?.(chase)}
          onDelete={() => onDelete?.(chase)}
          disabled={disabled}
        />
      </UnifiedCard.Actions>
    </UnifiedCard>
  );
});

export default ChaseCard;
