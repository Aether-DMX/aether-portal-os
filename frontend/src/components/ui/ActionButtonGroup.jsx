/**
 * ActionButtonGroup - Common action button patterns for cards
 *
 * Provides pre-built button groups for common card actions:
 * - CRUD operations (Edit, Duplicate, Delete)
 * - Playback controls (Play, Stop, Pause)
 */
import React, { memo } from 'react';
import { Play, Square, Pause, Edit, Copy, Trash2 } from 'lucide-react';
import ActionButton from './ActionButton';

/**
 * Standard CRUD action buttons for cards
 */
export const CrudActions = memo(function CrudActions({
  onEdit,
  onDuplicate,
  onDelete,
  showEdit = true,
  showDuplicate = true,
  showDelete = true,
  size = 'icon-sm',
  disabled = false,
}) {
  return (
    <>
      {showEdit && onEdit && (
        <ActionButton
          variant="ghost"
          size={size}
          icon={Edit}
          onClick={onEdit}
          disabled={disabled}
          aria-label="Edit"
        />
      )}
      {showDuplicate && onDuplicate && (
        <ActionButton
          variant="ghost"
          size={size}
          icon={Copy}
          onClick={onDuplicate}
          disabled={disabled}
          aria-label="Duplicate"
        />
      )}
      {showDelete && onDelete && (
        <ActionButton
          variant="danger"
          size={size}
          icon={Trash2}
          onClick={onDelete}
          disabled={disabled}
          aria-label="Delete"
        />
      )}
    </>
  );
});

/**
 * Playback control buttons
 */
export const PlaybackActions = memo(function PlaybackActions({
  isPlaying,
  onPlay,
  onStop,
  onPause,
  showPause = false,
  playLabel = 'Play',
  stopLabel = 'Stop',
  fullWidth = false,
  size = 'md',
  disabled = false,
}) {
  if (isPlaying) {
    return (
      <>
        {showPause && onPause && (
          <ActionButton
            variant="warning"
            size={size}
            icon={Pause}
            onClick={onPause}
            fullWidth={fullWidth}
            disabled={disabled}
          >
            Pause
          </ActionButton>
        )}
        <ActionButton
          variant="danger"
          size={size}
          icon={Square}
          onClick={onStop}
          fullWidth={fullWidth}
          disabled={disabled}
        >
          {stopLabel}
        </ActionButton>
      </>
    );
  }

  return (
    <ActionButton
      variant="success"
      size={size}
      icon={Play}
      onClick={onPlay}
      fullWidth={fullWidth}
      disabled={disabled}
    >
      {playLabel}
    </ActionButton>
  );
});

/**
 * Complete card action row with primary action + CRUD
 */
const ActionButtonGroup = memo(function ActionButtonGroup({
  // Primary action (Play/Recall/Control)
  primaryLabel,
  primaryIcon,
  primaryVariant = 'success',
  onPrimary,
  primaryLoading = false,
  // Running state
  isRunning = false,
  onStop,
  stopLabel = 'Stop',
  // CRUD actions
  onEdit,
  onDuplicate,
  onDelete,
  // Options
  disabled = false,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`action-button-group ${className}`}
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        ...style,
      }}
    >
      {/* Primary action */}
      {isRunning ? (
        <ActionButton
          variant="danger"
          icon={Square}
          onClick={onStop}
          fullWidth
          disabled={disabled}
        >
          {stopLabel}
        </ActionButton>
      ) : (
        <ActionButton
          variant={primaryVariant}
          icon={primaryIcon || Play}
          onClick={onPrimary}
          fullWidth
          loading={primaryLoading}
          disabled={disabled}
        >
          {primaryLabel}
        </ActionButton>
      )}

      {/* CRUD actions */}
      <CrudActions
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        disabled={disabled}
      />
    </div>
  );
});

export default ActionButtonGroup;
