import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { KeyboardProvider } from './context/KeyboardContext';
import Header from './components/Header';
import Dock from './components/Dock';
import ChatDock from './components/ChatDock';
import DesktopShell from './components/desktop/DesktopShell';
import Dashboard from './views/Dashboard';
import ChatPage from './views/ChatPage';
import LiveDMXMenu from './views/LiveDMXMenu';
import Console from './views/Console';
import DMXEffectsMenu from './views/DMXEffectsMenu';
import MyEffects from './views/MyEffects';
import Fixtures from './views/Fixtures';
import FixtureManager from './views/FixtureManager';
import SchedulesMenu from './views/SchedulesMenu';
import Faders from './views/Faders';
import ViewLive from './views/ViewLive';
import Scenes from './views/Scenes';
import Chases from './views/Chases';
import Looks from './views/Looks';
import CueStacks from './views/CueStacks';
import Effects from './views/Effects';
import Shows from './views/Shows';
import Library from './views/Library';
import Schedules from './views/Schedules';
import Timers from './views/Timers';
import MidiPad from './views/MidiPad';
import PixelArrays from './views/PixelArrays';
import NodeManagement from './components/NodeManagement';
import MoreMenu from './views/MoreMenu';
import ZoneDetail from './views/ZoneDetail';
import Screensaver from './components/Screensaver';
import useDMXStore from './store/dmxStore';
import useUIStore from './store/uiStore';
import useSceneStore from './store/sceneStore';
import useChaseStore from './store/chaseStore';
import useLookStore from './store/lookStore';
import usePixelArrayStore from './store/pixelArrayStore';
import useNodeStore from './store/nodeStore';
import useBackgroundStore from './store/backgroundStore';
import useAuthStore from './store/authStore';
import useAIStore from './store/aiStore';
import { useFixtureStore } from './store/fixtureStore';
import useIntentContextStore, { ViewContext } from './store/intentContextStore';
import useUnifiedPlaybackStore from './store/unifiedPlaybackStore';
import AetherBackground from './components/AetherBackground';
import ToastContainer from './components/Toast';
import AetherSplash from './components/AetherSplash';
import AetherOnboarding from './components/AetherOnboarding';
import BootLoader from './components/BootLoader';
import AIBubble from './components/AIBubble';
import { MobileLayout, MobileLive, MobileScenes, MobileChases, MobileFixtures, MobileSchedules, MobileNodes, MobileMore } from './mobile';
import useAIContext from './hooks/useAIContext';

// Routes shared between desktop and kiosk modes
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/live-dmx" element={<LiveDMXMenu />} />
      <Route path="/console" element={<Console />} />
      <Route path="/dmx-effects" element={<DMXEffectsMenu />} />
      <Route path="/my-effects" element={<MyEffects />} />
      <Route path="/fixtures" element={<Fixtures />} />
      <Route path="/fixture-manager" element={<FixtureManager />} />
      <Route path="/schedules-menu" element={<SchedulesMenu />} />
      <Route path="/faders" element={<Faders />} />
      <Route path="/view-live" element={<ViewLive />} />
      <Route path="/scenes" element={<Scenes />} />
      <Route path="/chases" element={<Chases />} />
      <Route path="/looks" element={<Looks />} />
      <Route path="/cue-stacks" element={<CueStacks />} />
      <Route path="/effects" element={<Effects />} />
      <Route path="/shows" element={<Shows />} />
      <Route path="/library" element={<Library />} />
      <Route path="/schedules" element={<Schedules />} />
      <Route path="/timers" element={<Timers />} />
      <Route path="/midi-pad" element={<MidiPad />} />
      <Route path="/pixel-arrays" element={<PixelArrays />} />
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
  );
}

// Desktop layout - professional DMX control surface
function DesktopContent() {
  console.log('[BOOT] DesktopContent rendering');
  return (
    <DesktopShell>
      <AppRoutes />
    </DesktopShell>
  );
}

// Kiosk layout - original touch-optimized interface
function KioskContent({ onLock }) {
  console.log('[BOOT] KioskContent rendering');
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden relative" style={{ background: '#000' }}>
      <div className="ambient-glow" />
      <AetherBackground />

      <Header onLock={onLock} />

      <main className="flex-1 relative z-10 overflow-hidden">
        <AppRoutes />
      </main>

      <Dock />

      <ChatDock />
      <ToastContainer />
      <AIBubble />
    </div>
  );
}

