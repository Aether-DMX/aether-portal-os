import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { X, Delete } from 'lucide-react';

const KeyboardContext = createContext(null);

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within KeyboardProvider');
  }
  return context;
}

export function KeyboardProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [layoutName, setLayoutName] = useState('default');
  const [inputType, setInputType] = useState('text'); // 'text' | 'number'
  const keyboardRef = useRef(null);
  const callbackRef = useRef(null);
  const inputRef = useRef(null);

  const openKeyboard = useCallback((initialValue = '', callback, type = 'text', inputElement = null) => {
    setInputValue(initialValue);
    setInputType(type);
    setLayoutName(type === 'number' ? 'numbers' : 'default');
    callbackRef.current = callback;
    inputRef.current = inputElement;
    setIsOpen(true);

    // Sync keyboard with initial value
    setTimeout(() => {
      if (keyboardRef.current) {
        keyboardRef.current.setInput(initialValue);
      }
    }, 50);
  }, []);

  const closeKeyboard = useCallback(() => {
    setIsOpen(false);
    callbackRef.current = null;
    inputRef.current = null;
  }, []);

  const handleChange = useCallback((input) => {
    setInputValue(input);
    if (callbackRef.current) {
      callbackRef.current(input);
    }
  }, []);

  const handleKeyPress = useCallback((button) => {
    if (button === '{enter}') {
      closeKeyboard();
    } else if (button === '{shift}' || button === '{lock}') {
      setLayoutName(prev => prev === 'default' ? 'shift' : 'default');
    }
  }, [closeKeyboard]);

  return (
    <KeyboardContext.Provider value={{ openKeyboard, closeKeyboard, isOpen }}>
      {children}

      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[9999]" style={{ touchAction: 'none' }}>
          {/* Backdrop - tap to close */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={closeKeyboard}
            style={{ zIndex: -1 }}
          />

          <div
            className="rounded-t-2xl border-t border-x border-white/20 p-3"
            style={{
              background: 'rgba(10, 10, 20, 0.98)',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.8)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header with current value display */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex-1 px-4 py-2 rounded-xl text-white text-lg font-medium truncate"
                style={{ background: 'rgba(255,255,255,0.1)', minHeight: '44px', lineHeight: '28px' }}
              >
                {inputValue || <span className="text-white/30">Type here...</span>}
              </div>
              <button
                onClick={closeKeyboard}
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {inputType === 'number' ? (
              // Number pad layout
              <div className="grid grid-cols-3 gap-2">
                {['1','2','3','4','5','6','7','8','9','.',  '0', 'del'].map(key => (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === 'del') {
                        handleChange(inputValue.slice(0, -1));
                        keyboardRef.current?.setInput(inputValue.slice(0, -1));
                      } else {
                        const newVal = inputValue + key;
                        handleChange(newVal);
                        keyboardRef.current?.setInput(newVal);
                      }
                    }}
                    className="h-14 rounded-xl font-bold text-xl text-white flex items-center justify-center transition-all active:scale-95"
                    style={{
                      background: key === 'del' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {key === 'del' ? <Delete size={20} /> : key}
                  </button>
                ))}
              </div>
            ) : (
              // Full QWERTY keyboard
              <Keyboard
                keyboardRef={r => keyboardRef.current = r}
                layoutName={layoutName}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                theme="hg-theme-default aether-keyboard-global"
                layout={{
                  default: [
                    'q w e r t y u i o p',
                    'a s d f g h j k l',
                    '{shift} z x c v b n m {bksp}',
                    '{numbers} {space} {enter}'
                  ],
                  shift: [
                    'Q W E R T Y U I O P',
                    'A S D F G H J K L',
                    '{shift} Z X C V B N M {bksp}',
                    '{numbers} {space} {enter}'
                  ],
                  numbers: [
                    '1 2 3 4 5 6 7 8 9 0',
                    '- / : ; ( ) $ & @',
                    '{symbols} . , ? ! \' " {bksp}',
                    '{abc} {space} {enter}'
                  ],
                  symbols: [
                    '[ ] { } # % ^ * + =',
                    '_ \\ | ~ < > € £ ¥',
                    '{numbers} . , ? ! \' " {bksp}',
                    '{abc} {space} {enter}'
                  ]
                }}
                display={{
                  '{bksp}': '⌫',
                  '{enter}': 'Done',
                  '{shift}': '⇧',
                  '{space}': ' ',
                  '{numbers}': '123',
                  '{abc}': 'ABC',
                  '{symbols}': '#+=',
                }}
                buttonTheme={[
                  { class: 'special-key', buttons: '{shift} {bksp} {enter} {numbers} {abc} {symbols}' },
                  { class: 'space-key', buttons: '{space}' },
                  { class: 'enter-key', buttons: '{enter}' },
                ]}
                onKeyPress={(button) => {
                  if (button === '{numbers}') setLayoutName('numbers');
                  else if (button === '{abc}') setLayoutName('default');
                  else if (button === '{symbols}') setLayoutName('symbols');
                  else handleKeyPress(button);
                }}
              />
            )}
          </div>

          <style>{`
            .aether-keyboard-global {
              background: transparent !important;
              padding: 0 !important;
            }
            .aether-keyboard-global .hg-row {
              margin-bottom: 6px !important;
              display: flex !important;
              justify-content: center !important;
            }
            .aether-keyboard-global .hg-button {
              background: rgba(255, 255, 255, 0.1) !important;
              border: 1px solid rgba(255, 255, 255, 0.2) !important;
              color: #ffffff !important;
              border-radius: 8px !important;
              font-size: 18px !important;
              font-weight: 600 !important;
              height: 48px !important;
              min-width: 32px !important;
              flex-grow: 1 !important;
              margin: 0 3px !important;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
              transition: all 0.1s ease !important;
            }
            .aether-keyboard-global .hg-button:active {
              background: var(--accent, #00ffaa) !important;
              color: #000 !important;
              transform: scale(0.95) !important;
            }
            .aether-keyboard-global .hg-button.special-key {
              background: rgba(255, 255, 255, 0.15) !important;
              font-size: 14px !important;
              min-width: 50px !important;
            }
            .aether-keyboard-global .hg-button.space-key {
              min-width: 180px !important;
              flex-grow: 3 !important;
            }
            .aether-keyboard-global .hg-button.enter-key {
              background: var(--accent, #00ffaa) !important;
              color: #000 !important;
              font-weight: 700 !important;
              min-width: 70px !important;
            }
            .aether-keyboard-global .hg-button span {
              color: inherit !important;
            }
          `}</style>
        </div>
      )}
    </KeyboardContext.Provider>
  );
}
