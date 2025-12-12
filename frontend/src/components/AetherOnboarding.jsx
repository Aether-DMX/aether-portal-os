import React, { useState } from 'react';
import { Sparkles, Wifi, WifiOff, HelpCircle, ChevronRight, ChevronLeft, Zap, Check, Play, Home, Church, Theater, Building, PartyPopper } from 'lucide-react';
import useAIContext from '../hooks/useAIContext';
import useDMXStore from '../store/dmxStore';

const VENUE_TYPES = [
  { id: 'church', icon: Church, label: 'Church' },
  { id: 'theater', icon: Theater, label: 'Theater' },
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'venue', icon: Building, label: 'Venue' },
  { id: 'other', icon: PartyPopper, label: 'Other' },
];

const FIXTURE_COUNTS = [
  { id: 'few', label: '1-5', sublabel: 'Few' },
  { id: 'some', label: '6-15', sublabel: 'Small' },
  { id: 'many', label: '16-50', sublabel: 'Medium' },
  { id: 'lots', label: '50+', sublabel: 'Large' },
  { id: 'unknown', label: '?', sublabel: 'Unsure' },
];

const FIXTURE_TYPES = [
  { id: 'dimmer', channels: 1, label: 'Dimmer', sublabel: 'Just brightness' },
  { id: 'rgb', channels: 3, label: 'RGB', sublabel: '3 colors' },
  { id: 'rgbw', channels: 4, label: 'RGBW', sublabel: '+ white' },
];

