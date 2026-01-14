import React, { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb, FolderOpen, RefreshCw, AlertCircle, CheckCircle,
  Zap, Hash, Layers
} from 'lucide-react';

// Haptic feedback helper
const haptic = (pattern = 10) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

// Fixture Status Card
function FixtureCard({ fixture, onIdentify, isIdentifying }) {
  // Determine fixture health
  const hasError = fixture.error || fixture.fault;
  const isResponding = fixture.responding !== false;

  let statusColor = '#22c55e';
  let statusText = 'OK';

  if (hasError) {
    statusColor = '#ef4444';
    statusText = 'Error';
  } else if (!isResponding) {
    statusColor = '#f59e0b';
    statusText = 'No Response';
  }

  // Get fixture type icon and color
  const getFixtureTypeInfo = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('rgb') || t.includes('color')) {
      return { color: '#a855f7', label: 'RGB' };
    }
    if (t.includes('dimmer') || t.includes('dim')) {
      return { color: '#f59e0b', label: 'Dimmer' };
    }
    if (t.includes('moving') || t.includes('scanner')) {
      return { color: '#3b82f6', label: 'Moving' };
    }
    if (t.includes('strobe')) {
      return { color: '#ef4444', label: 'Strobe' };
    }
    return { color: '#6b7280', label: type || 'Generic' };
  };

  const typeInfo = getFixtureTypeInfo(fixture.type);

  return (
    <div className={`fixture-card ${hasError ? 'error' : ''} ${isIdentifying ? 'identifying' : ''}`}>
      {/* Status indicator */}
      <div className="fixture-status-bar" style={{ background: statusColor }} />

      <div className="fixture-card-content">
        {/* Header */}
        <div className="fixture-header">
          <div className="fixture-icon" style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}>
            <Lightbulb size={18} />
          </div>
          <div className="fixture-info">
            <div className="fixture-name">{fixture.name || `Fixture ${fixture.id}`}</div>
            <div className="fixture-type-badge" style={{ color: typeInfo.color }}>
              {typeInfo.label}
            </div>
          </div>
          <div className="fixture-status" style={{ color: statusColor }}>
            {hasError ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          </div>
        </div>

        {/* Details */}
        <div className="fixture-details">
          <div className="detail-item">
            <Hash size={12} />
            <span>Ch {fixture.start_channel || fixture.channel || '?'}</span>
          </div>
          {fixture.channels_count && (
            <div className="detail-item">
              <Layers size={12} />
              <span>{fixture.channels_count} ch</span>
            </div>
          )}
          {fixture.universe && (
            <div className="detail-item">
              <Zap size={12} />
              <span>U{fixture.universe}</span>
            </div>
          )}
        </div>

        {/* Identify button */}
        <button
          className={`identify-btn ${isIdentifying ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            haptic(50);
            onIdentify(fixture);
          }}
        >
          <Lightbulb size={14} />
          {isIdentifying ? 'Blinking...' : 'Identify'}
        </button>
      </div>
    </div>
  );
}

// Group Card
function GroupCard({ group }) {
  const fixtureCount = group.fixtures?.length || group.fixture_count || 0;

  return (
    <div className="group-card">
      <div className="group-icon">
        <FolderOpen size={18} />
      </div>
      <div className="group-info">
        <div className="group-name">{group.name}</div>
        <div className="group-count">{fixtureCount} fixtures</div>
      </div>
    </div>
  );
}

export default function MobileFixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [identifyingId, setIdentifyingId] = useState(null);
  const backendUrl = `http://${window.location.hostname}:8891`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fixturesRes, groupsRes] = await Promise.all([
        fetch(backendUrl + '/api/fixtures'),
        fetch(backendUrl + '/api/groups')
      ]);
      const [fixturesData, groupsData] = await Promise.all([
        fixturesRes.json(),
        groupsRes.json()
      ]);
      setFixtures(fixturesData);
      setGroups(groupsData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [backendUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleIdentify = async (fixture) => {
    setIdentifyingId(fixture.id);
    haptic([50, 100, 50]); // Pattern feedback

    try {
      await fetch(`${backendUrl}/api/fixtures/${fixture.id}/identify`, { method: 'POST' });
      // Auto-stop after 3 seconds
      setTimeout(() => {
        setIdentifyingId(null);
      }, 3000);
    } catch (e) {
      console.error('Failed to identify fixture:', e);
      setIdentifyingId(null);
    }
  };

  // Calculate stats
  const totalFixtures = fixtures.length;
  const errorCount = fixtures.filter(f => f.error || f.fault).length;
  const totalChannels = fixtures.reduce((sum, f) => sum + (f.channels_count || 1), 0);

  return (
    <div className="mobile-fixtures-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title-row">
          <h1 className="dashboard-title">Fixtures</h1>
          <button
            onClick={() => { haptic(); fetchData(); }}
            className="refresh-btn"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
        <p className="dashboard-subtitle">Status only - patch on desktop</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-card">
        <div className="stat">
          <span className="stat-value">{totalFixtures}</span>
          <span className="stat-label">Fixtures</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-value" style={{ color: 'var(--accent, #a855f7)' }}>{groups.length}</span>
          <span className="stat-label">Groups</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-value">{totalChannels}</span>
          <span className="stat-label">Channels</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-value" style={{ color: errorCount > 0 ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>
            {errorCount}
          </span>
          <span className="stat-label">Errors</span>
        </div>
      </div>

      {/* Groups Section */}
      {groups.length > 0 && (
        <div className="section">
          <div className="section-header">
            <span className="section-title">Groups</span>
            <span className="section-count">{groups.length}</span>
          </div>
          <div className="groups-grid">
            {groups.map(group => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}

      {/* Fixtures Section */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">All Fixtures</span>
          <span className="section-count">{fixtures.length}</span>
        </div>

        {fixtures.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Lightbulb size={32} />
            </div>
            <p className="empty-text">No fixtures patched</p>
            <p className="empty-subtext">Patch fixtures on desktop to see them here</p>
          </div>
        ) : (
          <div className="fixtures-list">
            {fixtures.map(fixture => (
              <FixtureCard
                key={fixture.id}
                fixture={fixture}
                onIdentify={handleIdentify}
                isIdentifying={identifyingId === fixture.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Styles */}
      <style>{`
        .mobile-fixtures-dashboard {
          padding: 16px;
          padding-bottom: 100px;
          min-height: 100%;
        }

        .dashboard-header {
          margin-bottom: 20px;
        }

        .header-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dashboard-title {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .dashboard-subtitle {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          margin: 4px 0 0 0;
        }

        .refresh-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: none;
          color: rgba(255,255,255,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-btn:active {
          background: rgba(255,255,255,0.2);
          transform: scale(0.95);
        }

        .refresh-btn:disabled {
          opacity: 0.5;
        }

        .refresh-btn .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Stats Card */
        .stats-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 24px;
        }

        .stat {
          flex: 1;
          text-align: center;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          display: block;
        }

        .stat-label {
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .stat-divider {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,0.1);
        }

        /* Sections */
        .section {
          margin-bottom: 24px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .section-count {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
        }

        /* Groups Grid */
        .groups-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .group-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-radius: 10px;
        }

        .group-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(168, 85, 247, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a855f7;
        }

        .group-info {
          flex: 1;
          min-width: 0;
        }

        .group-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .group-count {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
        }

        /* Fixtures List */
        .fixtures-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Fixture Card */
        .fixture-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .fixture-card.error {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.05);
        }

        .fixture-card.identifying {
          border-color: rgba(59, 130, 246, 0.5);
          animation: identifyPulse 0.5s ease-in-out infinite;
        }

        @keyframes identifyPulse {
          0%, 100% { background: rgba(59, 130, 246, 0.05); }
          50% { background: rgba(59, 130, 246, 0.15); }
        }

        .fixture-status-bar {
          height: 3px;
          width: 100%;
        }

        .fixture-card-content {
          padding: 12px;
        }

        .fixture-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .fixture-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .fixture-info {
          flex: 1;
          min-width: 0;
        }

        .fixture-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fixture-type-badge {
          font-size: 11px;
          font-weight: 500;
        }

        .fixture-status {
          flex-shrink: 0;
        }

        .fixture-details {
          display: flex;
          gap: 12px;
          margin-bottom: 10px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }

        .identify-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 10px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          color: #3b82f6;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .identify-btn:active {
          background: rgba(59, 130, 246, 0.2);
          transform: scale(0.98);
        }

        .identify-btn.active {
          background: rgba(59, 130, 246, 0.3);
          animation: btnPulse 0.5s ease-in-out infinite;
        }

        @keyframes btnPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.2);
          margin-bottom: 16px;
        }

        .empty-text {
          font-size: 16px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          margin: 0 0 4px 0;
        }

        .empty-subtext {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          margin: 0;
        }
      `}</style>
    </div>
  );
}
