import React, { useState } from 'react';
import TouchKeyboard from './TouchKeyboard';

export default function TouchInput({ 
  value, 
  onChange, 
  placeholder, 
  type = 'text',
  className = '',
  style = {},
  ...props 
}) {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  const handleFocus = () => {
    setShowKeyboard(true);
  };

  const handleInputChange = (input) => {
    setLocalValue(input);
    if (onChange) {
      onChange({ target: { value: input } });
    }
  };

  const handleClose = () => {
    setShowKeyboard(false);
  };

  return (
    <>
      <input
        type={type}
        value={localValue}
        onFocus={handleFocus}
        onChange={(e) => {
          setLocalValue(e.target.value);
          if (onChange) onChange(e);
        }}
        placeholder={placeholder}
        className={className}
        style={style}
        readOnly={showKeyboard}
        {...props}
      />

      {showKeyboard && (
        <TouchKeyboard
          onClose={handleClose}
          onInputChange={handleInputChange}
        />
      )}
    </>
  );
}