function FixtureTest({ onResult }) {
  const [phase, setPhase] = useState('ready');
  const [testChannel, setTestChannel] = useState(0);
  const { setChannels } = useDMXStore();

  const runTest = async () => {
    setPhase('testing');
    for (let i = 0; i < 4; i++) {
      setTestChannel(i + 1);
      try { await setChannels(1, { [i + 1]: 255 }, 100); } catch(e) {}
      await new Promise(r => setTimeout(r, 1500));
      try { await setChannels(1, { [i + 1]: 0 }, 100); } catch(e) {}
      await new Promise(r => setTimeout(r, 300));
    }
    try { await setChannels(1, { 1: 0, 2: 0, 3: 0, 4: 0 }, 100); } catch(e) {}
    setPhase('asking');
  };

  const handleAnswer = (answer) => {
    const map = { nothing: { type: 'unknown', channels: 1 }, one: { type: 'dimmer', channels: 1 }, three: { type: 'rgb', channels: 3 }, four: { type: 'rgbw', channels: 4 } };
    onResult(map[answer] || map.three);
  };

  if (phase === 'ready') {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--theme-primary)]/20 flex items-center justify-center mx-auto mb-4"><Zap size={32} className="text-[var(--theme-primary)]" /></div>
        <h3 className="text-white font-bold text-lg mb-2">Let's Test Your Lights!</h3>
        <p className="text-white/60 text-sm mb-6">I'll flash a few channels and you tell me what you see.</p>
        <button onClick={runTest} className="px-6 py-3 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center gap-2 mx-auto"><Play size={18} /> Start Test</button>
      </div>
    );
  }

  if (phase === 'testing') {
    return (
      <div className="text-center py-6">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-4xl">{['🔴', '🟢', '🔵', '⚪'][testChannel - 1] || '💡'}</span>
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Testing Channel {testChannel}</h3>
        <p className="text-white/60 text-sm">Watch your lights...</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h3 className="text-white font-bold text-lg mb-4 text-center">What did you see?</h3>
      <div className="grid grid-cols-2 gap-2">
        {[{ key: 'nothing', icon: '🤷', label: 'Nothing', sub: 'No lights' }, { key: 'one', icon: '💡', label: 'One Color', sub: 'Just dimming' }, { key: 'three', icon: '🌈', label: 'Three Colors', sub: 'R, G, B' }, { key: 'four', icon: '✨', label: 'Four Colors', sub: 'RGB + White' }].map(opt => (
          <button key={opt.key} onClick={() => handleAnswer(opt.key)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left">
            <span className="text-2xl mb-1 block">{opt.icon}</span>
            <span className="text-white font-bold text-sm">{opt.label}</span>
            <span className="text-white/40 text-xs block">{opt.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AetherOnboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null);
  const { setSetupComplete, setSetupMode, setUserProfile } = useAIContext();
  const [internetMode, setInternetMode] = useState('offline');
  const [venueType, setVenueType] = useState(null);
  const [fixtureCount, setFixtureCount] = useState(null);
  const [fixtureType, setFixtureType] = useState(null);
  const [userName, setUserName] = useState('');
  const [showTest, setShowTest] = useState(false);

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setSetupMode(selectedMode);
    if (selectedMode === 'pro') { setSetupComplete(true); onComplete?.(); }
    else setStep(1);
  };

  const handleNext = () => {
    if (step === 5) {
      setUserProfile({ name: userName, venueType, experienceLevel: 'beginner', internetMode, fixtureCount, fixtureType });
      setSetupComplete(true);
      onComplete?.();
    } else setStep(step + 1);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return internetMode !== null;
      case 2: return venueType !== null;
      case 3: return fixtureCount !== null;
      case 4: return fixtureType !== null;
      default: return true;
    }
  };

  if (step === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col">
        <div className="absolute inset-0 overflow-hidden"><div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[var(--theme-primary)]/10 rounded-full blur-[100px]" /></div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--theme-primary)] to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-[var(--theme-primary)]/30"><Sparkles size={28} className="text-white" /></div>
          <h1 className="text-2xl font-black text-white mb-2">Welcome to AETHER</h1>
          <p className="text-white/60 text-sm mb-8 text-center">Your AI-powered lighting assistant</p>
          <div className="w-full max-w-sm space-y-3">
            <button onClick={() => handleModeSelect('easy')} className="w-full p-4 rounded-2xl bg-gradient-to-r from-[var(--theme-primary)] to-blue-500 text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><HelpCircle size={24} className="text-white" /></div>
                <div className="flex-1"><h3 className="text-white font-bold text-lg">Easy Mode</h3><p className="text-white/80 text-sm">I'll guide you through setup</p></div>
                <ChevronRight size={24} className="text-white/60" />
              </div>
            </button>
            <button onClick={() => handleModeSelect('pro')} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center"><Zap size={24} className="text-white/60" /></div>
                <div className="flex-1"><h3 className="text-white font-bold text-lg">Pro Mode</h3><p className="text-white/60 text-sm">Skip to dashboard</p></div>
                <ChevronRight size={24} className="text-white/30" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    null,
    { title: "Internet Connection?", content: (
      <div className="grid grid-cols-2 gap-3">
        {[{ id: 'online', icon: Wifi, label: 'Online', sub: 'Full AI features' }, { id: 'offline', icon: WifiOff, label: 'Offline', sub: 'Works anywhere' }].map(opt => {
          const Icon = opt.icon; const sel = internetMode === opt.id;
          return <button key={opt.id} onClick={() => setInternetMode(opt.id)} className={`p-4 rounded-2xl text-center ${sel ? 'bg-[var(--theme-primary)]' : 'bg-white/5 hover:bg-white/10'}`}>
            <Icon size={32} className={`mx-auto mb-2 ${sel ? 'text-black' : 'text-white/60'}`} />
            <h3 className={`font-bold ${sel ? 'text-black' : 'text-white'}`}>{opt.label}</h3>
            <p className={`text-xs ${sel ? 'text-black/70' : 'text-white/40'}`}>{opt.sub}</p>
          </button>;
        })}
      </div>
    )},
    { title: "What type of space?", content: (
      <div className="grid grid-cols-3 gap-2">
        {VENUE_TYPES.map(v => { const Icon = v.icon; const sel = venueType === v.id;
          return <button key={v.id} onClick={() => setVenueType(v.id)} className={`p-3 rounded-xl text-center ${sel ? 'bg-[var(--theme-primary)]' : 'bg-white/5 hover:bg-white/10'}`}>
            <Icon size={24} className={`mx-auto mb-1 ${sel ? 'text-black' : 'text-white/60'}`} />
            <span className={`text-xs font-medium ${sel ? 'text-black' : 'text-white/80'}`}>{v.label}</span>
          </button>;
        })}
      </div>
    )},
    { title: "How many lights?", content: (
      <div className="grid grid-cols-5 gap-2">
        {FIXTURE_COUNTS.map(c => { const sel = fixtureCount === c.id;
          return <button key={c.id} onClick={() => setFixtureCount(c.id)} className={`p-3 rounded-xl text-center ${sel ? 'bg-[var(--theme-primary)]' : 'bg-white/5 hover:bg-white/10'}`}>
            <span className={`text-xl font-bold block ${sel ? 'text-black' : 'text-white'}`}>{c.label}</span>
            <span className={`text-[10px] ${sel ? 'text-black/70' : 'text-white/40'}`}>{c.sublabel}</span>
          </button>;
        })}
      </div>
    )},
    { title: "What type of fixtures?", content: showTest ? <FixtureTest onResult={(r) => { setFixtureType(r.type); setShowTest(false); }} /> : (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {FIXTURE_TYPES.map(t => { const sel = fixtureType === t.id;
            return <button key={t.id} onClick={() => setFixtureType(t.id)} className={`p-3 rounded-xl text-center ${sel ? 'bg-[var(--theme-primary)]' : 'bg-white/5 hover:bg-white/10'}`}>
              <span className={`text-sm font-bold block ${sel ? 'text-black' : 'text-white'}`}>{t.label}</span>
              <span className={`text-xs ${sel ? 'text-black/70' : 'text-white/40'}`}>{t.sublabel}</span>
            </button>;
          })}
        </div>
        <button onClick={() => setShowTest(true)} className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-center">
          <HelpCircle size={20} className="mx-auto mb-1 text-[var(--theme-primary)]" />
          <span className="text-white font-bold text-sm">I Don't Know - Test It</span>
        </button>
      </div>
    )},
    { title: "What's your name?", content: (
      <div className="space-y-4">
        <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Optional..." className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-center text-lg focus:outline-none focus:border-[var(--theme-primary)]" />
        <div className="bg-white/5 rounded-xl p-4">
          <h4 className="text-white font-bold text-sm mb-2">Summary</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-white/40">Mode</span><span className="text-white">{internetMode}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Venue</span><span className="text-white">{venueType || '-'}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Fixtures</span><span className="text-white">{fixtureCount} / {fixtureType || '?'}</span></div>
          </div>
        </div>
      </div>
    )},
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col">
      <div className="p-4 flex items-center gap-2">{[1,2,3,4,5].map(s => <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-[var(--theme-primary)]' : 'bg-white/10'}`} />)}</div>
      <div className="flex-1 px-6 py-4 overflow-auto">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">{currentStep?.title}</h2>
          {currentStep?.content}
        </div>
      </div>
      <div className="p-4 flex gap-3">
        {step > 1 && <button onClick={() => setStep(step - 1)} className="px-4 py-3 rounded-xl bg-white/5 text-white/60 font-medium flex items-center gap-1"><ChevronLeft size={18} /> Back</button>}
        <button onClick={handleNext} disabled={!canProceed()} className="flex-1 py-3 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center justify-center gap-1 disabled:opacity-30">
          {step === 5 ? <><Check size={18} /> Let's Go!</> : <>Continue <ChevronRight size={18} /></>}
        </button>
      </div>
    </div>
  );
}
