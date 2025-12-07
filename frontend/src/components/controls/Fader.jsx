import React, { useState, useRef, useEffect } from 'react';

export default function Fader({ channel, value, label, onChange, onLabelChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const sliderRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const updateValue = (newValue) => {
    const clampedValue = Math.max(0, Math.min(255, Math.round(newValue)));
    setLocalValue(clampedValue);
    onChange(clampedValue);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleMove(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMove = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    const percentage = 1 - (y - rect.top) / rect.height;
    const newValue = percentage * 255;
    updateValue(newValue);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    handleMove(e);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    handleMove(e);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const handleLabelClick = () => {
    setIsEditing(true);
  };

  const handleLabelSave = () => {
    onLabelChange(editLabel);
    setIsEditing(false);
  };

  return (
    // Card wrapper around entire fader
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
        className="relative flex-1 w-full bg-black/60 rounded-lg cursor-pointer border-2 border-white/20 mb-2"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className="absolute bottom-0 w-full rounded-lg transition-all"
          style={{ 
            height: `${(localValue / 255) * 100}%`,
            background: `var(--theme-primary)`
          }}
        />
      </div>

      {/* DMX Value */}
      <div className="text-sm font-bold text-white bg-black/60 px-2 py-1 rounded text-center border border-white/10 mb-2">
        {localValue}
      </div>

      {/* FULL button */}
      <button
        onClick={() => updateValue(255)}
        className="w-full bg-black/80 border-2 border-white/20 hover:border-[var(--theme-primary)] text-white text-xs font-bold py-2 rounded-lg transition-all hover:scale-105"
      >
        FULL
      </button>
    </div>
  );
}
