import React, { useState, useEffect } from 'react';
import TouchKeyboard from './TouchKeyboard';

export default function TouchInput({
  value = '',
  onChange,
  placeholder,
  type = 'text',
  className = '',
  style = {},
  inputName = 'default',
  ...props
}) {
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleFocus = () => {
    setShowKeyboard(true);
  };

  const handleInputChange = (input) => {
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
        value={value}
        onFocus={handleFocus}
        onChange={(e) => {
          if (onChange) onChange(e);
        }}
        placeholder={placeholder}
        className={className}
        style={style}
        readOnly
        {...props}
      />

      {showKeyboard && (
        <TouchKeyboard
          onClose={handleClose}
          onInputChange={handleInputChange}
          inputName={inputName}
          initialValue={value}
        />
      )}
    </>
  );
}
