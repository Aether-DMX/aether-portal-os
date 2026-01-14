import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Intent Context Store
 *
 * Central intelligence layer that tracks:
 * - What the user is currently doing (current context)
 * - What just happened (recent activity)
 * - What is currently risky (safety context)
 * - Smart suggestions based on context
 *
 * This store enables:
 * - Context-aware UI behavior
 * - Smart command suggestions
 * - Risk suppression during playback
 * - AI assistant context awareness
 */

// Action types for tracking
export const ActionTypes = {
  // Navigation
  NAVIGATE: 'navigate',
  VIEW_CHANGED: 'view_changed',

  // Selection
  SELECT_ITEM: 'select_item',
  DESELECT_ITEM: 'deselect_item',
  MULTI_SELECT: 'multi_select',

  // Playback
  PLAY_SCENE: 'play_scene',
  PLAY_CHASE: 'play_chase',
  STOP_PLAYBACK: 'stop_playback',
  PAUSE_PLAYBACK: 'pause_playback',
  RESUME_PLAYBACK: 'resume_playback',
  BLACKOUT: 'blackout',
  MASTER_CHANGE: 'master_change',

  // Editing
  START_EDIT: 'start_edit',
  SAVE_EDIT: 'save_edit',
  CANCEL_EDIT: 'cancel_edit',
  DELETE_ITEM: 'delete_item',
  CREATE_ITEM: 'create_item',

  // System
  NODE_STATUS_CHANGE: 'node_status_change',
  ERROR_OCCURRED: 'error_occurred',
  WARNING_CLEARED: 'warning_cleared',

  // User input
  COMMAND_EXECUTED: 'command_executed',
  SEARCH_PERFORMED: 'search_performed',
};

// View context types
export const ViewContext = {
  DASHBOARD: 'dashboard',
  SCENES: 'scenes',
  CHASES: 'chases',
  LOOKS: 'looks',
  FIXTURES: 'fixtures',
  NODES: 'nodes',
  PATCH: 'patch',
  SETTINGS: 'settings',
  SCHEDULE: 'schedule',
  STAGE: 'stage',
  CUE_STACK: 'cue_stack',
  LIVE: 'live',
  AI_CHAT: 'ai_chat',
};

// Risk levels for actions
export const RiskLevel = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Maximum items in activity history
const MAX_ACTIVITY_HISTORY = 50;

