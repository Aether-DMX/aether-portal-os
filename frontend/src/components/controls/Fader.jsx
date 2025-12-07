import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function Fader({ channel, value, label, onChange, onLabelChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const sliderRef = useRef(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const updateValue = useCallback((newValue) => {
    const clampedValue = Math.max(0, Math.min(255, Math.round(newValue)));
    setLocalValue(clampedValue);

    // Throttle updates to prevent overwhelming the backend
    const now = Date.now();
    if (now - lastUpdateRef.current > 30) { // Max ~33 updates/sec
      lastUpdateRef.current = now;
      onChange(clampedValue);
    }
  }, [onChange]);

  const calculateValue = useCallback((clientY) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = 1 - (clientY - rect.top) / rect.height;
    const newValue = Math.max(0, Math.min(1, percentage)) * 255;
    updateValue(newValue);
  }, [updateValue]);

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.classList.add('dragging');
    calculateValue(e.clientY);
  }, [calculateValue]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    calculateValue(e.clientY);
  }, [isDragging, calculateValue]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.classList.remove('dragging');
      // Send final value
      onChange(localValue);
    }
  }, [isDragging, localValue, onChange]);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.classList.add('dragging');
    if (e.touches[0]) {
      calculateValue(e.touches[0].clientY);
    }
  }, [calculateValue]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    if (e.touches[0]) {
      calculateValue(e.touches[0].clientY);
    }
  }, [isDragging, calculateValue]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.classList.remove('dragging');
      // Send final value
      onChange(localValue);
    }
  }, [isDragging, localValue, onChange]);

  // Global event listeners
  useEffect(() => {
    if (isDragging) {
      const options = { passive: false };
      window.addEventListener('mousemove', handleMouseMove, options);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, options);
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('dragging');
    };
  }, []);

  const handleLabelClick = () => {
    setIsEditing(true);
  };

  const handleLabelSave = () => {
    onLabelChange(editLabel);
    setIsEditing(false);
  };

  const percentage = (localValue / 255) * 100;

  return (
    <div className="glass-panel rounded-xl p-3 border border-white/10 h-full flex flex-col">
      {/* Label - editable on click */}
      {isEditing ? (
        <input
          type="text"
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onBlur={handleLabelSave}
          onKeyDown={(e) => e.key === 'Enter' && handleLabelSave()}
          className="w-full text-center text-xs px-1 py-1 bg-black/60 text-white border border-[var(--theme-primary)] rounded mb-2"
          autoFocus
        />
      ) : (
        <div
          onClick={handleLabelClick}
          className="text-xs text-white/80 cursor-pointer hover:text-[var(--theme-primary)] w-full text-center truncate mb-2"
        >
          {label}
        </div>
      )}

      {/* Fader slider */}
      <div
        ref={sliderRef}
        className="relative flex-1 w-full bg-black/60 rounded-lg cursor-pointer border-2 border-white/20 mb-2 touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ touchAction: 'none' }}
      >
        {/* Fill bar - no transition during drag for smoothness */}
        <div
          className="absolute bottom-0 w-full rounded-lg pointer-events-none"
          style={{
            height: `${percentage}%`,
            background: `var(--theme-primary)`,
            transition: isDragging ? 'none' : 'height 0.1s ease-out'
          }}
        />
        {/* Grab indicator */}
        <div
          className="absolute left-0 right-0 h-2 rounded pointer-events-none"
          style={{
            bottom: `calc(${percentage}% - 4px)`,
            background: 'rgba(255,255,255,0.8)',
            boxShadow: '0 0 8px rgba(255,255,255,0.5)',
            transition: isDragging ? 'none' : 'bottom 0.1s ease-out'
          }}
        />
      </div>

      {/* DMX Value */}
      <div className="text-sm font-bold text-white bg-black/60 px-2 py-1 rounded text-center border border-white/10 mb-2">
        {localValue}
      </div>

      {/* FULL button */}
      <button
        onClick={() => {
          setLocalValue(255);
          onChange(255);
        }}
        className="w-full bg-black/80 border-2 border-white/20 hover:border-[var(--theme-primary)] text-white text-xs font-bold py-2 rounded-lg transition-all active:scale-95"
      >
        FULL
      </button>
    </div>
  );
}
