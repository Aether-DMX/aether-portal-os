import React, { useState, useEffect, useRef } from 'react';
import { X, Play, AlertTriangle, Grid3x3, Package, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFixtureStore } from '../store/fixtureStore';
import useGroupStore from '../store/groupStore';

export default function ActivationModal({ 
  item, 
  type,
  onClose, 
  onActivate,
  activeChannels = {}
}) {
  const [tab, setTab] = useState('channels');
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [selectedFixtures, setSelectedFixtures] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [channelPage, setChannelPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null);
  const dragStartRef = useRef(null);

  const { fixtures } = useFixtureStore();
  const { groups } = useGroupStore();

  const CHANNELS_PER_PAGE = 100;
  const TOTAL_PAGES = Math.ceil(512 / CHANNELS_PER_PAGE);
  const startChannel = channelPage * CHANNELS_PER_PAGE + 1;
  const endChannel = Math.min((channelPage + 1) * CHANNELS_PER_PAGE, 512);

  const getAffectedChannels = () => {
    const channels = new Set(selectedChannels);
    
    selectedFixtures.forEach(fixtureId => {
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (fixture) {
        for (let ch = fixture.startAddress; ch <= fixture.endAddress; ch++) {
          channels.add(ch);
        }
      }
    });
    
    selectedGroups.forEach(groupId => {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        group.channels.forEach(ch => channels.add(ch));
      }
    });
    
    return Array.from(channels).sort((a, b) => a - b);
  };

  useEffect(() => {
    const affected = getAffectedChannels();
    const conflicting = affected.filter(ch => activeChannels[ch]);
    setConflicts(conflicting);
  }, [selectedChannels, selectedFixtures, selectedGroups, activeChannels]);

  const toggleChannel = (ch) => {
    setSelectedChannels(prev => 
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleDragStart = (ch, e) => {
    e.preventDefault();
    setIsDragging(true);
    const isSelected = selectedChannels.includes(ch);
    setDragMode(isSelected ? 'unselect' : 'select');
    dragStartRef.current = ch;
    
    if (isSelected) {
      setSelectedChannels(prev => prev.filter(c => c !== ch));
    } else {
      setSelectedChannels(prev => [...prev, ch]);
    }
  };

  const handleDragOver = (ch) => {
    if (!isDragging) return;
    
    if (dragMode === 'select') {
      setSelectedChannels(prev => prev.includes(ch) ? prev : [...prev, ch]);
    } else {
      setSelectedChannels(prev => prev.filter(c => c !== ch));
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragMode(null);
    dragStartRef.current = null;
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => handleDragEnd();
    const handleGlobalTouchEnd = () => handleDragEnd();
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalTouchEnd);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, []);

  const toggleFixture = (id) => {
    setSelectedFixtures(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const toggleGroup = (id) => {
    setSelectedGroups(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleActivate = () => {
    if (conflicts.length > 0 && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    
    const affected = getAffectedChannels();
    onActivate({
      channels: affected,
      fixtures: selectedFixtures,
      groups: selectedGroups
    });
    onClose();
  };

  const tabs = [
    { id: 'channels', label: 'Channels', icon: Grid3x3, count: selectedChannels.length },
    { id: 'fixtures', label: 'Fixtures', icon: Package, count: selectedFixtures.length, disabled: fixtures.length === 0 },
    { id: 'groups', label: 'Groups', icon: Users, count: selectedGroups.length, disabled: groups.length === 0 }
  ];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-3">
      <div
        className="glass-panel rounded-xl border-2 w-full max-w-3xl"
        style={{
          borderColor: 'rgba(139, 92, 246, 0.4)',
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
          height: '420px'
        }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b"
             style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
                 style={{
                   background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1))',
                   boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
                 }}>
              <Play size={16} style={{ color: 'var(--theme-primary)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {type === 'scene' ? 'Scene' : 'Chase'}
              </h2>
              <p className="text-xs text-white/60">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose}
                  className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center hover:scale-110 transition-all text-white">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 py-2 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => !t.disabled && setTab(t.id)}
              disabled={t.disabled}
              className="flex-1 py-1 px-2 rounded border font-bold text-xs disabled:opacity-30"
              style={{
                borderColor: tab === t.id ? 'var(--theme-primary)' : 'rgba(255, 255, 255, 0.2)',
                background: tab === t.id ? 'rgba(var(--theme-primary-rgb), 0.2)' : 'transparent',
                color: tab === t.id ? 'var(--theme-primary)' : 'white'
              }}>
              {t.label} {t.count > 0 && `(${t.count})`}
            </button>
          ))}
        </div>

        {/* Content - FIXED HEIGHT with padding for buttons */}
        <div style={{ height: 'calc(420px - 120px)', padding: '8px 12px' }}>
          {/* Channels Tab */}
          {tab === 'channels' && (
            <div className="h-full flex flex-col">
              {/* Page indicator */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setChannelPage(Math.max(0, channelPage - 1))}
                  disabled={channelPage === 0}
                  className="w-7 h-7 rounded border flex items-center justify-center disabled:opacity-30"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.3)', color: 'white' }}>
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-bold text-white">
                  Ch {startChannel}-{endChannel} ({channelPage + 1}/{TOTAL_PAGES})
                </span>
                <button
                  onClick={() => setChannelPage(Math.min(TOTAL_PAGES - 1, channelPage + 1))}
                  disabled={channelPage >= TOTAL_PAGES - 1}
                  className="w-7 h-7 rounded border flex items-center justify-center disabled:opacity-30"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.3)', color: 'white' }}>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Channel grid */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(10, 1fr)',
                  gap: '4px',
                  flex: 1,
                  userSelect: 'none'
                }}
                onMouseLeave={handleDragEnd}>
                {Array.from({ length: Math.min(CHANNELS_PER_PAGE, 512 - startChannel + 1) }, (_, i) => startChannel + i).map(ch => {
                  const isSelected = selectedChannels.includes(ch);
                  const isConflict = activeChannels[ch];
                  return (
                    <button
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      onMouseDown={(e) => handleDragStart(ch, e)}
                      onMouseEnter={() => handleDragOver(ch)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleDragStart(ch, e);
                      }}
                      onTouchMove={(e) => {
                        e.preventDefault();
                        const touch = e.touches[0];
                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        if (element && element.dataset.channel) {
                          handleDragOver(parseInt(element.dataset.channel));
                        }
                      }}
                      data-channel={ch}
                      style={{
                        backgroundColor: isSelected 
                          ? 'var(--theme-primary)' 
                          : isConflict 
                          ? 'rgba(255, 165, 0, 0.3)'
                          : 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: isConflict ? '2px solid #ffa500' : '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isDragging ? (dragMode === 'select' ? 'cell' : 'not-allowed') : 'pointer',
                        transition: isDragging ? 'none' : 'all 0.15s',
                        position: 'relative'
                      }}>
                      {ch}
                      {isConflict && (
                        <div style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: '#ffa500'
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-[9px] text-white/50 text-center mt-1">
                Click • Drag to select/unselect
              </p>
            </div>
          )}

          {/* Fixtures/Groups tabs */}
          {tab === 'fixtures' && (
            <div className="h-full overflow-y-auto">
              {fixtures.length === 0 ? (
                <div className="text-center text-white/60 py-16">
                  <Package size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No fixtures</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {fixtures.map(fixture => {
                    const isSelected = selectedFixtures.includes(fixture.id);
                    return (
                      <button
                        key={fixture.id}
                        onClick={() => toggleFixture(fixture.id)}
                        className="p-2 rounded border text-left"
                        style={{
                          borderColor: isSelected ? 'var(--theme-primary)' : 'rgba(255, 255, 255, 0.2)',
                          background: isSelected ? 'rgba(var(--theme-primary-rgb), 0.2)' : 'rgba(255, 255, 255, 0.05)'
                        }}>
                        <p className="font-bold text-white text-xs truncate">{fixture.name}</p>
                        <p className="text-[9px] text-white/60">Ch {fixture.startAddress}-{fixture.endAddress}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'groups' && (
            <div className="h-full overflow-y-auto">
              {groups.length === 0 ? (
                <div className="text-center text-white/60 py-16">
                  <Users size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No groups</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {groups.map(group => {
                    const isSelected = selectedGroups.includes(group.id);
                    return (
                      <button
                        key={group.id}
                        onClick={() => toggleGroup(group.id)}
                        className="p-2 rounded border text-left"
                        style={{
                          borderColor: isSelected ? group.color : 'rgba(255, 255, 255, 0.2)',
                          background: isSelected ? `${group.color}30` : 'rgba(255, 255, 255, 0.05)'
                        }}>
                        <p className="font-bold text-white text-xs truncate">{group.name}</p>
                        <p className="text-[9px] text-white/60">{group.channels.length} ch</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - FIXED at bottom */}
        <div className="px-3 py-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
          {conflicts.length > 0 && showConfirm && (
            <div className="mb-2 p-1.5 rounded bg-red-500/10 border border-red-500/30 flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-1 rounded border text-white text-xs font-bold"
                style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                Cancel
              </button>
              <button
                onClick={handleActivate}
                className="flex-1 py-1 rounded text-white text-xs font-bold"
                style={{ background: '#ef4444' }}>
                Override
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded border text-white text-sm font-bold"
              style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
              Cancel
            </button>
            <button
              onClick={handleActivate}
              disabled={getAffectedChannels().length === 0}
              className="flex-1 py-2 rounded text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-1"
              style={{ background: 'var(--theme-primary)' }}>
              <Play size={14} />
              Activate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
