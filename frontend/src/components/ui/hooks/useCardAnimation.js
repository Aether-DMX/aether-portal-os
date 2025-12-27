/**
 * useCardAnimation - Performance-optimized card animation hook
 *
 * Provides touch/hover state management with debouncing and
 * reduced re-renders for smooth 60fps animations.
 */
import { useState, useCallback, useRef, useMemo } from 'react';

/**
 * Debounced state setter to prevent excessive re-renders
 */
function useDebouncedState(initialValue, delay = 16) {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef(null);

  const setDebouncedValue = useCallback((newValue) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setValue(newValue);
    }, delay);
  }, [delay]);

  return [value, setDebouncedValue, setValue];
}

/**
 * useCardAnimation hook
 *
 * Manages hover, press, and playing states for cards with
 * optimized performance for touch devices.
 */
export function useCardAnimation({
  onLongPress,
  longPressDelay = 500,
  disabled = false,
} = {}) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered, setHoveredImmediate] = useDebouncedState(false);
  const longPressTimerRef = useRef(null);
  const touchStartTimeRef = useRef(0);

  // Clear long press timer
  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    if (disabled) return;

    setIsPressed(true);
    touchStartTimeRef.current = Date.now();

    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress(e);
        setIsPressed(false);
      }, longPressDelay);
    }
  }, [disabled, onLongPress, longPressDelay]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    clearLongPress();
  }, [clearLongPress]);

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    setIsPressed(false);
    clearLongPress();
  }, [clearLongPress]);

  // Handle mouse enter
  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setHoveredImmediate(true);
    }
  }, [disabled, setHoveredImmediate]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setHoveredImmediate(false);
    setIsPressed(false);
  }, [setHoveredImmediate]);

  // Handle mouse down
  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      setIsPressed(true);
    }
  }, [disabled]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  // Memoized event handlers object
  const handlers = useMemo(() => ({
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
  }), [
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseDown,
    handleMouseUp,
  ]);

  return {
    isPressed,
    isHovered,
    handlers,
  };
}

export default useCardAnimation;
