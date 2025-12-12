import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Play, Square, Trash2, Clock, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8891';

export default function Shows() {
  const navigate = useNavigate();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingShow, setPlayingShow] = useState(null);
  const [showCreator, setShowCreator] = useState(false);
  const [newShow, setNewShow] = useState({ name: '', description: '', timeline: [] });
  const [scenes, setScenes] = useState([]);
  const [chases, setChases] = useState([]);

  useEffect(() => {
    fetchShows();
    fetchScenes();
    fetchChases();
  }, []);

  const fetchShows = async () => {
    try {
      const res = await fetch(`${API}/api/shows`);
      const data = await res.json();
      setShows(data);
    } catch (err) {
      console.error('Failed to fetch shows:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScenes = async () => {
    try {
      const res = await fetch(`${API}/api/scenes`);
      setScenes(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchChases = async () => {
    try {
      const res = await fetch(`${API}/api/chases`);
      setChases(await res.json());
    } catch (err) { console.error(err); }
  };

  const playShow = async (show) => {
    try {
      await fetch(`${API}/api/shows/${show.show_id}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universe: 1 })
      });
      setPlayingShow(show.show_id);
    } catch (err) { console.error(err); }
  };

  const stopShow = async () => {
    try {
      await fetch(`${API}/api/shows/stop`, { method: 'POST' });
      setPlayingShow(null);
    } catch (err) { console.error(err); }
  };

  const deleteShow = async (showId) => {
    if (!confirm('Delete this show?')) return;
    try {
      await fetch(`${API}/api/shows/${showId}`, { method: 'DELETE' });
      fetchShows();
    } catch (err) { console.error(err); }
  };

  const saveShow = async () => {
    if (!newShow.name.trim()) return;
    try {
      await fetch(`${API}/api/shows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShow)
      });
      setShowCreator(false);
      setNewShow({ name: '', description: '', timeline: [] });
      fetchShows();
    } catch (err) { console.error(err); }
  };

  const addTimelineEvent = (type, id, name) => {
    const lastTime = newShow.timeline.length > 0 
      ? Math.max(...newShow.timeline.map(e => e.time_ms)) + 5000 
      : 0;
    setNewShow({
      ...newShow,
      timeline: [...newShow.timeline, {
        type,
        [`${type}_id`]: id,
        name,
        time_ms: lastTime,
        fade_ms: 1000
      }]
    });
  };

  const removeTimelineEvent = (index) => {
    setNewShow({
      ...newShow,
      timeline: newShow.timeline.filter((_, i) => i !== index)
    });
  };

  const updateEventTime = (index, time_ms) => {
    const updated = [...newShow.timeline];
    updated[index].time_ms = parseInt(time_ms) || 0;
    setNewShow({ ...newShow, timeline: updated });
  };

  const formatTime = (ms) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    return `${mins}:${(secs % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0f' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', marginRight: 12, cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <Film size={24} style={{ color: '#8b5cf6', marginRight: 8 }} />
        <h1 style={{ color: 'white', fontSize: 20, fontWeight: 600, flex: 1 }}>Shows</h1>
        <button
          onClick={() => setShowCreator(true)}
          style={{ background: '#8b5cf6', border: 'none', borderRadius: 8, padding: '8px 16px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={18} /> New
        </button>
      </div>

      {/* Shows List */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {loading ? (
          <div style={{ color: 'white', textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : shows.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 40 }}>
            <Film size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p>No shows yet. Create one to sequence scenes and chases on a timeline.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {shows.map((show) => (
              <div
                key={show.show_id}
                style={{
                  background: playingShow === show.show_id ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${playingShow === show.show_id ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontWeight: 600, marginBottom: 4 }}>{show.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={12} />
                    {formatTime(show.duration_ms)} • {show.timeline?.length || 0} events
                  </div>
                </div>
                <button
                  onClick={() => playingShow === show.show_id ? stopShow() : playShow(show)}
                  style={{
                    background: playingShow === show.show_id ? '#ef4444' : '#22c55e',
                    border: 'none',
                    borderRadius: 8,
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {playingShow === show.show_id ? <Square size={20} color="white" /> : <Play size={20} color="white" />}
                </button>
                <button
                  onClick={() => deleteShow(show.show_id)}
                  style={{
                    background: 'rgba(239,68,68,0.2)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 8,
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={18} color="#ef4444" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Show Creator Modal */}
      {showCreator && (
        <div style={{ position: 'fixed', inset: 0, background: '#0a0a0f', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setShowCreator(false)} style={{ background: 'none', border: 'none', color: 'white', marginRight: 12, cursor: 'pointer' }}>
              <ArrowLeft size={24} />
            </button>
            <h1 style={{ color: 'white', fontSize: 20, fontWeight: 600, flex: 1 }}>New Show</h1>
            <button
              onClick={saveShow}
              disabled={!newShow.name.trim()}
              style={{
                background: newShow.name.trim() ? '#22c55e' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 8,
                padding: '8px 20px',
                color: 'white',
                cursor: newShow.name.trim() ? 'pointer' : 'not-allowed',
                opacity: newShow.name.trim() ? 1 : 0.5
              }}
            >
              Save
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {/* Name Input */}
            <input
              type="text"
              placeholder="Show name..."
              value={newShow.name}
              onChange={(e) => setNewShow({ ...newShow, name: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                padding: '12px 16px',
                color: 'white',
                fontSize: 16,
                marginBottom: 16
              }}
            />

            {/* Timeline */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ color: 'white', fontSize: 14, marginBottom: 8 }}>Timeline ({newShow.timeline.length} events)</h3>
              {newShow.timeline.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, padding: 20, textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                  Add scenes or chases below to build your timeline
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {newShow.timeline.sort((a, b) => a.time_ms - b.time_ms).map((event, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 8 }}>
                      <input
                        type="number"
                        value={event.time_ms / 1000}
                        onChange={(e) => updateEventTime(idx, parseFloat(e.target.value) * 1000)}
                        style={{ width: 60, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, padding: '4px 8px', color: 'white', textAlign: 'center' }}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>s</span>
                      <span style={{ color: event.type === 'scene' ? '#22c55e' : '#f59e0b', fontSize: 11, padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
                        {event.type}
                      </span>
                      <span style={{ flex: 1, color: 'white', fontSize: 13 }}>{event.name}</span>
                      <button onClick={() => removeTimelineEvent(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Scenes */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ color: 'white', fontSize: 14, marginBottom: 8 }}>Add Scene</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {scenes.map((scene) => (
                  <button
                    key={scene.scene_id}
                    onClick={() => addTimelineEvent('scene', scene.scene_id, scene.name)}
                    style={{
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: 8,
                      padding: 10,
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: 12,
                      textAlign: 'center'
                    }}
                  >
                    {scene.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Chases */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ color: 'white', fontSize: 14, marginBottom: 8 }}>Add Chase</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {chases.map((chase) => (
                  <button
                    key={chase.chase_id}
                    onClick={() => addTimelineEvent('chase', chase.chase_id, chase.name)}
                    style={{
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: 8,
                      padding: 10,
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: 12,
                      textAlign: 'center'
                    }}
                  >
                    {chase.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Blackout */}
            <div>
              <h3 style={{ color: 'white', fontSize: 14, marginBottom: 8 }}>Add Blackout</h3>
              <button
                onClick={() => addTimelineEvent('blackout', null, 'Blackout')}
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  padding: 10,
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                ⏻ Add Blackout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
