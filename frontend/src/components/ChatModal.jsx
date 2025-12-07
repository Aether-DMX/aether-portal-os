import React from 'react';
import { X, Smartphone, Zap, Sparkles, Radio } from 'lucide-react';
import { QRCodeSVG as QRCode } from 'qrcode.react';

export default function ChatModal({ onClose }) {
  const mobileUrl = `http://${window.location.hostname}:3000/aether-ai`;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-3">
      <div
        className="glass-panel rounded-xl border-2 w-full max-w-3xl"
        style={{
          borderColor: 'rgba(139, 92, 246, 0.4)',
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
          height: '420px'
        }}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1))',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
              }}>
              <img
                src="/Aether_LogoN1.png"
                alt="AI"
                className="w-5 h-5"
                style={{ filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.6))' }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-1">
                AETHER AI
                <Sparkles size={14} style={{ color: 'var(--theme-primary)' }} />
              </h2>
              <p className="text-xs text-white/60">Mobile Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center hover:scale-110 transition-all text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Compact Side-by-Side Content */}
        <div className="flex h-[370px]">
          {/* Left Side - Info */}
          <div className="flex-1 p-4 flex flex-col justify-center space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Smartphone size={20} style={{ color: 'var(--theme-primary)' }} />
              <h3 className="text-xl font-bold text-white">Control from Phone</h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(139, 92, 246, 0.2)', border: '2px solid rgba(139, 92, 246, 0.4)' }}>
                  <Radio size={12} style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Connect WiFi</p>
                  <p className="text-white/60 text-xs">Same network as AETHER</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(139, 92, 246, 0.2)', border: '2px solid rgba(139, 92, 246, 0.4)' }}>
                  <Zap size={12} style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Real-Time Sync</p>
                  <p className="text-white/60 text-xs">AI sees your touchscreen actions</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(139, 92, 246, 0.2)', border: '2px solid rgba(139, 92, 246, 0.4)' }}>
                  <Sparkles size={12} style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Voice Control</p>
                  <p className="text-white/60 text-xs">Natural lighting commands</p>
                </div>
              </div>
            </div>

            {/* Compact URL */}
            <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/20">
              <p className="text-xs text-white/50 mb-0.5">Manual link:</p>
              <code className="text-xs text-white/70 break-all">{mobileUrl}</code>
            </div>
          </div>

          {/* Right Side - Compact QR */}
          <div className="w-[240px] border-l p-4 flex flex-col items-center justify-center"
            style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
            <p className="text-sm text-white font-bold mb-2">Scan QR Code</p>
            <div className="bg-white p-3 rounded-xl shadow-2xl">
              <QRCode
                value={mobileUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-white/50 mt-2 text-center">
              Point camera at code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
