import React, { useState, useEffect } from 'react';
import { X, History, RotateCcw, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

/**
 * VersionHistoryModal - Shows version history for looks/sequences
 *
 * Allows viewing previous versions and reverting to them.
 */
export default function VersionHistoryModal({
  isOpen,
  onClose,
  artifactId,
  artifactType, // 'look' or 'sequence'
  artifactName,
  onReverted,
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState(null);
  const [error, setError] = useState(null);
  const [confirmRevert, setConfirmRevert] = useState(null);

  // Responsive: track window width
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 800
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth >= 1024;

  // Fetch versions when modal opens
  useEffect(() => {
    if (!isOpen || !artifactId || !artifactType) return;

    const fetchVersions = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = artifactType === 'look'
          ? `/api/looks/${artifactId}/versions`
          : `/api/sequences/${artifactId}/versions`;
        const res = await axios.get(getAetherCore() + endpoint);
        setVersions(res.data.versions || []);
      } catch (err) {
        console.error('Failed to fetch versions:', err);
        setError('Failed to load version history');
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [isOpen, artifactId, artifactType]);

  const handleRevert = async (version) => {
    if (confirmRevert !== version.version_id) {
      setConfirmRevert(version.version_id);
      return;
    }

    setReverting(version.version_id);
    setError(null);
    try {
      const endpoint = artifactType === 'look'
        ? `/api/looks/${artifactId}/versions/${version.version_id}/revert`
        : `/api/sequences/${artifactId}/versions/${version.version_id}/revert`;
      await axios.post(getAetherCore() + endpoint);

      // Refresh versions list
      const refreshEndpoint = artifactType === 'look'
        ? `/api/looks/${artifactId}/versions`
        : `/api/sequences/${artifactId}/versions`;
      const res = await axios.get(getAetherCore() + refreshEndpoint);
      setVersions(res.data.versions || []);

      setConfirmRevert(null);
      if (onReverted) onReverted();
    } catch (err) {
      console.error('Failed to revert:', err);
      setError('Failed to revert to this version');
    } finally {
      setReverting(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Unknown';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-gray-900 rounded-2xl border border-white/10 overflow-hidden flex flex-col ${
          isDesktop ? 'w-[500px] max-h-[80vh]' : 'w-full max-h-[90vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b border-white/10 ${
          isDesktop ? 'p-5' : 'p-4'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <History size={20} className="text-white/70" />
            </div>
            <div>
              <h2 className={`font-bold text-white ${isDesktop ? 'text-lg' : 'text-base'}`}>
                Version History
              </h2>
              <p className="text-white/50 text-xs truncate max-w-[200px]">
                {artifactName || `${artifactType} ${artifactId}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-white/50">
              Loading versions...
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <History size={32} className="text-white/20" />
              </div>
              <p className="text-white/50 text-sm">No version history yet</p>
              <p className="text-white/30 text-xs mt-1">
                Versions are saved automatically when you edit
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version, index) => (
                <div
                  key={version.version_id}
                  className={`rounded-xl border transition-all ${
                    index === 0
                      ? 'border-[var(--theme-primary)]/30 bg-[var(--theme-primary)]/5'
                      : 'border-white/10 bg-white/5 hover:bg-white/8'
                  }`}
                >
                  <div className={`flex items-center justify-between ${
                    isDesktop ? 'p-4' : 'p-3'
                  }`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`shrink-0 rounded-lg flex items-center justify-center ${
                        isDesktop ? 'w-10 h-10' : 'w-8 h-8'
                      } ${
                        index === 0 ? 'bg-[var(--theme-primary)] text-black' : 'bg-white/10 text-white/70'
                      }`}>
                        <span className="font-mono font-bold text-sm">
                          v{version.version_number}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] font-medium">
                              LATEST
                            </span>
                          )}
                          <span className="text-white/50 text-xs truncate">
                            {version.message || 'Auto-saved'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-white/40 text-xs">
                          <Clock size={12} />
                          <span>{formatDate(version.created_at)}</span>
                          <span className="text-white/20">•</span>
                          <span>{formatTime(version.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {index > 0 && (
                      <button
                        onClick={() => handleRevert(version)}
                        disabled={reverting === version.version_id}
                        className={`shrink-0 flex items-center gap-1.5 rounded-lg font-medium transition-all ${
                          confirmRevert === version.version_id
                            ? 'bg-amber-500 text-black px-4 py-2'
                            : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white px-3 py-2'
                        } ${
                          reverting === version.version_id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {reverting === version.version_id ? (
                          <span className="text-xs">Reverting...</span>
                        ) : confirmRevert === version.version_id ? (
                          <>
                            <AlertTriangle size={14} />
                            <span className="text-xs">Confirm?</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw size={14} />
                            <span className="text-xs">Revert</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t border-white/10 ${isDesktop ? 'p-4' : 'p-3'}`}>
          <p className="text-white/30 text-xs text-center">
            Up to 20 versions are kept automatically
          </p>
        </div>
      </div>
    </div>
  );
}
