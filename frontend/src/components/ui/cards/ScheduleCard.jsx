/**
 * ScheduleCard - Unified schedule display card
 *
 * Built on UnifiedCard for consistent styling.
 * Displays cron-based automation schedules.
 */
import React, { memo } from 'react';
import { Calendar, Clock, Power, PowerOff, Play, Moon } from 'lucide-react';
import UnifiedCard from '../UnifiedCard';
import ActionButton from '../ActionButton';
import { CrudActions } from '../ActionButtonGroup';
import StatusBadge from '../StatusBadge';

// Action type configurations
const ACTION_CONFIG = {
  scene: { icon: Play, color: '#22c55e', label: 'Scene' },
  chase: { icon: Play, color: '#8b5cf6', label: 'Chase' },
  blackout: { icon: Moon, color: '#64748b', label: 'Blackout' },
};

// Parse cron to human-readable
function parseCron(cron) {
  if (!cron) return 'Not set';

  const parts = cron.split(' ');
  if (parts.length < 5) return cron;

  const [minute, hour, day, month, dayOfWeek] = parts;

  // Simple patterns
  if (minute === '*' && hour === '*') return 'Every minute';
  if (minute.startsWith('*/')) return `Every ${minute.slice(2)} minutes`;
  if (hour === '*') return `At :${minute.padStart(2, '0')} every hour`;

  // Daily at specific time
  if (day === '*' && month === '*' && dayOfWeek === '*') {
    return `Daily at ${hour}:${minute.padStart(2, '0')}`;
  }

  // Weekdays
  if (dayOfWeek === '1-5') return `Weekdays at ${hour}:${minute.padStart(2, '0')}`;
  if (dayOfWeek === '0,6') return `Weekends at ${hour}:${minute.padStart(2, '0')}`;

  return `${hour}:${minute.padStart(2, '0')}`;
}

const ScheduleCard = memo(function ScheduleCard({
  schedule,
  onToggle,
  onEdit,
  onDelete,
  disabled = false,
  className = '',
}) {
  if (!schedule) return null;

  const actionType = schedule.action_type || schedule.actionType || 'scene';
  const config = ACTION_CONFIG[actionType] || ACTION_CONFIG.scene;
  const isEnabled = schedule.enabled !== false;
  const cronDisplay = parseCron(schedule.cron);

  return (
    <UnifiedCard
      colorAccent={isEnabled ? config.color : '#64748b'}
      showColorBar
      colorBarPosition="left"
      disabled={disabled}
      className={className}
      style={{ opacity: isEnabled ? 1 : 0.7 }}
    >
      <UnifiedCard.Header>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <UnifiedCard.Icon icon={Calendar} color={isEnabled ? config.color : '#64748b'} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <UnifiedCard.Title>{schedule.name}</UnifiedCard.Title>
              <StatusBadge
                status={isEnabled ? 'enabled' : 'disabled'}
                size="xs"
                variant="pill"
              />
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.5)',
            }}>
              {cronDisplay}
            </div>
          </div>
        </div>
      </UnifiedCard.Header>

      <UnifiedCard.Body>
        <UnifiedCard.Meta>
          <UnifiedCard.MetaItem icon={config.icon}>
            {config.label}
          </UnifiedCard.MetaItem>
          {schedule.last_run && (
            <UnifiedCard.MetaItem icon={Clock}>
              Last: {new Date(schedule.last_run).toLocaleDateString()}
            </UnifiedCard.MetaItem>
          )}
        </UnifiedCard.Meta>
      </UnifiedCard.Body>

      <UnifiedCard.Actions>
        <ActionButton
          variant={isEnabled ? 'warning' : 'success'}
          icon={isEnabled ? PowerOff : Power}
          onClick={() => onToggle?.(schedule)}
          fullWidth
          disabled={disabled}
        >
          {isEnabled ? 'Disable' : 'Enable'}
        </ActionButton>

        <CrudActions
          onEdit={() => onEdit?.(schedule)}
          onDelete={() => onDelete?.(schedule)}
          showDuplicate={false}
          disabled={disabled}
        />
      </UnifiedCard.Actions>
    </UnifiedCard>
  );
});

export default ScheduleCard;
