import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Dock from './components/Dock';
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
import Shows from './views/Shows';
import PatchFixtures from './views/PatchFixtures';
import GroupFixtures from './views/GroupFixtures';
import Schedules from './views/Schedules';
import Timers from './views/Timers';
import MidiPad from './views/MidiPad';
import NodeManagement from './components/NodeManagement';
import MoreMenu from './views/MoreMenu';
import ZoneDetail from './views/ZoneDetail';
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
import ToastContainer from './components/Toast';
import AetherSplash from './components/AetherSplash';
import AetherOnboarding from './components/AetherOnboarding';
import BootLoader from './components/BootLoader';
import AIAssistant from './components/AIAssistant';
import { MobileLayout, MobileLive, MobileScenes, MobileChases, MobileFixtures, MobileSchedules, MobileNodes, MobileMore } from './mobile';
import useAIContext from './hooks/useAIContext';

function AppContent({ onLock }) {
  const [showAIModal, setShowAIModal] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black relative">
      <div className="ambient-glow" />
      <AetherBackground />

      <Header onLock={onLock} />

      <main className="flex-1 relative z-10 overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live-dmx" element={<LiveDMXMenu />} />
          <Route path="/console" element={<Console />} />
          <Route path="/dmx-effects" element={<DMXEffectsMenu />} />
          <Route path="/my-effects" element={<MyEffects />} />
          <Route path="/fixtures-menu" element={<FixturesMenu />} />
          <Route path="/schedules-menu" element={<SchedulesMenu />} />
          <Route path="/faders" element={<Faders />} />
          <Route path="/view-live" element={<ViewLive />} />
          <Route path="/scenes" element={<Scenes />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/chases" element={<Chases />} />
          <Route path="/shows" element={<Shows />} />
          <Route path="/patch-fixtures" element={<PatchFixtures />} />
          <Route path="/group-fixtures" element={<GroupFixtures />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/timers" element={<Timers />} />
          <Route path="/midi-pad" element={<MidiPad />} />
          <Route path="/nodes" element={<NodeManagement />} />
          <Route path="/more" element={<MoreMenu />} />
          <Route path="/zone/:nodeId" element={<ZoneDetail />} />
          <Route path="/mobile" element={<MobileLayout><MobileLive /></MobileLayout>} />
          <Route path="/mobile/scenes" element={<MobileLayout><MobileScenes /></MobileLayout>} />
          <Route path="/mobile/chases" element={<MobileLayout><MobileChases /></MobileLayout>} />
          <Route path="/mobile/fixtures" element={<MobileLayout><MobileFixtures /></MobileLayout>} />
          <Route path="/mobile/more" element={<MobileLayout><MobileMore /></MobileLayout>} />
          <Route path="/mobile/schedules" element={<MobileLayout><MobileSchedules /></MobileLayout>} />
          <Route path="/mobile/nodes" element={<MobileLayout><MobileNodes /></MobileLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Dock onAIClick={() => setShowAIModal(true)} />

      {showAIModal && <ChatModal onClose={() => setShowAIModal(false)} />}
      <ToastContainer />
      <AIAssistant />
    </div>
  );
}

function App() {
  const { accentColor } = useUIStore();
  const { initializeSampleData: initScenes } = useSceneStore();
  const { initializeSampleData: initChases } = useChaseStore();
  const { fetchNodes } = useNodeStore();
  const { setupComplete, updateContext } = useAIContext();

  const [screensaverActive, setScreensaverActive] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const SCREENSAVER_TIMEOUT = 5 * 60 * 1000;

  useEffect(() => {
    updateContext();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (!setupComplete) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

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

  useEffect(() => {
    if (settingsLoaded) {
      console.log('🚀 Initializing AETHER...');
      initScenes();
      initChases();
      fetchNodes();
      useFixtureStore.getState().fetchFixtures();

      const nodeInterval = setInterval(fetchNodes, 10000);
      return () => clearInterval(nodeInterval);
    }
  }, [settingsLoaded, initScenes, initChases, fetchNodes]);

  useEffect(() => {
    if (!settingsLoaded) return;

    const applyAccentColor = (color) => {
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 255, b: 170 };
      };

      const rgb = hexToRgb(color);
      const rgbString = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

      document.documentElement.style.setProperty('--accent', color);
      document.documentElement.style.setProperty('--accent-rgb', rgbString);
      document.documentElement.style.setProperty('--accent-dim', `rgba(${rgbString}, 0.15)`);
      document.documentElement.style.setProperty('--accent-glow', `rgba(${rgbString}, 0.4)`);
      document.documentElement.style.setProperty('--theme-primary', color);
      document.documentElement.style.setProperty('--theme-primary-rgb', rgbString);
    };

    applyAccentColor(accentColor);
    console.log('🎨 Accent color applied:', accentColor);
  }, [accentColor, settingsLoaded]);

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

  // Check backend ready first
  if (!backendReady) {
    return <BootLoader onReady={() => setBackendReady(true)} />;
  }

  // Show splash first
  if (showSplash) {
    return <AetherSplash onComplete={handleSplashComplete} duration={3000} />;
  }

  // Show onboarding if not completed
  if (showOnboarding) {
    return <AetherOnboarding onComplete={handleOnboardingComplete} />;
  }

  if (screensaverActive) {
    return <Screensaver onExit={() => setScreensaverActive(false)} />;
  }

  return (
    <Router>
      <AppContent onLock={() => { setLockTime(Date.now()); setScreensaverActive(true); }} />
    </Router>
  );
}

export default App;
