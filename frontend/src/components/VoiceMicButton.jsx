import React from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

/**
 * Voice microphone button with animated recording state
 *
 * @param {Object} props
 * @param {boolean} props.isListening - Whether currently recording
 * @param {boolean} props.isSupported - Whether speech recognition is supported
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {string} props.error - Error message if any
 * @param {Function} props.onClick - Click handler
 * @param {number} props.size - Button size (default: 40)
 */
export default function VoiceMicButton({
  isListening,
  isSupported,
  disabled,
  error,
  onClick,
  size = 40,
}) {
  const iconSize = Math.floor(size * 0.45);

  // Not supported - show disabled mic
  if (!isSupported) {
    return (
      <button
        disabled
        title="Voice input not supported in this browser"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          background: 'rgba(255, 255, 255, 0.05)',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.2)',
          cursor: 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MicOff size={iconSize} />
      </button>
    );
  }

  // Error state
  if (error) {
    return (
      <button
        onClick={onClick}
        title={error}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertCircle size={iconSize} />
      </button>
    );
  }

  // Active recording state
  if (isListening) {
    return (
      <>
        <button
          onClick={onClick}
          title="Stop recording"
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            background: '#ef4444',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            animation: 'mic-pulse 1.5s ease-in-out infinite',
          }}
        >
          <Mic size={iconSize} />
          {/* Pulsing ring effect */}
          <span
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              border: '2px solid #ef4444',
              animation: 'mic-ring 1.5s ease-out infinite',
              pointerEvents: 'none',
            }}
          />
        </button>
        <style>{`
          @keyframes mic-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes mic-ring {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.4); opacity: 0; }
          }
        `}</style>
      </>
    );
  }

  // Default idle state
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title="Start voice input"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: disabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: disabled ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.7)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      <Mic size={iconSize} />
    </button>
  );
}
