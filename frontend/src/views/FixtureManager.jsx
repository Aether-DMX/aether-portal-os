/**
 * FixtureManager - Unified fixture configuration UI
 *
 * Features:
 * - View and manage fixture instances
 * - Import from Open Fixture Library (15,000+ fixtures)
 * - Auto-configure from RDM devices
 * - Intelligent color application
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Search, Download, Wifi, WifiOff, Zap, Trash2,
  ChevronRight, Lightbulb, Settings, Database, RefreshCw, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import useFixtureStore from '../store/fixtureStore';
import useFixtureLibraryStore from '../store/fixtureLibraryStore';
import useRdmStore from '../store/rdmStore';
import useNodeStore from '../store/nodeStore';

// Category icons and colors
const CATEGORY_CONFIG = {
  dimmer: { color: '#f59e0b', label: 'Dimmer' },
  par: { color: '#22c55e', label: 'Par' },
  wash: { color: '#06b6d4', label: 'Wash' },
  moving_head: { color: '#a855f7', label: 'Moving Head' },
  strobe: { color: '#ef4444', label: 'Strobe' },
  generic: { color: '#64748b', label: 'Generic' }
};

export default function FixtureManager() {
  const navigate = useNavigate();

  // Stores
  const { fixtures, fetchFixtures, addFixture, removeFixture } = useFixtureStore();
  const {
    profiles, fetchProfiles, searchOFL, oflSearchResults,
    importFromOFL, autoConfigureFromRDM, loading
  } = useFixtureLibraryStore();
  const { devices: rdmDevices, fetchDevices: fetchRdmDevices } = useRdmStore();
  const { nodes } = useNodeStore();

  // Local state
  const [activeTab, setActiveTab] = useState('fixtures'); // fixtures, library, rdm
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [oflQuery, setOflQuery] = useState('');

  // New fixture form
  const [newFixture, setNewFixture] = useState({
    name: '',
    profile_id: 'generic-rgbw',
    mode_id: '4ch',
    universe: 1,
    start_channel: 1,
    group: ''
  });

  // Load data on mount
  useEffect(() => {
    fetchFixtures();
    fetchProfiles();
    fetchRdmDevices();
  }, []);

  // OFL search with debounce
  useEffect(() => {
    if (oflQuery.length >= 2) {
      const timer = setTimeout(() => searchOFL(oflQuery), 300);
      return () => clearTimeout(timer);
    }
  }, [oflQuery]);

  // Filter fixtures by search
  const filteredFixtures = useMemo(() => {
    if (!searchQuery) return fixtures;
    const q = searchQuery.toLowerCase();
    return fixtures.filter(f =>
      f.name?.toLowerCase().includes(q) ||
      f.manufacturer?.toLowerCase().includes(q) ||
      f.model?.toLowerCase().includes(q)
    );
  }, [fixtures, searchQuery]);

  // Group fixtures by universe
  const fixturesByUniverse = useMemo(() => {
    const groups = {};
    filteredFixtures.forEach(f => {
      const u = f.universe || 1;
      if (!groups[u]) groups[u] = [];
      groups[u].push(f);
    });
    return groups;
  }, [filteredFixtures]);

  // Handle add fixture
  const handleAddFixture = async () => {
    if (!newFixture.name) {
      toast.error('Name required');
      return;
    }

    const profile = profiles.find(p => p.profile_id === newFixture.profile_id);
    const mode = profile?.modes.find(m => m.mode_id === newFixture.mode_id);

    const fixtureData = {
      name: newFixture.name,
      type: profile?.category || 'generic',
      manufacturer: profile?.manufacturer || 'Generic',
      model: profile?.model || 'Fixture',
      universe: newFixture.universe,
      start_channel: newFixture.start_channel,
      channel_count: mode?.channel_count || 4,
      profile_id: newFixture.profile_id,
      group: newFixture.group
    };

    try {
      await addFixture(fixtureData);
      toast.success(`Added ${newFixture.name}`);
      setShowAddModal(false);
      setNewFixture({
        name: '',
        profile_id: 'generic-rgbw',
        mode_id: '4ch',
        universe: 1,
        start_channel: 1,
        group: ''
      });
    } catch (err) {
      toast.error('Failed to add fixture');
    }
  };

  // Handle OFL import
  const handleOFLImport = async (result) => {
    const [manufacturer, fixture] = result.key.split('/');
    const response = await importFromOFL(manufacturer, fixture);
    if (response.success) {
      toast.success(`Imported ${response.model}`);
      fetchProfiles();
    } else {
      toast.error('Import failed');
    }
  };

  // Handle RDM auto-configure
  const handleRDMAutoConfig = async (device) => {
    const response = await autoConfigureFromRDM(device.uid);
    if (response.success) {
      toast.success(`Configured ${response.fixture.name}`);
      fetchFixtures();
    } else {
      toast.error('Auto-configure failed');
    }
  };

  // Handle delete fixture
  const handleDeleteFixture = async (fixtureId, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await removeFixture(fixtureId);
      toast.success('Deleted');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="fixture-manager">
      {/* Header */}
      <div className="fm-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>Fixture Manager</h1>
        <button className="add-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="fm-tabs">
        <button
          className={`tab ${activeTab === 'fixtures' ? 'active' : ''}`}
          onClick={() => setActiveTab('fixtures')}
        >
          <Lightbulb size={16} />
          <span>Fixtures</span>
          <span className="count">{fixtures.length}</span>
        </button>
        <button
          className={`tab ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <Database size={16} />
          <span>Library</span>
        </button>
        <button
          className={`tab ${activeTab === 'rdm' ? 'active' : ''}`}
          onClick={() => setActiveTab('rdm')}
        >
          <Wifi size={16} />
          <span>RDM</span>
          <span className="count">{rdmDevices.length}</span>
        </button>
      </div>

      {/* Search */}
      <div className="fm-search">
        <Search size={16} />
        <input
          type="text"
          placeholder={activeTab === 'library' ? 'Search Open Fixture Library...' : 'Search fixtures...'}
          value={activeTab === 'library' ? oflQuery : searchQuery}
          onChange={(e) => activeTab === 'library' ? setOflQuery(e.target.value) : setSearchQuery(e.target.value)}
        />
      </div>

      {/* Content */}
      <div className="fm-content">
        {/* Fixtures Tab */}
        {activeTab === 'fixtures' && (
          <div className="fixtures-list">
            {Object.entries(fixturesByUniverse).map(([universe, uFixtures]) => (
              <div key={universe} className="universe-group">
                <div className="universe-header">
                  <span className="u-label">Universe {universe}</span>
                  <span className="u-count">{uFixtures.length} fixtures</span>
                </div>
                {uFixtures.sort((a, b) => a.start_channel - b.start_channel).map(fixture => {
                  const catConfig = CATEGORY_CONFIG[fixture.type] || CATEGORY_CONFIG.generic;
                  return (
                    <div key={fixture.fixture_id} className="fixture-card">
                      <div className="fixture-icon" style={{ background: catConfig.color }}>
                        <Lightbulb size={18} />
                      </div>
                      <div className="fixture-info">
                        <div className="fixture-name">{fixture.name}</div>
                        <div className="fixture-meta">
                          {fixture.manufacturer} {fixture.model} &bull; Ch {fixture.start_channel}-{fixture.end_channel}
                        </div>
                      </div>
                      <div className="fixture-actions">
                        <button className="action-btn" onClick={() => handleDeleteFixture(fixture.fixture_id, fixture.name)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {fixtures.length === 0 && (
              <div className="empty-state">
                <Lightbulb size={48} opacity={0.3} />
                <p>No fixtures configured</p>
                <button onClick={() => setShowAddModal(true)}>Add Fixture</button>
              </div>
            )}
          </div>
        )}

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="library-content">
            {/* OFL Search Results */}
            {oflQuery.length >= 2 && (
              <div className="ofl-results">
                <div className="section-header">
                  <span>Open Fixture Library Results</span>
                  {loading && <RefreshCw size={14} className="spin" />}
                </div>
                {oflSearchResults.map(result => (
                  <div key={result.key} className="ofl-result">
                    <div className="result-info">
                      <div className="result-name">{result.name}</div>
                      <div className="result-meta">{result.manufacturer}</div>
                    </div>
                    <button className="import-btn" onClick={() => handleOFLImport(result)}>
                      <Download size={14} />
                      Import
                    </button>
                  </div>
                ))}
                {oflSearchResults.length === 0 && !loading && (
                  <p className="no-results">No results found</p>
                )}
              </div>
            )}

            {/* Local Profiles */}
            <div className="local-profiles">
              <div className="section-header">
                <span>Installed Profiles</span>
                <span className="count">{profiles.length}</span>
              </div>
              {profiles.map(profile => {
                const catConfig = CATEGORY_CONFIG[profile.category] || CATEGORY_CONFIG.generic;
                return (
                  <div key={profile.profile_id} className="profile-card">
                    <div className="profile-icon" style={{ background: catConfig.color }}>
                      <Lightbulb size={16} />
                    </div>
                    <div className="profile-info">
                      <div className="profile-name">{profile.model}</div>
                      <div className="profile-meta">
                        {profile.manufacturer} &bull; {profile.modes.length} mode{profile.modes.length !== 1 ? 's' : ''}
                        {profile.source === 'ofl' && <span className="ofl-badge">OFL</span>}
                      </div>
                    </div>
                    <ChevronRight size={16} opacity={0.5} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RDM Tab */}
        {activeTab === 'rdm' && (
          <div className="rdm-content">
            <div className="section-header">
              <span>Discovered RDM Devices</span>
              <button className="refresh-btn" onClick={fetchRdmDevices}>
                <RefreshCw size={14} />
              </button>
            </div>
            {rdmDevices.map(device => {
              const hasFixture = fixtures.some(f => f.rdm_uid === device.uid);
              return (
                <div key={device.uid} className="rdm-device">
                  <div className="rdm-icon">
                    {device.last_seen ? <Wifi size={18} /> : <WifiOff size={18} />}
                  </div>
                  <div className="rdm-info">
                    <div className="rdm-name">{device.device_label || `Device ${device.uid.slice(-6)}`}</div>
                    <div className="rdm-meta">
                      UID: {device.uid} &bull; DMX {device.dmx_address} &bull; {device.dmx_footprint}ch
                    </div>
                  </div>
                  {hasFixture ? (
                    <div className="configured-badge">
                      <Check size={14} />
                      Configured
                    </div>
                  ) : (
                    <button className="auto-config-btn" onClick={() => handleRDMAutoConfig(device)}>
                      <Zap size={14} />
                      Auto-Configure
                    </button>
                  )}
                </div>
              );
            })}
            {rdmDevices.length === 0 && (
              <div className="empty-state">
                <Wifi size={48} opacity={0.3} />
                <p>No RDM devices found</p>
                <p className="hint">Run RDM discovery from Node Management</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Fixture Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Fixture</h2>
              <button onClick={() => setShowAddModal(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newFixture.name}
                  onChange={(e) => setNewFixture({ ...newFixture, name: e.target.value })}
                  placeholder="e.g., Front Wash 1"
                />
              </div>

              <div className="form-group">
                <label>Profile</label>
                <select
                  value={newFixture.profile_id}
                  onChange={(e) => {
                    const profile = profiles.find(p => p.profile_id === e.target.value);
                    setNewFixture({
                      ...newFixture,
                      profile_id: e.target.value,
                      mode_id: profile?.modes[0]?.mode_id || 'default'
                    });
                  }}
                >
                  {profiles.map(p => (
                    <option key={p.profile_id} value={p.profile_id}>
                      {p.manufacturer} {p.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Mode</label>
                <select
                  value={newFixture.mode_id}
                  onChange={(e) => setNewFixture({ ...newFixture, mode_id: e.target.value })}
                >
                  {profiles.find(p => p.profile_id === newFixture.profile_id)?.modes.map(m => (
                    <option key={m.mode_id} value={m.mode_id}>
                      {m.name} ({m.channel_count}ch)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Universe</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newFixture.universe}
                    onChange={(e) => setNewFixture({ ...newFixture, universe: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="form-group">
                  <label>Start Channel</label>
                  <input
                    type="number"
                    min="1"
                    max="512"
                    value={newFixture.start_channel}
                    onChange={(e) => setNewFixture({ ...newFixture, start_channel: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Group (optional)</label>
                <input
                  type="text"
                  value={newFixture.group}
                  onChange={(e) => setNewFixture({ ...newFixture, group: e.target.value })}
                  placeholder="e.g., Stage Left, Truss 1"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="confirm-btn" onClick={handleAddFixture}>Add Fixture</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .fixture-manager {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0a0a0f;
          color: white;
        }

        .fm-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .fm-header h1 {
          flex: 1;
          font-size: 18px;
          font-weight: 700;
        }

        .back-btn, .add-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .add-btn {
          background: var(--accent, #06b6d4);
        }

        .fm-tabs {
          display: flex;
          gap: 4px;
          padding: 8px 16px;
          background: rgba(255,255,255,0.02);
        }

        .tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .tab.active {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .tab .count {
          background: rgba(255,255,255,0.15);
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 11px;
        }

        .fm-search {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 12px 16px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.06);
          border-radius: 10px;
        }

        .fm-search input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 14px;
          outline: none;
        }

        .fm-content {
          flex: 1;
          overflow-y: auto;
          padding: 0 16px 16px;
        }

        /* Fixtures List */
        .universe-group {
          margin-bottom: 16px;
        }

        .universe-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .fixture-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          margin-bottom: 8px;
        }

        .fixture-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fixture-info {
          flex: 1;
        }

        .fixture-name {
          font-weight: 600;
          font-size: 14px;
        }

        .fixture-meta {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          margin-top: 2px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: rgba(255,255,255,0.06);
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
        }

        .action-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        /* Library */
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ofl-result, .profile-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.04);
          border-radius: 8px;
          margin-bottom: 6px;
        }

        .result-info, .profile-info {
          flex: 1;
        }

        .result-name, .profile-name {
          font-weight: 600;
          font-size: 13px;
        }

        .result-meta, .profile-meta {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          margin-top: 2px;
        }

        .ofl-badge {
          display: inline-block;
          padding: 1px 5px;
          background: rgba(6, 182, 212, 0.2);
          color: #06b6d4;
          border-radius: 4px;
          font-size: 9px;
          margin-left: 6px;
        }

        .import-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          background: var(--accent, #06b6d4);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .profile-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* RDM */
        .rdm-device {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          margin-bottom: 8px;
        }

        .rdm-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rdm-info {
          flex: 1;
        }

        .rdm-name {
          font-weight: 600;
          font-size: 14px;
        }

        .rdm-meta {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          margin-top: 2px;
        }

        .auto-config-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: rgba(168, 85, 247, 0.2);
          border: none;
          border-radius: 8px;
          color: #a855f7;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .configured-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          background: rgba(34, 197, 94, 0.15);
          border-radius: 6px;
          color: #22c55e;
          font-size: 12px;
          font-weight: 600;
        }

        .refresh-btn {
          padding: 4px 8px;
          background: rgba(255,255,255,0.1);
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 48px 16px;
          color: rgba(255,255,255,0.5);
        }

        .empty-state p {
          margin: 12px 0;
        }

        .empty-state .hint {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
        }

        .empty-state button {
          padding: 10px 20px;
          background: var(--accent, #06b6d4);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .modal {
          width: 100%;
          max-width: 400px;
          background: #1a1a24;
          border-radius: 16px;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 700;
        }

        .modal-header button {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
        }

        .modal-body {
          padding: 16px;
        }

        .form-group {
          margin-bottom: 14px;
        }

        .form-group label {
          display: block;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 6px;
        }

        .form-group input, .form-group select {
          width: 100%;
          padding: 10px 12px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 14px;
        }

        .form-row {
          display: flex;
          gap: 12px;
        }

        .form-row .form-group {
          flex: 1;
        }

        .modal-footer {
          display: flex;
          gap: 10px;
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .cancel-btn, .confirm-btn {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: none;
          font-weight: 600;
          cursor: pointer;
        }

        .cancel-btn {
          background: rgba(255,255,255,0.08);
          color: white;
        }

        .confirm-btn {
          background: var(--accent, #06b6d4);
          color: white;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .no-results {
          text-align: center;
          padding: 20px;
          color: rgba(255,255,255,0.4);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
