import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Check } from 'lucide-react';
import useToastStore from '../store/toastStore';

const STEPS = ['Select', 'Address', 'Name'];

const FIXTURE_LIBRARY = [
  { 
    id: 'par-rgb',
    name: 'RGB PAR Can',
    manufacturer: 'Generic',
    channels: 3,
    modes: ['3ch RGB'],
    description: 'Basic RGB wash light'
  },
  {
    id: 'par-rgba',
    name: 'RGBA PAR Can',
    manufacturer: 'Generic',
    channels: 4,
    modes: ['4ch RGBA'],
    description: 'RGB + Amber wash light'
  },
  {
    id: 'dimmer',
    name: 'Dimmer',
    manufacturer: 'Generic',
    channels: 1,
    modes: ['1ch Dimmer'],
    description: 'Single channel dimmer'
  },
  {
    id: 'moving-head',
    name: 'Moving Head Spot',
    manufacturer: 'Generic',
    channels: 16,
    modes: ['16ch Extended'],
    description: 'Pan/Tilt/Color/Gobo'
  },
  {
    id: 'led-bar',
    name: 'LED Bar RGBW',
    manufacturer: 'Generic',
    channels: 4,
    modes: ['4ch RGBW'],
    description: 'Linear wash fixture'
  },
];

export default function PatchFixtures() {
  const navigate = useNavigate();
  const toast = useToastStore();

  const [step, setStep] = useState(0);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [startAddress, setStartAddress] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [fixtureName, setFixtureName] = useState('');

  const getTotalChannels = () => {
    if (!selectedFixture) return 0;
    return selectedFixture.channels * quantity;
  };

  const getEndAddress = () => {
    return startAddress + getTotalChannels() - 1;
  };

  const handleSave = () => {
    if (!fixtureName.trim()) {
      toast.warning('Please enter a fixture name');
      return;
    }

    console.log('Patching:', {
      fixture: selectedFixture,
      startAddress,
      quantity,
      name: fixtureName
    });

    toast.success(`Fixture "${fixtureName}" patched!`);
    navigate('/fixtures-menu');
  };

  const canProceed = () => {
    if (step === 0) return selectedFixture !== null;
    if (step === 1) return getEndAddress() <= 512;
    if (step === 2) return fixtureName.trim() !== '';
    return true;
  };

  return (
    <div className="fixed inset-0 bg-gradient-primary pt-[60px] pb-2 px-3">
      <div className="h-[calc(100vh-66px)] flex flex-col">
        {/* Compact Progress */}
        <div className="flex items-center justify-center gap-1 py-3">
          {STEPS.map((s, idx) => (
            <div key={idx} className="flex items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: idx === step ? 'var(--theme-primary)' : idx < step ? 'rgba(var(--theme-primary-rgb), 0.5)' : 'rgba(255,255,255,0.1)',
                  color: 'white'
                }}
              >
                {idx < step ? <Check size={14} /> : idx + 1}
              </div>
              {idx < STEPS.length - 1 && (
                <div className="w-12 h-0.5 mx-0.5" style={{ backgroundColor: idx < step ? 'rgba(var(--theme-primary-rgb), 0.5)' : 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden px-2">
          {/* STEP 1: Select Fixture */}
          {step === 0 && (
            <div className="h-full flex flex-col">
              <h2 className="text-xl font-bold text-white text-center mb-3">Select Fixture Type</h2>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {FIXTURE_LIBRARY.map(fixture => (
                  <button
                    key={fixture.id}
                    onClick={() => setSelectedFixture(fixture)}
                    className="w-full glass-panel rounded-lg border p-3 text-left transition-all"
                    style={{
                      borderColor: selectedFixture?.id === fixture.id ? 'var(--theme-primary)' : 'rgba(255,255,255,0.2)',
                      backgroundColor: selectedFixture?.id === fixture.id ? 'rgba(var(--theme-primary-rgb), 0.1)' : 'transparent'
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-sm font-bold text-white">{fixture.name}</h3>
                        <p className="text-xs text-white/60">{fixture.manufacturer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-white">{fixture.channels} ch</p>
                        <p className="text-xs text-white/60">{fixture.modes[0]}</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/70">{fixture.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Assign Address */}
          {step === 1 && selectedFixture && (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-md space-y-4">
                <h2 className="text-xl font-bold text-white text-center mb-3">Assign DMX Address</h2>

                <div className="glass-panel rounded-lg border p-3 space-y-3"
                  style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <div>
                    <label className="text-xs font-bold text-white/80 mb-1 block">Start Address</label>
                    <input
                      type="number"
                      min="1"
                      max="512"
                      value={startAddress}
                      onChange={(e) => setStartAddress(Math.max(1, Math.min(512, Number(e.target.value))))}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xl text-center font-bold outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white/80 mb-1 block">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(50, Number(e.target.value))))}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xl text-center font-bold outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                {/* Address Preview */}
                <div className="glass-panel rounded-lg border p-3"
                  style={{ 
                    borderColor: getEndAddress() > 512 ? '#FF4444' : 'rgba(255,255,255,0.2)',
                    backgroundColor: getEndAddress() > 512 ? 'rgba(255,68,68,0.1)' : 'transparent'
                  }}>
                  <p className="text-xs text-white/80 mb-1">
                    <strong>Fixture:</strong> {selectedFixture.name}
                  </p>
                  <p className="text-xs text-white/80 mb-1">
                    <strong>Channels/fixture:</strong> {selectedFixture.channels}
                  </p>
                  <p className="text-xs text-white/80 mb-2">
                    <strong>Total channels:</strong> {getTotalChannels()}
                  </p>
                  <p className="text-base font-bold text-white">
                    {startAddress} → {getEndAddress()}
                  </p>
                  {getEndAddress() > 512 && (
                    <p className="text-xs text-red-400 mt-2">
                      ⚠️ Exceeds universe limit
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Name & Save */}
          {step === 2 && (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-md space-y-4">
                <h2 className="text-xl font-bold text-white text-center mb-3">Name Your Fixture</h2>

                <div>
                  <label className="text-xs font-bold text-white/80 mb-1 block">Fixture Name *</label>
                  <input
                    type="text"
                    value={fixtureName}
                    onChange={(e) => setFixtureName(e.target.value)}
                    placeholder={`e.g., ${selectedFixture.name} 1-${quantity}`}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-white/40 outline-none"
                    autoFocus
                  />
                </div>

                <div className="glass-panel rounded-lg border p-3 space-y-2"
                  style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <h3 className="text-sm font-bold text-white mb-2">Summary</h3>
                  <p className="text-xs text-white/80">
                    <strong>Fixture:</strong> {selectedFixture.name}
                  </p>
                  <p className="text-xs text-white/80">
                    <strong>Quantity:</strong> {quantity}
                  </p>
                  <p className="text-xs text-white/80">
                    <strong>Address:</strong> {startAddress} → {getEndAddress()}
                  </p>
                  <p className="text-xs text-white/80">
                    <strong>Total:</strong> {getTotalChannels()} channels
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compact Navigation */}
        <div className="flex gap-2 mt-3 px-2">
          <button
            onClick={() => step === 0 ? navigate('/fixtures-menu') : setStep(step - 1)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 px-4 py-2.5 rounded-lg border text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              style={{
                background: canProceed() ? 'linear-gradient(135deg, var(--theme-primary), rgba(var(--theme-primary-rgb), 0.7))' : 'rgba(255,255,255,0.1)',
                borderColor: canProceed() ? 'var(--theme-primary)' : 'rgba(255,255,255,0.2)'
              }}
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!canProceed()}
              className="flex-1 px-4 py-2.5 rounded-lg border text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              style={{
                background: canProceed() ? 'linear-gradient(135deg, var(--theme-primary), rgba(var(--theme-primary-rgb), 0.7))' : 'rgba(255,255,255,0.1)',
                borderColor: canProceed() ? 'var(--theme-primary)' : 'rgba(255,255,255,0.2)'
              }}
            >
              <Save size={16} />
              Patch
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export const PatchFixturesHeaderExtension = () => null;
