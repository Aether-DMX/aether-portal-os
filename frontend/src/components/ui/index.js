/**
 * AETHER UI COMPONENT LIBRARY
 *
 * Unified, harmonized components for consistent look and feel across all views.
 * All cards, modals, and interactive elements should use these base components.
 *
 * Design Tokens:
 * - Uses CSS variables from index.css (--accent, --glass, --radius-*, etc.)
 * - Touch-optimized (44px minimum touch targets)
 * - Glass morphism with backdrop blur
 * - Consistent animations and transitions
 *
 * Usage:
 * import { SceneCard, ActionButton } from '@/components/ui';
 *
 * NOTE: For apply/play modals, use ApplyTargetModal directly from @/components/ApplyTargetModal.
 * It is the single source of truth for target selection across Scenes, Chases, Shows, and AI actions.
 */

// Base components
export { default as UnifiedCard } from './UnifiedCard';
export { default as UnifiedModal } from './UnifiedModal';
export { default as ActionButton } from './ActionButton';
export { default as ActionButtonGroup, CrudActions, PlaybackActions } from './ActionButtonGroup';
export { default as StatusBadge, OnlineIndicator } from './StatusBadge';
export { default as ColorBar } from './ColorBar';
export { default as MetaInfo, MetaItem } from './MetaInfo';
export { default as TargetPicker } from './TargetPicker';
export { default as FadeTimePicker } from './FadeTimePicker';

// Card variants built on UnifiedCard
export { default as SceneCard } from './cards/SceneCard';
export { default as ChaseCard } from './cards/ChaseCard';
export { default as GroupCard } from './cards/GroupCard';
export { default as FixtureCard } from './cards/FixtureCard';
export { default as ShowCard } from './cards/ShowCard';
export { default as ScheduleCard } from './cards/ScheduleCard';
export { default as NodeCard } from './cards/NodeCard';

// Modal variants built on UnifiedModal
export { ConfirmModal } from './modals';
