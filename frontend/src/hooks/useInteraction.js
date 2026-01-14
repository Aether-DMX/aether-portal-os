/**
 * Touch vs Mouse Interaction Contracts
 *
 * This module ensures proper interaction handling across devices:
 * - Touch targets are at least 44px
 * - Hover-only interactions are replaced on touch devices
 * - Intelligent slider snapping for touch
 * - Right-click alternatives for mobile (long-press)
 * - Visual drag affordances
 *
 * Philosophy: Touch ≠ Mouse
 * - Touch is imprecise, requires larger targets
 * - Touch has no hover state
 * - Touch needs gesture alternatives
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ========== Device Detection ==========

/**
 * Detect if the device has touch capability
 */
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Detect if the device is mobile (small screen + touch)
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return isTouchDevice() && window.innerWidth <= 768;
};

/**
 * Hook to reactively detect device type
 */
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState({
    isTouch: isTouchDevice(),
    isMobile: isMobileDevice(),
    isDesktop: !isMobileDevice(),
  });

  useEffect(() => {
    const checkDevice = () => {
      setDeviceType({
        isTouch: isTouchDevice(),
        isMobile: isMobileDevice(),
        isDesktop: !isMobileDevice(),
      });
    };

    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return deviceType;
};

// ========== Touch Target Validation ==========

const MIN_TOUCH_TARGET = 44; // Apple HIG minimum

/**
 * Hook to validate and warn about small touch targets
 */
export const useTouchTargetValidation = (ref, componentName = 'Unknown') => {
  useEffect(() => {
    if (!ref.current || !isTouchDevice()) return;

    const element = ref.current;
    const rect = element.getBoundingClientRect();

    if (rect.width < MIN_TOUCH_TARGET || rect.height < MIN_TOUCH_TARGET) {
      console.warn(
        `[Touch Target Warning] ${componentName}: Element is ${rect.width}x${rect.height}px. ` +
        `Minimum recommended touch target is ${MIN_TOUCH_TARGET}x${MIN_TOUCH_TARGET}px.`
      );
    }
  }, [ref, componentName]);
};

/**
 * Get minimum size CSS for touch targets
 */
export const getTouchTargetStyles = (isInteractive = true) => {
  if (!isInteractive) return {};

  return isTouchDevice()
    ? {
        minWidth: MIN_TOUCH_TARGET,
        minHeight: MIN_TOUCH_TARGET,
      }
    : {};
};

// ========== Hover Alternative ==========

/**
 * Hook that provides hover behavior on desktop and tap-to-reveal on touch
 * Returns handlers and state for conditional rendering
 */
export const useHoverOrTap = (timeout = 3000) => {
  const [isActive, setIsActive] = useState(false);
  const timeoutRef = useRef(null);
  const isTouch = isTouchDevice();

  const clearActiveTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const activate = useCallback(() => {
    clearActiveTimeout();
    setIsActive(true);

    if (isTouch && timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsActive(false);
      }, timeout);
    }
  }, [isTouch, timeout, clearActiveTimeout]);

  const deactivate = useCallback(() => {
    if (!isTouch) {
      clearActiveTimeout();
      setIsActive(false);
    }
  }, [isTouch, clearActiveTimeout]);

  const toggle = useCallback(() => {
    if (isTouch) {
      if (isActive) {
        clearActiveTimeout();
        setIsActive(false);
      } else {
        activate();
      }
    }
  }, [isTouch, isActive, activate, clearActiveTimeout]);

  useEffect(() => {
    return () => clearActiveTimeout();
  }, [clearActiveTimeout]);

  // Return different handlers based on device type
  const handlers = isTouch
    ? {
        onClick: toggle,
      }
    : {
        onMouseEnter: activate,
        onMouseLeave: deactivate,
      };

  return {
    isActive,
    handlers,
    isTouch,
  };
};

// ========== Long Press (Right-Click Alternative) ==========

/**
 * Hook for long-press detection (mobile alternative to right-click)
 */