const useIntentContextStore = create(
  subscribeWithSelector((set, get) => ({
    // Current context state
    currentView: ViewContext.DASHBOARD,
    selectedItem: null,
    selectedItemType: null,
    selectedItems: [], // For multi-select
    isEditing: false,
    editingItem: null,

    // Playback state
    isPlaying: false,
    currentlyPlaying: null, // { type: 'scene'|'chase', id, name }
    masterLevel: 100,
    isBlackout: false,

    // Activity history (recent actions)
    activityHistory: [],

    // Risk/safety context
    activeWarnings: [],
    nodesOffline: 0,
    hasActivePlayback: false,
    lastDangerousAction: null,

    // Smart suggestions
    suggestedCommands: [],
    suggestedActions: [],

    // Timestamps
    lastInteraction: Date.now(),
    sessionStart: Date.now(),

    // ========== View Context Methods ==========

    setCurrentView: (view) => {
      const prev = get().currentView;
      set({
        currentView: view,
        lastInteraction: Date.now(),
      });
      get().recordActivity(ActionTypes.VIEW_CHANGED, { from: prev, to: view });
      get().updateSuggestions();
    },

    // ========== Selection Methods ==========

    selectItem: (item, itemType) => {
      set({
        selectedItem: item,
        selectedItemType: itemType,
        lastInteraction: Date.now(),
      });
      get().recordActivity(ActionTypes.SELECT_ITEM, { item, type: itemType });
      get().updateSuggestions();
    },

    clearSelection: () => {
      const prev = get().selectedItem;
      set({
        selectedItem: null,
        selectedItemType: null,
        selectedItems: [],
        lastInteraction: Date.now(),
      });
      if (prev) {
        get().recordActivity(ActionTypes.DESELECT_ITEM, { item: prev });
      }
      get().updateSuggestions();
    },

    toggleMultiSelect: (item, itemType) => {
      const { selectedItems } = get();
      const existing = selectedItems.find(i => i.id === item.id);

      if (existing) {
        set({
          selectedItems: selectedItems.filter(i => i.id !== item.id),
          lastInteraction: Date.now(),
        });
      } else {
        set({
          selectedItems: [...selectedItems, { ...item, type: itemType }],
          lastInteraction: Date.now(),
        });
      }
      get().recordActivity(ActionTypes.MULTI_SELECT, { items: get().selectedItems });
    },

    // ========== Playback Context Methods ==========

    setPlaybackState: (isPlaying, item = null) => {
      set({
        isPlaying,
        currentlyPlaying: item,
        hasActivePlayback: isPlaying,
        lastInteraction: Date.now(),
      });

      if (isPlaying && item) {
        get().recordActivity(
          item.type === 'chase' ? ActionTypes.PLAY_CHASE : ActionTypes.PLAY_SCENE,
          item
        );
      } else if (!isPlaying) {
        get().recordActivity(ActionTypes.STOP_PLAYBACK, { previous: get().currentlyPlaying });
      }
      get().updateSuggestions();
    },

    setMasterLevel: (level) => {
      const prev = get().masterLevel;
      set({
        masterLevel: level,
        lastInteraction: Date.now(),
      });
      if (Math.abs(level - prev) > 10) { // Only record significant changes
        get().recordActivity(ActionTypes.MASTER_CHANGE, { from: prev, to: level });
      }
    },

    setBlackout: (isBlackout) => {
      set({
        isBlackout,
        lastInteraction: Date.now(),
      });
      get().recordActivity(ActionTypes.BLACKOUT, { active: isBlackout });
      get().updateSuggestions();
    },

    // ========== Editing Context Methods ==========

    startEditing: (item, itemType) => {
      set({
        isEditing: true,
        editingItem: { ...item, type: itemType },
        lastInteraction: Date.now(),
      });
      get().recordActivity(ActionTypes.START_EDIT, { item, type: itemType });
    },

    finishEditing: (saved = true) => {
      const { editingItem } = get();
      set({
        isEditing: false,
        editingItem: null,
        lastInteraction: Date.now(),
      });
      get().recordActivity(
        saved ? ActionTypes.SAVE_EDIT : ActionTypes.CANCEL_EDIT,
        { item: editingItem }
      );
      get().updateSuggestions();
    },

    // ========== Warning/Risk Methods ==========

    addWarning: (warning) => {
      const { activeWarnings } = get();
      const exists = activeWarnings.find(w => w.id === warning.id);
      if (!exists) {
        set({
          activeWarnings: [...activeWarnings, { ...warning, timestamp: Date.now() }],
        });
      }
    },

    clearWarning: (warningId) => {
      set({
        activeWarnings: get().activeWarnings.filter(w => w.id !== warningId),
      });
      get().recordActivity(ActionTypes.WARNING_CLEARED, { id: warningId });
    },

    setNodesOffline: (count) => {
      const prev = get().nodesOffline;
      set({ nodesOffline: count });
      if (count !== prev) {
        get().recordActivity(ActionTypes.NODE_STATUS_CHANGE, {
          offline: count,
          direction: count > prev ? 'increased' : 'decreased'
        });
      }
    },

    // ========== Activity Recording ==========

    recordActivity: (actionType, data = {}) => {
      const { activityHistory } = get();
      const activity = {
        type: actionType,
        data,
        timestamp: Date.now(),
        view: get().currentView,
      };

      const newHistory = [activity, ...activityHistory].slice(0, MAX_ACTIVITY_HISTORY);
      set({ activityHistory: newHistory });
    },

    recordCommand: (command, result) => {
      get().recordActivity(ActionTypes.COMMAND_EXECUTED, { command, result });
      set({ lastInteraction: Date.now() });
      get().updateSuggestions();
    },

    // ========== Smart Suggestions ==========

    updateSuggestions: () => {
      const state = get();
      const suggestions = [];
      const actionSuggestions = [];

      // Context-based command suggestions
      if (state.currentView === ViewContext.SCENES) {
        if (state.selectedItem) {
          suggestions.push({ command: 'play scene', label: `Play ${state.selectedItem.name}` });
          suggestions.push({ command: 'edit', label: 'Edit selected scene' });
        } else {
          suggestions.push({ command: 'new scene', label: 'Create new scene' });
        }
      }

      if (state.currentView === ViewContext.CHASES) {
        if (state.selectedItem) {
          suggestions.push({ command: 'play chase', label: `Start ${state.selectedItem.name}` });
          suggestions.push({ command: 'stop', label: 'Stop chase' });
        } else {
          suggestions.push({ command: 'new chase', label: 'Create new chase' });
        }
      }

      // Playback-based suggestions
      if (state.isPlaying) {
        suggestions.push({ command: 'stop', label: 'Stop playback', priority: 'high' });
        suggestions.push({ command: 'blackout', label: 'Emergency blackout' });
        suggestions.push({ command: 'master', label: 'Adjust master' });
      }

      if (state.isBlackout) {
        suggestions.push({ command: 'restore', label: 'Restore from blackout', priority: 'high' });
      }

      // Warning-based suggestions
      if (state.nodesOffline > 0) {
        actionSuggestions.push({
          action: 'check_nodes',
          label: `${state.nodesOffline} node(s) offline`,
          severity: 'warning'
        });
      }

      if (state.activeWarnings.length > 0) {
        actionSuggestions.push({
          action: 'view_warnings',
          label: `${state.activeWarnings.length} active warning(s)`,
          severity: 'warning'
        });
      }

      set({
        suggestedCommands: suggestions,
        suggestedActions: actionSuggestions,
      });
    },

    // ========== Risk Assessment ==========

    assessActionRisk: (actionType) => {
      const state = get();

      // High risk during playback
      if (state.isPlaying || state.hasActivePlayback) {
        if ([ActionTypes.DELETE_ITEM, ActionTypes.START_EDIT].includes(actionType)) {
          return RiskLevel.HIGH;
        }
      }

      // Medium risk with active warnings
      if (state.activeWarnings.length > 0) {
        if (actionType === ActionTypes.PLAY_SCENE || actionType === ActionTypes.PLAY_CHASE) {
          return RiskLevel.MEDIUM;
        }
      }

      // High risk with nodes offline
      if (state.nodesOffline > 0 && actionType === ActionTypes.PLAY_SCENE) {
        return RiskLevel.MEDIUM;
      }

      // Delete is always at least medium risk
      if (actionType === ActionTypes.DELETE_ITEM) {
        return RiskLevel.MEDIUM;
      }

      return RiskLevel.NONE;
    },

    shouldSuppressAction: (actionType) => {
      const risk = get().assessActionRisk(actionType);
      // Auto-suppress high-risk actions during playback
      return risk === RiskLevel.HIGH && get().isPlaying;
    },

    // ========== Context for AI Assistant ==========

    getContextForAI: () => {
      const state = get();
      return {
        currentView: state.currentView,
        selectedItem: state.selectedItem,
        selectedItemType: state.selectedItemType,
        isEditing: state.isEditing,
        isPlaying: state.isPlaying,
        currentlyPlaying: state.currentlyPlaying,
        masterLevel: state.masterLevel,
        isBlackout: state.isBlackout,
        nodesOffline: state.nodesOffline,
        activeWarnings: state.activeWarnings.length,
        recentActivity: state.activityHistory.slice(0, 5).map(a => ({
          type: a.type,
          timestamp: a.timestamp,
        })),
      };
    },

    // ========== Recent Activity Queries ==========

    getRecentScenes: () => {
      return get().activityHistory
        .filter(a => a.type === ActionTypes.PLAY_SCENE)
        .slice(0, 5)
        .map(a => a.data);
    },

    getRecentCommands: () => {
      return get().activityHistory
        .filter(a => a.type === ActionTypes.COMMAND_EXECUTED)
        .slice(0, 10)
        .map(a => a.data.command);
    },

    wasRecentlyPlayed: (itemId) => {
      const recentPlayback = get().activityHistory
        .filter(a => [ActionTypes.PLAY_SCENE, ActionTypes.PLAY_CHASE].includes(a.type))
        .slice(0, 10);
      return recentPlayback.some(a => a.data?.id === itemId);
    },

    // ========== Reset ==========

    resetContext: () => {
      set({
        currentView: ViewContext.DASHBOARD,
        selectedItem: null,
        selectedItemType: null,
        selectedItems: [],
        isEditing: false,
        editingItem: null,
        isPlaying: false,
        currentlyPlaying: null,
        masterLevel: 100,
        isBlackout: false,
        activityHistory: [],
        activeWarnings: [],
        suggestedCommands: [],
        suggestedActions: [],
        lastInteraction: Date.now(),
      });
    },
  }))
);

// Custom hook for subscribing to specific context changes
export const useContextSubscription = (selector, callback) => {
  return useIntentContextStore.subscribe(selector, callback);
};

// Hook for getting context-aware suggestions
export const useContextSuggestions = () => {
  return useIntentContextStore(state => ({
    commands: state.suggestedCommands,
    actions: state.suggestedActions,
  }));
};

// Hook for checking if action is risky
export const useActionRiskCheck = () => {
  const assessRisk = useIntentContextStore(state => state.assessActionRisk);
  const shouldSuppress = useIntentContextStore(state => state.shouldSuppressAction);
  return { assessRisk, shouldSuppress };
};

export default useIntentContextStore;
