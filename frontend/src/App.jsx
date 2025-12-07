import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import ChatModal from './components/ChatModal';
import Dashboard from './views/Dashboard';
import LiveDMXMenu from './views/LiveDMXMenu';
import Console from './views/Console';
import DMXEffectsMenu from './views/DMXEffectsMenu';
import MyEffects from './views/MyEffects';
import FixturesMenu from './views/FixturesMenu';
import SchedulesMenu from './views/SchedulesMenu';
import Faders from './views/Faders';
import ViewLive from './views/ViewLive';
import Scenes from './views/Scenes';
import Groups from './views/Groups';
import Chases from './views/Chases';
import SceneCreator from './views/SceneCreator';
import ChaseCreator from './views/ChaseCreator';
import PatchFixtures from './views/PatchFixtures';
import GroupFixtures from './views/GroupFixtures';
import Schedules from './views/Schedules';
import Timers from './views/Timers';
import NodeManagement from './components/NodeManagement';
import Settings from './views/Settings';
import MobileAI from './views/MobileAI';
import Screensaver from './components/Screensaver';
import useDMXStore from './store/dmxStore';
import useUIStore from './store/uiStore';
import useSceneStore from './store/sceneStore';
import useChaseStore from './store/chaseStore';
import useNodeStore from './store/nodeStore';
import useBackgroundStore from './store/backgroundStore';
import useAuthStore from './store/authStore';
import useAIStore from './store/aiStore';
import { useFixtureStore } from './store/fixtureStore';
import AetherBackground from './components/AetherBackground';

function AppContent({ onLock }) {
  const { currentUniverse } = useDMXStore();
  const [showAIModal, setShowAIModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gradient-primary relative">
      <AetherBackground />

      <Header
        currentUniverse={currentUniverse}
        onLock={onLock}
        onAIClick={() => setShowAIModal(true)}
      />

      <main className="flex-1 relative z-10 overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live-dmx" element={<LiveDMXMenu />} />
          <Route path="/console" element={<Console />} />
          <Route path="/dmx-effects" element={<DMXEffectsMenu />} />
          <Route path="/my-effects" element={<MyEffects />} />
          <Route path="/fixtures-menu" element={<FixturesMenu />} />
          <Route path="/schedules-menu" element={<SchedulesMenu />} />
          <Route path="/faders" element={<Faders currentPage={currentPage} />} />
          <Route path="/view-live" element={<ViewLive />} />
          <Route path="/scenes" element={<Scenes />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/chases" element={<Chases />} />
          <Route path="/scene-creator" element={<SceneCreator />} />
          <Route path="/chase-creator" element={<ChaseCreator />} />
          <Route path="/patch-fixtures" element={<PatchFixtures />} />
          <Route path="/group-fixtures" element={<GroupFixtures />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/timers" element={<Timers />} />
          <Route path="/nodes" element={<NodeManagement />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/aether-ai" element={<MobileAI />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {showAIModal && <ChatModal onClose={() => setShowAIModal(false)} />}
    </div>
  );
}

function App() {
  const { theme } = useUIStore();
  const { initializeSampleData: initScenes } = useSceneStore();
  const { initializeSampleData: initChases } = useChaseStore();
  const { fetchNodes } = useNodeStore();

  const [screensaverActive, setScreensaverActive] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const SCREENSAVER_TIMEOUT = 5 * 60 * 1000;

  // Load all settings from server FIRST
  useEffect(() => {
    const loadAllSettings = async () => {
      console.log('🔄 Loading settings from Pi...');
      await Promise.all([
        useUIStore.getState().loadFromServer?.(),
        useBackgroundStore.getState().loadFromServer?.(),
        useAuthStore.getState().loadFromServer?.(),
        useAIStore.getState().loadFromServer?.()
      ]);
      console.log('✅ All settings loaded from Pi');
      setSettingsLoaded(true);
    };
    loadAllSettings();
  }, []);

  // Initialize stores once settings are loaded
  useEffect(() => {
    if (settingsLoaded) {
      console.log('🚀 Initializing AETHER...');
      initScenes();
      initChases();
      fetchNodes();
      useFixtureStore.getState().fetchFixtures();

      // Keep nodes updated every 10 seconds
      const nodeInterval = setInterval(fetchNodes, 10000);
      return () => clearInterval(nodeInterval);
    }
  }, [settingsLoaded, initScenes, initChases, fetchNodes]);

  // Apply theme AFTER settings are loaded
  useEffect(() => {
    if (!settingsLoaded) return;

    const applyTheme = (color) => {
      document.documentElement.style.setProperty('--theme-primary', color);

      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 100, g: 200, b: 255 };
      };

      const rgb = hexToRgb(color);
      document.documentElement.style.setProperty('--theme-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      document.documentElement.style.setProperty('--theme-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
      document.documentElement.style.setProperty('--theme-lighter', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
    };

    applyTheme(theme);
    console.log('🎨 Theme applied:', theme);
  }, [theme, settingsLoaded]);

  useEffect(() => {
    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivity > SCREENSAVER_TIMEOUT) {
        setScreensaverActive(true);
      }
    }, 10000);
    return () => clearInterval(checkInactivity);
  }, [lastActivity]);

  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      if (screensaverActive) {
        setScreensaverActive(false);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [screensaverActive]);

  if (screensaverActive) {
    return <Screensaver onExit={() => setScreensaverActive(false)} />;
  }

  return (
    <Router>
      <AppContent onLock={() => setScreensaverActive(true)} />
    </Router>
  );
}

export default App;