export const useLongPress = (onLongPress, options = {}) => {
  const {
    delay = 500,
    onStart = () => {},
    onCancel = () => {},
    hapticFeedback = true,
  } = options;

  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const haptic = useCallback((pattern = 50) => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [hapticFeedback]);

  const start = useCallback(
    (e) => {
      // Store start position for movement detection
      const pos = e.touches?.[0] || e;
      startPosRef.current = { x: pos.clientX, y: pos.clientY };
      isLongPressRef.current = false;

      onStart(e);

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        haptic();
        onLongPress(e);
      }, delay);
    },
    [delay, onLongPress, onStart, haptic]
  );

  const clear = useCallback(
    (e, shouldCancel = false) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (shouldCancel && !isLongPressRef.current) {
        onCancel(e);
      }
    },
    [onCancel]
  );

  const move = useCallback(
    (e) => {
      // Cancel if moved more than threshold
      const pos = e.touches?.[0] || e;
      const dx = Math.abs(pos.clientX - startPosRef.current.x);
      const dy = Math.abs(pos.clientY - startPosRef.current.y);

      if (dx > 10 || dy > 10) {
        clear(e, true);
      }
    },
    [clear]
  );

  const handlers = {
    onTouchStart: start,
    onTouchEnd: (e) => clear(e, false),
    onTouchMove: move,
    onTouchCancel: (e) => clear(e, true),
    // Mouse equivalents for desktop testing
    onMouseDown: start,
    onMouseUp: (e) => clear(e, false),
    onMouseLeave: (e) => clear(e, true),
  };

  return {
    handlers,
    isLongPressing: isLongPressRef.current,
  };
};

// ========== Smart Slider Snapping ==========

/**
 * Hook for intelligent slider snapping on touch devices
 * Snaps to common values (0, 25, 50, 75, 100) with larger snap zones on touch
 */
