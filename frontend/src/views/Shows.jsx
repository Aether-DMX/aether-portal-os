import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Play, Pause, Square, Trash2, Clock, Film, FastForward, Rewind, ChevronLeft, ChevronRight, Shuffle, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8891';

export default function Shows() {
  const navigate = useNavigate();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingShow, setPlayingShow] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [tempo, setTempo] = useState(1.0);
  const [showCreator, setShowCreator] = useState(false);
  const [newShow, setNewShow] = useState({ name: '', description: '', timeline: [] });
  const [scenes, setScenes] = useState([]);
  const [chases, setChases] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);

  const SHOWS_PER_PAGE = 6;
  const totalPages = Math.ceil(shows.length / SHOWS_PER_PAGE);
  const paginatedShows = shows.slice(currentPage * SHOWS_PER_PAGE, (currentPage + 1) * SHOWS_PER_PAGE);

  useEffect(() => { fetchShows(); fetchScenes(); fetchChases(); }, []);

  const fetchShows = async () => {
    try { const res = await fetch(`${API}/api/shows`); setShows(await res.json()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  const fetchScenes = async () => { try { setScenes(await (await fetch(`${API}/api/scenes`)).json()); } catch (err) {} };
  const fetchChases = async () => { try { setChases(await (await fetch(`${API}/api/chases`)).json()); } catch (err) {} };

  const playShow = async (show) => {
    await fetch(`${API}/api/shows/${show.show_id}/play`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    setPlayingShow(show); setIsPaused(false); setTempo(1.0);
  };
  const pauseShow = async () => { await fetch(`${API}/api/shows/pause`, { method: 'POST' }); setIsPaused(true); };
  const resumeShow = async () => { await fetch(`${API}/api/shows/resume`, { method: 'POST' }); setIsPaused(false); };
  const stopShow = async () => { await fetch(`${API}/api/shows/stop`, { method: 'POST' }); setPlayingShow(null); setIsPaused(false); };
  const setTempoValue = async (t) => { setTempo(t); await fetch(`${API}/api/shows/tempo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tempo: t }) }); };
  const adjustTempo = (delta) => setTempoValue(Math.max(0.25, Math.min(4.0, tempo + delta)));
  
  const toggleDistributed = async (show) => {
    const newVal = show.distributed ? 0 : 1;
    await fetch(`${API}/api/shows/${show.show_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ distributed: newVal }) });
    fetchShows();
  };

  const deleteShow = async (id) => { if (!confirm('Delete?')) return; await fetch(`${API}/api/shows/${id}`, { method: 'DELETE' }); fetchShows(); };
  const saveShow = async () => {
    if (!newShow.name.trim()) return;
    await fetch(`${API}/api/shows`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newShow) });
    setShowCreator(false); setNewShow({ name: '', description: '', timeline: [] }); fetchShows();
  };
  const addEvent = (type, id, name) => {
    const lastTime = newShow.timeline.length > 0 ? Math.max(...newShow.timeline.map(e => e.time_ms)) + 5000 : 0;
    setNewShow({ ...newShow, timeline: [...newShow.timeline, { type, [`${type}_id`]: id, name, time_ms: lastTime, fade_ms: 1000 }] });
  };
  const removeEvent = (i) => setNewShow({ ...newShow, timeline: newShow.timeline.filter((_, idx) => idx !== i) });
  const updateTime = (i, ms) => { const t = [...newShow.timeline]; t[i].time_ms = parseInt(ms) || 0; setNewShow({ ...newShow, timeline: t }); };
  const fmt = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0f' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', marginRight: 12, cursor: 'pointer' }}><ArrowLeft size={22} /></button>
        <Film size={20} style={{ color: '#8b5cf6', marginRight: 8 }} />
        <h1 style={{ color: 'white', fontSize: 18, fontWeight: 600, flex: 1 }}>Shows</h1>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginRight: 12 }}>{shows.length} saved</span>
        <button onClick={() => setShowCreator(true)} style={{ background: '#8b5cf6', border: 'none', borderRadius: 8, padding: '6px 14px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}><Plus size={16} /> New</button>
      </div>

      {/* Shows Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {loading ? <div style={{ color: 'white', textAlign: 'center', padding: 40 }}>Loading...</div> : shows.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 40 }}><Film size={48} style={{ marginBottom: 16, opacity: 0.3 }} /><p>No shows yet</p></div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {paginatedShows.map((show) => (
                <div key={show.show_id} style={{ background: playingShow?.show_id === show.show_id ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${playingShow?.show_id === show.show_id ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: 10, position: 'relative' }}>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: 13, marginBottom: 4, paddingRight: 36 }}>{show.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><Clock size={10} />{fmt(show.duration_ms)}</div>
                  
                  {/* Distributed toggle */}
                  <button onClick={() => toggleDistributed(show)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, background: show.distributed ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.1)', color: show.distributed ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}>
                    {show.distributed ? <><Shuffle size={10} /> Stagger</> : <><Copy size={10} /> Sync</>}
                  </button>

                  {/* Play button */}
                  <button onClick={() => playingShow?.show_id === show.show_id ? stopShow() : playShow(show)} style={{ position: 'absolute', top: 8, right: 8, background: playingShow?.show_id === show.show_id ? '#ef4444' : '#22c55e', border: 'none', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{playingShow?.show_id === show.show_id ? <Square size={14} color="white" /> : <Play size={14} color="white" />}</button>
                  
                  {/* Delete */}
                  {playingShow?.show_id !== show.show_id && <button onClick={(e) => { e.stopPropagation(); deleteShow(show.show_id); }} style={{ position: 'absolute', bottom: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}><Trash2 size={14} color="#ef4444" /></button>}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', opacity: currentPage === 0 ? 0.3 : 1 }}><ChevronLeft size={18} /></button>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: currentPage === i ? '#8b5cf6' : 'rgba(255,255,255,0.1)', color: currentPage === i ? 'white' : 'rgba(255,255,255,0.6)' }}>{i + 1}</button>
                  ))}
                </div>
                <button onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1} style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', opacity: currentPage >= totalPages - 1 ? 0.3 : 1 }}><ChevronRight size={18} /></button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed Player at Bottom */}
      {playingShow && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,20,30,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 16, padding: '10px 16px', zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ minWidth: 100 }}>
              <div style={{ color: 'white', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playingShow.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{isPaused ? '⏸' : '▶'} {tempo.toFixed(1)}x</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => adjustTempo(-0.25)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Rewind size={14} color="white" /></button>
              <button onClick={stopShow} style={{ background: 'rgba(239,68,68,0.3)', border: 'none', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Square size={14} color="#ef4444" /></button>
              <button onClick={() => isPaused ? resumeShow() : pauseShow()} style={{ background: isPaused ? 'rgba(34,197,94,0.4)' : 'rgba(139,92,246,0.4)', border: 'none', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{isPaused ? <Play size={18} color="#22c55e" /> : <Pause size={18} color="#a78bfa" />}</button>
              <button onClick={() => adjustTempo(0.25)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FastForward size={14} color="white" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Show Creator Modal */}
      {showCreator && (
        <div style={{ position: 'fixed', inset: 0, background: '#0a0a0f', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setShowCreator(false)} style={{ background: 'none', border: 'none', color: 'white', marginRight: 12, cursor: 'pointer' }}><ArrowLeft size={22} /></button>
            <h1 style={{ color: 'white', fontSize: 18, fontWeight: 600, flex: 1 }}>New Show</h1>
            <button onClick={saveShow} disabled={!newShow.name.trim()} style={{ background: newShow.name.trim() ? '#22c55e' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 16px', color: 'white', cursor: newShow.name.trim() ? 'pointer' : 'not-allowed', opacity: newShow.name.trim() ? 1 : 0.5, fontSize: 14 }}>Save</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            <input type="text" placeholder="Show name..." value={newShow.name} onChange={(e) => setNewShow({ ...newShow, name: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '10px 14px', color: 'white', fontSize: 15, marginBottom: 12 }} />
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ color: 'white', fontSize: 13, marginBottom: 6 }}>Timeline ({newShow.timeline.length})</h3>
              {newShow.timeline.length === 0 ? <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: 16, textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>Add scenes or chases below</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {newShow.timeline.sort((a, b) => a.time_ms - b.time_ms).map((ev, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: 6 }}>
                      <input type="number" value={ev.time_ms / 1000} onChange={(e) => updateTime(i, parseFloat(e.target.value) * 1000)} style={{ width: 50, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, padding: '3px 6px', color: 'white', textAlign: 'center', fontSize: 12 }} />
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>s</span>
                      <span style={{ color: ev.type === 'scene' ? '#22c55e' : ev.type === 'chase' ? '#f59e0b' : '#ef4444', fontSize: 10, padding: '2px 5px', background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>{ev.type}</span>
                      <span style={{ flex: 1, color: 'white', fontSize: 12 }}>{ev.name}</span>
                      <button onClick={() => removeEvent(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ color: 'white', fontSize: 13, marginBottom: 6 }}>Scenes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {scenes.map((s) => <button key={s.scene_id} onClick={() => addEvent('scene', s.scene_id, s.name)} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: 8, color: 'white', cursor: 'pointer', fontSize: 11, textAlign: 'center' }}>{s.name}</button>)}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ color: 'white', fontSize: 13, marginBottom: 6 }}>Chases</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {chases.map((c) => <button key={c.chase_id} onClick={() => addEvent('chase', c.chase_id, c.name)} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: 8, color: 'white', cursor: 'pointer', fontSize: 11, textAlign: 'center' }}>{c.name}</button>)}
              </div>
            </div>
            <button onClick={() => addEvent('blackout', null, 'Blackout')} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: 8, color: 'white', cursor: 'pointer', fontSize: 11 }}>⏻ Blackout</button>
          </div>
        </div>
      )}
    </div>
  );
}
