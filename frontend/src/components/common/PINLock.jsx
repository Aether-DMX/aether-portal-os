import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import useUIStore from '../../store/uiStore';

export default function PINLock({ adminMode = false }) {
  const { pinCode, setIsLocked, setIsAdmin } = useUIStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit) => {
    if (input.length < 6) {
      const newInput = input + digit;
      setInput(newInput);
      
      if (newInput.length === pinCode.length) {
        if (newInput === pinCode) {
          setIsLocked(false);
          if (adminMode) {
            setIsAdmin(true);
          }
          setInput('');
          setError(false);
        } else {
          setError(true);
          setTimeout(() => {
            setInput('');
            setError(false);
          }, 1000);
        }
      }
    }
  };

  const handleClear = () => {
    setInput('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center">
      <div className="glass-panel p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <Lock className="w-16 h-16 mx-auto mb-4 text-accent-500" />
          <h2 className="text-3xl font-bold mb-2">
            {adminMode ? 'Admin Access' : 'Enter PIN'}
          </h2>
          <p className="text-slate-400">
            {adminMode ? 'Admin PIN required' : 'Unlock to continue'}
          </p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-8">
          {[...Array(pinCode.length)].map((_, i) => (
            <div
              key={i}
              className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold
                ${input.length > i ? 'bg-accent-500/20 border-2 border-accent-500' : 'glass-panel'}
                ${error ? 'animate-shake border-red-500' : ''}`}
            >
              {input.length > i ? '•' : ''}
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 mb-4 justify-center">
            <AlertCircle className="w-5 h-5" />
            <span>Incorrect PIN</span>
          </div>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num.toString())}
              className="glass-button text-2xl font-bold h-16 hover:bg-accent-500/20"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="glass-button text-lg"
          >
            Clear
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="glass-button text-2xl font-bold h-16 hover:bg-accent-500/20"
          >
            0
          </button>
          <div />
        </div>
      </div>
    </div>
  );
}
