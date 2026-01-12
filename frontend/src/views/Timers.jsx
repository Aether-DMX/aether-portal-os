import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Timer, Play, Pause, RotateCcw, Trash2, Plus, X, ArrowLeft, Check, Clock
} from 'lucide-react';
import axios from 'axios';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

// Format milliseconds to MM:SS or HH:MM:SS
function formatTime(ms) {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Timer Card Component
function TimerCard({ timer, onStart, onPause, onReset, onDelete, isDesktop }) {
  const [displayTime, setDisplayTime] = useState(timer.remaining_ms);
  const intervalRef = useRef(null);

  useEffect(() => {
    // If running, start a local countdown display
    if (timer.status === 'running' && timer.remaining_ms > 0) {
      const startTime = Date.now();
      const initialRemaining = timer.remaining_ms;

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newRemaining = Math.max(0, initialRemaining - elapsed);
        setDisplayTime(newRemaining);

        if (newRemaining <= 0) {
          clearInterval(intervalRef.current);
        }
      }, 100);

      return () => clearInterval(intervalRef.current);
    } else {
      setDisplayTime(timer.remaining_ms);
    }
  }, [timer.status, timer.remaining_ms]);

  const progress = timer.duration_ms > 0
    ? ((timer.duration_ms - displayTime) / timer.duration_ms) * 100
    : 0;

  const isCompleted = timer.status === 'completed' || displayTime <= 0;
  const isRunning = timer.status === 'running' && displayTime > 0;
  const isPaused = timer.status === 'paused';

  return (
    <div className={`rounded-xl border transition-all ${
      isRunning
        ? 'border-[var(--theme-primary)]/50 bg-[var(--theme-primary)]/10'
        : isCompleted
        ? 'border-green-500/30 bg-green-500/5'
        : 'border-white/10 bg-white/5'
    } ${isDesktop ? 'p-5' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold text-white truncate ${isDesktop ? 'text-base' : 'text-sm'}`}>
          {timer.name}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          isRunning
            ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)]'
            : isCompleted
            ? 'bg-green-500/20 text-green-400'
            : isPaused
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-white/10 text-white/50'
        }`}>
          {isCompleted ? 'Done' : isRunning ? 'Running' : isPaused ? 'Paused' : 'Stopped'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-100 ${
            isCompleted ? 'bg-green-500' : 'bg-[var(--theme-primary)]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Time Display */}
      <div className={`font-mono font-bold text-white text-center mb-4 ${
        isDesktop ? 'text-4xl' : 'text-3xl'
      }`}>
        {formatTime(displayTime)}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => isRunning ? onPause(timer) : onStart(timer)}
          className={`flex-1 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            isRunning
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
              : 'bg-[var(--theme-primary)] text-black hover:brightness-110'
          }`}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => onReset(timer)}
          className="px-3 py-2.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/15 hover:text-white transition-all"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => onDelete(timer)}
          className="px-3 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// Create Timer Modal
function CreateTimerModal({ isOpen, onClose, onCreate, isDesktop }) {
  const [name, setName] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);

  const handleCreate = () => {
    const durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
    if (durationMs > 0 && name.trim()) {
      onCreate({ name: name.trim(), duration_ms: durationMs });
      setName('');
      setHours(0);
      setMinutes(5);
      setSeconds(0);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`bg-gray-900 rounded-2xl border border-white/10 overflow-hidden ${
          isDesktop ? 'w-[400px]' : 'w-full max-w-sm'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-bold">New Timer</h2>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-white/50 text-xs uppercase mb-2 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Timer name..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--theme-primary)]"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-white/50 text-xs uppercase mb-2 block">Duration</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono focus:outline-none focus:border-[var(--theme-primary)]"
                />
                <div className="text-center text-white/40 text-xs mt-1">Hours</div>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono focus:outline-none focus:border-[var(--theme-primary)]"
                />
                <div className="text-center text-white/40 text-xs mt-1">Minutes</div>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono focus:outline-none focus:border-[var(--theme-primary)]"
                />
                <div className="text-center text-white/40 text-xs mt-1">Seconds</div>
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="text-white/50 text-xs uppercase mb-2 block">Quick Set</label>
            <div className="flex gap-2">
              {[
                { label: '1m', h: 0, m: 1, s: 0 },
                { label: '5m', h: 0, m: 5, s: 0 },
                { label: '10m', h: 0, m: 10, s: 0 },
                { label: '30m', h: 0, m: 30, s: 0 },
                { label: '1h', h: 1, m: 0, s: 0 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setHours(preset.h);
                    setMinutes(preset.m);
                    setSeconds(preset.s);
                  }}
                  className="flex-1 py-2 rounded-lg bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || (hours === 0 && minutes === 0 && seconds === 0)}
            className="flex-1 py-3 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={18} />
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Timers View
export default function Timers() {
  const navigate = useNavigate();
  const [timers, setTimers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Responsive
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 800
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth >= 1024;

  // Fetch timers
  const fetchTimers = async () => {
    try {
      const res = await axios.get(getAetherCore() + '/api/timers');
      setTimers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch timers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimers();
    const interval = setInterval(fetchTimers, 2000);
    return () => clearInterval(interval);
  }, []);

  // Timer actions
  const handleCreate = async ({ name, duration_ms }) => {
    try {
      await axios.post(getAetherCore() + '/api/timers', { name, duration_ms });
      fetchTimers();
    } catch (err) {
      console.error('Failed to create timer:', err);
    }
  };

  const handleStart = async (timer) => {
    try {
      await axios.post(getAetherCore() + `/api/timers/${timer.timer_id}/start`);
      fetchTimers();
    } catch (err) {
      console.error('Failed to start timer:', err);
    }
  };

  const handlePause = async (timer) => {
    try {
      await axios.post(getAetherCore() + `/api/timers/${timer.timer_id}/pause`);
      fetchTimers();
    } catch (err) {
      console.error('Failed to pause timer:', err);
    }
  };

  const handleReset = async (timer) => {
    try {
      await axios.post(getAetherCore() + `/api/timers/${timer.timer_id}/reset`);
      fetchTimers();
    } catch (err) {
      console.error('Failed to reset timer:', err);
    }
  };

  const handleDelete = async (timer) => {
    if (!confirm(`Delete timer "${timer.name}"?`)) return;
    try {
      await axios.delete(getAetherCore() + `/api/timers/${timer.timer_id}`);
      fetchTimers();
    } catch (err) {
      console.error('Failed to delete timer:', err);
    }
  };

  // Grid columns based on screen width
  const getGridCols = () => {
    if (windowWidth >= 1440) return 3;
    if (windowWidth >= 1024) return 2;
    return 2;
  };

  return (
    <div className={`min-h-screen bg-[#0a0a0f] ${isDesktop ? 'p-6' : 'p-4'} pb-24`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className={`rounded-xl bg-white/10 text-white flex items-center justify-center ${
              isDesktop ? 'w-11 h-11 hover:bg-white/15' : 'w-10 h-10'
            }`}
          >
            <ArrowLeft size={isDesktop ? 22 : 20} />
          </button>
          <div>
            <h1 className={`font-bold text-white flex items-center gap-2 ${
              isDesktop ? 'text-2xl' : 'text-xl'
            }`}>
              <Timer className="text-[var(--theme-primary)]" size={isDesktop ? 28 : 24} />
              Timers
            </h1>
            <p className="text-white/50 text-xs mt-0.5">
              {timers.length} timer{timers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center gap-2 ${
            isDesktop ? 'px-5 py-3 text-sm hover:brightness-110' : 'px-4 py-2.5 text-sm'
          }`}
        >
          <Plus size={18} />
          {isDesktop ? 'New Timer' : 'New'}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center text-white/50 py-12">Loading...</div>
      ) : timers.length === 0 ? (
        <div className="text-center py-16">
          <div className={`mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4 ${
            isDesktop ? 'w-20 h-20' : 'w-16 h-16'
          }`}>
            <Timer size={isDesktop ? 40 : 32} className="text-white/20" />
          </div>
          <p className="text-white/50 text-sm mb-1">No timers created yet</p>
          <p className="text-white/30 text-xs mb-4">
            Create countdown timers for rehearsals and live events
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--theme-primary)] text-black font-semibold"
          >
            <Plus size={18} /> Create Your First Timer
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${getGridCols()}, 1fr)`,
            gap: isDesktop ? '20px' : '12px',
          }}
        >
          {timers.map((timer) => (
            <TimerCard
              key={timer.timer_id}
              timer={timer}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
              onDelete={handleDelete}
              isDesktop={isDesktop}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateTimerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
        isDesktop={isDesktop}
      />
    </div>
  );
}

export const TimersHeaderExtension = () => null;
