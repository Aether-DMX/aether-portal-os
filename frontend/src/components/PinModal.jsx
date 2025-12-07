import React, { useState, useEffect } from 'react';
import { X, Lock, Shield, User, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function PinModal({ onClose, onSuccess, requiredRole = 'user' }) {
  const { authenticate, getRoleColor, getRoleLabel, securityEnabled } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  // If security is disabled, auto-authenticate as admin
  useEffect(() => {
    if (!securityEnabled) {
      onSuccess('admin');
      onClose();
    }
  }, [securityEnabled, onSuccess, onClose]);

  const handleNumberClick = (num) => {
    if (pin.length < 6) {
      setPin(pin + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleSubmit = () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    const role = authenticate(pin);
    
    if (role) {
      // Check if authenticated role meets required role
      const roleHierarchy = { admin: 2, user: 1, none: 0 };
      if (roleHierarchy[role] >= roleHierarchy[requiredRole]) {
        onSuccess(role);
        onClose();
      } else {
        setError(`${getRoleLabel(requiredRole)} access required`);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin('');
      }
    } else {
      setError('Invalid PIN');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key >= '0' && e.key <= '9') {
      handleNumberClick(e.key);
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pin]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur z-[100] flex items-center justify-center p-4">
      <div
        className={`glass-panel rounded-2xl border w-full max-w-md ${shake ? 'animate-shake' : ''}`}
        style={{ borderColor: 'var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: getRoleColor(requiredRole),
              }}
            >
              {requiredRole === 'admin' ? <Shield size={20} color="#fff" /> : <User size={20} color="#fff" />}
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Enter PIN
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {getRoleLabel(requiredRole)} access required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-white/10 transition-all"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* PIN Display */}
        <div className="p-6">
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: i < pin.length ? 'var(--theme-primary)' : 'var(--border-color)',
                  background: i < pin.length ? 'rgba(var(--theme-primary-rgb), 0.2)' : 'var(--input-bg)',
                }}
              >
                {i < pin.length && (
                  <div className="w-3 h-3 rounded-full" style={{ background: 'var(--theme-primary)' }} />
                )}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg flex items-center gap-2" style={{ background: '#ef4444', color: '#fff' }}>
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="h-16 rounded-lg font-bold text-xl transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleBackspace}
              className="h-16 rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-tertiary)',
              }}
            >
              ⌫ Back
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="h-16 rounded-lg font-bold text-xl transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              0
            </button>
            <button
              onClick={handleSubmit}
              className="h-16 rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'var(--theme-primary)',
                color: '#fff',
              }}
            >
              ✓ Enter
            </button>
          </div>
        </div>

        {/* Helper Text */}
        <div className="px-6 pb-6">
          <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
            Default PINs: User = 1234, Admin = 0000
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}
