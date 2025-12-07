import React, { useState, useEffect } from 'react';
import useUIStore from '../../store/uiStore';

export default function ScreenSaver() {
  const { screenSaverActive, updateActivity, showClock, show24Hour } = useUIStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!screenSaverActive) return null;

  const handleClick = () => {
    updateActivity();
  };

  const formatTime = () => {
    if (show24Hour) {
      return time.toLocaleTimeString('en-US', { hour12: false });
    }
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = () => {
    return time.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer"
      onClick={handleClick}
    >
      {showClock && (
        <div className="text-center animate-pulse">
          <div className="text-8xl font-light mb-4 text-white/90">
            {formatTime()}
          </div>
          <div className="text-2xl text-white/60">
            {formatDate()}
          </div>
        </div>
      )}
      
      <div className="absolute bottom-8 text-white/40 text-sm">
        Touch to wake
      </div>
    </div>
  );
}
