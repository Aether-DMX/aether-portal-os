import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function ChatModal({ onClose }) {
  const qrUrl = `http://${window.location.hostname}:3000/aether-ai`;

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('http://localhost:8891/api/ai/sessions');
        const data = await res.json();
        if (data && data.length > 0) {
          onClose();
        }
      } catch (e) {}
    };
    
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, [onClose]);

  return (
    <div className="aether-ai-fullscreen">
      <button className="aether-ai-close" onClick={onClose}>✕</button>
      
      <div className="aether-ai-content">
        <div className="aether-ai-left">
          <div className="aether-ai-logo">AETHER AI</div>
          
          <div className="aether-ai-steps">
            <div className="aether-ai-step">
              <div className="step-number">1</div>
              <div className="step-text">
                <strong>Connect to AETHER WiFi</strong>
                <span>Network: AETHER-Portal</span>
              </div>
            </div>
            
            <div className="aether-ai-step">
              <div className="step-number">2</div>
              <div className="step-text">
                <strong>Scan QR Code</strong>
                <span>Open camera app</span>
              </div>
            </div>
          </div>

          <div className="aether-ai-waiting">
            <div className="waiting-dot"></div>
            <span>Waiting for connection...</span>
          </div>
        </div>

        <div className="aether-ai-right">
          <div className="aether-ai-qr">
            <QRCodeSVG value={qrUrl} size={140} bgColor="transparent" fgColor="#ffffff" />
          </div>
          <div className="aether-ai-url">{qrUrl}</div>
        </div>
      </div>
    </div>
  );
}
