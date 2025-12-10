import React, { useRef } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { X } from 'lucide-react';

export default function TouchKeyboard({ onClose, onInputChange, inputName = 'default' }) {
  const keyboard = useRef();

  const handleChange = (input) => {
    if (onInputChange) {
      onInputChange(input);
    }
  };

  const handleKeyPress = (button) => {
    if (button === '{enter}') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-2">
      <div className="glass-panel rounded-xl border p-2" 
        style={{ 
          borderColor: 'var(--border-color)',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.8)',
          background: 'rgba(0, 0, 0, 0.95)',
        }}
      >
        <div className="flex items-center justify-between mb-2 px-2">
          <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
            Keyboard
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border flex items-center justify-center hover:scale-110 transition-all"
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <X size={14} />
          </button>
        </div>
        
        <Keyboard
          keyboardRef={(r) => (keyboard.current = r)}
          layoutName="default"
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          theme="hg-theme-default aether-keyboard"
          display={{
            '{bksp}': '⌫',
            '{enter}': '↵',
            '{shift}': '⇧',
            '{tab}': '⇥',
            '{space}': '—',
          }}
        />
      </div>

      <style>{`
        .aether-keyboard {
          background: transparent !important;
          padding: 0 !important;
        }
        .aether-keyboard .hg-button {
          background: rgba(30, 30, 40, 0.9) !important;
          border: 1px solid rgba(100, 200, 255, 0.3) !important;
          color: #ffffff !important;
          border-radius: 6px !important;
          font-size: 16px !important;
          font-weight: 700 !important;
          height: clamp(32px, 8vh, 44px) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
        }
        .aether-keyboard .hg-button:active {
          background: var(--theme-primary) !important;
          color: #fff !important;
          transform: scale(0.95) !important;
          border-color: var(--theme-primary) !important;
        }
        .aether-keyboard .hg-row {
          margin-bottom: 6px !important;
        }
        .aether-keyboard .hg-button span {
          color: #ffffff !important;
          font-size: 16px !important;
          font-weight: 700 !important;
        }
      `}</style>
    </div>
  );
}