// Mobile layout - phone-optimized interface with bottom nav
function MobileContent() {
  console.log('[BOOT] MobileContent rendering');
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MobileLayout><MobileLive /></MobileLayout>} />
        <Route path="/mobile" element={<MobileLayout><MobileLive /></MobileLayout>} />
        <Route path="/mobile/scenes" element={<MobileLayout><MobileScenes /></MobileLayout>} />
        <Route path="/mobile/chases" element={<MobileLayout><MobileChases /></MobileLayout>} />
        <Route path="/mobile/fixtures" element={<MobileLayout><MobileFixtures /></MobileLayout>} />
        <Route path="/mobile/more" element={<MobileLayout><MobileMore /></MobileLayout>} />
        <Route path="/mobile/schedules" element={<MobileLayout><MobileSchedules /></MobileLayout>} />
        <Route path="/mobile/nodes" element={<MobileLayout><MobileNodes /></MobileLayout>} />
        <Route path="/scenes" element={<MobileLayout><MobileScenes /></MobileLayout>} />
        <Route path="/chases" element={<MobileLayout><MobileChases /></MobileLayout>} />
        <Route path="/fixtures" element={<MobileLayout><MobileFixtures /></MobileLayout>} />
        <Route path="/schedules" element={<MobileLayout><MobileSchedules /></MobileLayout>} />
        <Route path="/nodes" element={<MobileLayout><MobileNodes /></MobileLayout>} />
        <Route path="/more" element={<MobileLayout><MobileMore /></MobileLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function AppContent({ onLock }) {
  // Detect device type: mobile phone vs kiosk vs desktop
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 800
  );
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 600
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect touch capability
  const isTouchDevice = typeof window !== 'undefined' && (
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );

  // Detect if device is a mobile phone
  // Mobile phones: touch device AND (width < 768px OR portrait orientation with width < 1024px)
  // The Pi kiosk is 800x480 (landscape, width > height), so it won't match portrait check
  const isPortrait = windowHeight > windowWidth;
  const isMobilePhone = isTouchDevice && (
    windowWidth < 768 ||
    (isPortrait && windowWidth < 1024)
  );

  // Desktop mode: >= 1024px width AND not a touch device in portrait
  const isDesktop = windowWidth >= 1024 && !isMobilePhone;

  // Kiosk mode: touch device with landscape orientation (like Pi 800x480)
  const isKiosk = !isDesktop && !isMobilePhone;

  console.log('[BOOT] AppContent:', { isDesktop, isMobilePhone, isKiosk, windowWidth, windowHeight, isTouchDevice, isPortrait });

  // Mobile phone gets dedicated mobile UI
  if (isMobilePhone) {
    return <MobileContent />;
  }

  // Desktop gets professional interface
  if (isDesktop) {
    return <DesktopContent />;
  }

  // Kiosk (Pi screen) gets touch-optimized interface
  return <KioskContent onLock={onLock} />;
}

function App() {
  console.log('[BOOT] App() function called');

  const { accentColor } = useUIStore();
  const { initializeSampleData: initScenes } = useSceneStore();
  const { initializeSampleData: initChases } = useChaseStore();
  const { initialize: initLooks } = useLookStore();
  const { fetchNodes } = useNodeStore();
  const { setupComplete, updateContext, initFromServer } = useAIContext();

  const [screensaverActive, setScreensaverActive] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(false); // Disabled - boot straight to dashboard
  const [backendReady, setBackendReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [setupSynced, setSetupSynced] = useState(false);
  const SCREENSAVER_TIMEOUT = 5 * 60 * 1000;

  useEffect(() => {
    updateContext();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Sync setup state from server when backend is ready
  useEffect(() => {
    if (backendReady && !setupSynced) {
      initFromServer().then((isComplete) => {
        console.log('[BOOT] Setup synced from server, complete:', isComplete);
        setSetupSynced(true);
        // Show onboarding only if server says setup is not complete
        if (!isComplete) {
          setShowOnboarding(true);
        }
      });
    }
  }, [backendReady, setupSynced, initFromServer]);

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
      initLooks();
      fetchNodes();
      useFixtureStore.getState().fetchFixtures();
      usePixelArrayStore.getState().initialize();

      // Initialize unified playback store
      useUnifiedPlaybackStore.getState().fetchStatus();
      useUnifiedPlaybackStore.getState().loadLastSession();
      useUnifiedPlaybackStore.getState().startPolling(2000);

      // Initialize intent context store
      useIntentContextStore.getState().updateSuggestions();

      const nodeInterval = setInterval(fetchNodes, 10000);
      return () => {
        clearInterval(nodeInterval);
        useUnifiedPlaybackStore.getState().stopPolling();
      };
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

  // Wrap everything in a black container to prevent any white flash
  const blackWrapper = { position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' };

  console.log('[BOOT] App render - backendReady:', backendReady, 'showSplash:', showSplash, 'showOnboarding:', showOnboarding, 'screensaverActive:', screensaverActive);

  // Check backend ready first
  if (!backendReady) {
    console.log('[BOOT] Rendering BootLoader');
    return <div style={blackWrapper}><BootLoader onReady={() => { console.log('[BOOT] BootLoader onReady fired'); setBackendReady(true); }} /></div>;
  }

  // Show splash first (currently disabled)
  if (showSplash) {
    console.log('[BOOT] Rendering AetherSplash');
    return <div style={blackWrapper}><AetherSplash onComplete={handleSplashComplete} duration={3000} /></div>;
  }

  // Show onboarding if not completed
  if (showOnboarding) {
    console.log('[BOOT] Rendering AetherOnboarding');
    return <div style={blackWrapper}><AetherOnboarding onComplete={handleOnboardingComplete} /></div>;
  }

  if (screensaverActive) {
    console.log('[BOOT] Rendering Screensaver');
    return <div style={blackWrapper}><Screensaver onExit={() => setScreensaverActive(false)} /></div>;
  }

  console.log('[BOOT] Rendering AppContent (main dashboard)');
  return (
    <div style={blackWrapper}>
      <KeyboardProvider>
        <Router>
          <AppContent onLock={() => { setLockTime(Date.now()); setScreensaverActive(true); }} />
        </Router>
      </KeyboardProvider>
    </div>
  );
}

export default App;
