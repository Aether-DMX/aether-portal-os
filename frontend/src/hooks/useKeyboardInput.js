import { useCallback } from 'react';
import { useKeyboard } from '../context/KeyboardContext';

/**
 * Hook to make any input touch-keyboard enabled
 *
 * Usage:
 * const { onFocus } = useKeyboardInput(value, setValue, 'text');
 * <input value={value} onChange={e => setValue(e.target.value)} onFocus={onFocus} />
 *
 * Or for number inputs:
 * const { onFocus } = useKeyboardInput(value, setValue, 'number');
 */
export function useKeyboardInput(value, onChange, type = 'text') {
  const { openKeyboard } = useKeyboard();

  const onFocus = useCallback((e) => {
    // Blur the input to prevent native keyboard on mobile
    e.target.blur();

    // Open our touch keyboard
    openKeyboard(
      String(value || ''),
      (newValue) => {
        // Handle the change - could be string or synthetic event format
        if (typeof onChange === 'function') {
          onChange(type === 'number' ? (newValue === '' ? '' : Number(newValue)) : newValue);
        }
      },
      type,
      e.target
    );
  }, [value, onChange, type, openKeyboard]);

  return { onFocus };
}

export default useKeyboardInput;
