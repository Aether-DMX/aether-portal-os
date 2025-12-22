import React from 'react';

export default function ThemedLogo({ size = 44, glow = true }) {
  const sizeVal = typeof size === 'string' ? size : `${size}px`;
  return (
    <div 
      style={{ 
        width: sizeVal, 
        height: sizeVal,
        background: "var(--theme-primary)",
        maskImage: "url(/aether_logo.png)",
        WebkitMaskImage: "url(/aether_logo.png)",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        filter: glow ? "drop-shadow(0 0 15px var(--theme-primary))" : "none"
      }} 
    />
  );
}