export const useSmartSlider = (options = {}) => {
  const {
    min = 0,
    max = 100,
    snapPoints = [0, 25, 50, 75, 100],
    snapThreshold = isTouchDevice() ? 8 : 3, // Larger threshold on touch
    onChange = () => {},
  } = options;

  const [value, setValue] = useState(options.initialValue ?? min);
  const [isDragging, setIsDragging] = useState(false);

  const snapToNearest = useCallback(
    (rawValue) => {
      // Clamp to range
      const clamped = Math.max(min, Math.min(max, rawValue));

      // Find nearest snap point
      for (const point of snapPoints) {
        if (Math.abs(clamped - point) <= snapThreshold) {
          return point;
        }
      }

      return clamped;
    },
    [min, max, snapPoints, snapThreshold]
  );

  const handleChange = useCallback(
    (rawValue) => {
      const snapped = snapToNearest(rawValue);
      setValue(snapped);
      onChange(snapped);
    },
    [snapToNearest, onChange]
  );

  const startDrag = useCallback(() => {
    setIsDragging(true);
  }, []);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    // Haptic feedback at end of drag on touch
    if (isTouchDevice() && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  return {
    value,
    setValue: handleChange,
    isDragging,
    startDrag,
    endDrag,
    snapPoints,
  };
};

// ========== Drag Affordance ==========

/**
 * Hook for visual drag affordances
 */
export const useDragAffordance = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  const onDragStart = useCallback((e) => {
    const pos = e.touches?.[0] || e;
    startPosRef.current = { x: pos.clientX, y: pos.clientY };
    setIsDragging(true);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const onDragMove = useCallback((e) => {
    if (!isDragging) return;

    const pos = e.touches?.[0] || e;
    setDragOffset({
      x: pos.clientX - startPosRef.current.x,
      y: pos.clientY - startPosRef.current.y,
    });
  }, [isDragging]);

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const handlers = {
    onTouchStart: onDragStart,
    onTouchMove: onDragMove,
    onTouchEnd: onDragEnd,
    onTouchCancel: onDragEnd,
    onMouseDown: onDragStart,
    onMouseMove: onDragMove,
    onMouseUp: onDragEnd,
    onMouseLeave: onDragEnd,
  };

  const dragStyles = isDragging
    ? {
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
        opacity: 0.8,
        transition: 'none',
      }
    : {};

  return {
    isDragging,
    dragOffset,
    handlers,
    dragStyles,
  };
};

// ========== Combined Interaction Hook ==========

/**
 * Combined hook for common interaction patterns
 * Provides click, long-press, and hover behaviors in one
 */
export const useInteraction = (options = {}) => {
  const {
    onClick = () => {},
    onLongPress = () => {},
    onHoverStart = () => {},
    onHoverEnd = () => {},
    longPressDelay = 500,
    hapticFeedback = true,
  } = options;

  const { isTouch, isMobile } = useDeviceType();
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const longPressTimerRef = useRef(null);
  const wasLongPressRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const haptic = useCallback((pattern = 10) => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [hapticFeedback]);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleStart = useCallback(
    (e) => {
      const pos = e.touches?.[0] || e;
      startPosRef.current = { x: pos.clientX, y: pos.clientY };
      wasLongPressRef.current = false;
      setIsPressed(true);

      longPressTimerRef.current = setTimeout(() => {
        wasLongPressRef.current = true;
        haptic(50);
        onLongPress(e);
      }, longPressDelay);
    },
    [longPressDelay, onLongPress, haptic]
  );

  const handleMove = useCallback(
    (e) => {
      const pos = e.touches?.[0] || e;
      const dx = Math.abs(pos.clientX - startPosRef.current.x);
      const dy = Math.abs(pos.clientY - startPosRef.current.y);

      if (dx > 10 || dy > 10) {
        clearLongPress();
        setIsPressed(false);
      }
    },
    [clearLongPress]
  );

  const handleEnd = useCallback(
    (e) => {
      clearLongPress();
      setIsPressed(false);

      // Only trigger click if it wasn't a long press
      if (!wasLongPressRef.current) {
        haptic(10);
        onClick(e);
      }
    },
    [clearLongPress, onClick, haptic]
  );

  const handleCancel = useCallback(() => {
    clearLongPress();
    setIsPressed(false);
  }, [clearLongPress]);

  useEffect(() => {
    return () => clearLongPress();
  }, [clearLongPress]);

  // Build handlers based on device type
  const handlers = {
    // Touch events
    onTouchStart: handleStart,
    onTouchMove: handleMove,
    onTouchEnd: handleEnd,
    onTouchCancel: handleCancel,
  };

  // Add mouse events only for non-touch devices
  if (!isTouch) {
    handlers.onMouseDown = handleStart;
    handlers.onMouseUp = handleEnd;
    handlers.onMouseLeave = handleCancel;
    handlers.onMouseEnter = () => {
      setIsHovered(true);
      onHoverStart();
    };
    handlers.onMouseLeave = () => {
      setIsHovered(false);
      onHoverEnd();
      handleCancel();
    };
  }

  return {
    handlers,
    isPressed,
    isHovered,
    isTouch,
    isMobile,
  };
};

// ========== CSS Utilities ==========

/**
 * Generate CSS for touch-friendly components
 */
export const touchFriendlyCSS = `
  /* Ensure minimum touch targets */
  .touch-target {
    min-width: 44px;
    min-height: 44px;
  }

  /* Disable webkit tap highlight */
  .no-tap-highlight {
    -webkit-tap-highlight-color: transparent;
  }

  /* Touch-friendly focus styles */
  @media (hover: none) {
    .touch-focus:focus {
      outline: none;
      box-shadow: 0 0 0 3px var(--accent, #3b82f6);
    }
  }

  /* Prevent text selection on interactive elements */
  .no-select {
    -webkit-user-select: none;
    user-select: none;
  }

  /* Touch-optimized scrolling */
  .touch-scroll {
    -webkit-overflow-scrolling: touch;
    overflow-y: auto;
  }

  /* Hide scrollbars on touch but allow scrolling */
  @media (hover: none) {
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  }
`;

export default useInteraction;
