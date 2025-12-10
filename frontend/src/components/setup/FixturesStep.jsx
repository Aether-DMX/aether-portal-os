/**
 * FixturesStep.jsx
 * Step 3 of Setup Wizard
 * User adds fixtures to each zone using quick-add buttons
 */

import React, { useState } from 'react';
import useSetupStore, { FIXTURE_TYPES } from '../../store/setupStore';

function FixturesStep() {
  const { 
    zones, 
    currentZoneIndex,
    setCurrentZoneIndex,
    updateFixtureQuantity,
    nextStep, 
    prevStep,
    getTotalChannels
  } = useSetupStore();

  // Filter to only named zones
  const activeZones = zones.filter(z => z.name.trim());
  const currentZone = activeZones[currentZoneIndex];
  
  // Get fixture count for current zone by type
  const getCount = (typeId) => {
    if (!currentZone) return 0;
    return currentZone.fixtures.filter(f => f.typeId === typeId).length;
  };

  // Calculate totals for current zone
  const zoneFixtureCount = currentZone?.fixtures.length || 0;
  const zoneChannelCount = currentZone?.fixtures.reduce((sum, f) => sum + f.channels, 0) || 0;

  // Check if we can proceed (at least one fixture total)
  const totalFixtures = activeZones.reduce((sum, z) => sum + z.fixtures.length, 0);
  const canProceed = totalFixtures > 0;

  // Handle next zone or next step
  const handleNext = () => {
    if (currentZoneIndex < activeZones.length - 1) {
      setCurrentZoneIndex(currentZoneIndex + 1);
    } else {
      nextStep();
    }
  };

  // Handle previous zone or previous step
  const handlePrev = () => {
    if (currentZoneIndex > 0) {
      setCurrentZoneIndex(currentZoneIndex - 1);
    } else {
      prevStep();
    }
  };

  if (!currentZone) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-gray-400">
          <p>No zones defined. Go back and create some zones first.</p>
          <button
            onClick={prevStep}
            className="mt-4 px-6 py-2 bg-white/10 rounded-lg text-white"
          >
            ← Back to Zones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Zone selector tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {activeZones.map((zone, i) => (
          <button
            key={zone.id}
            onClick={() => setCurrentZoneIndex(i)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              i === currentZoneIndex
                ? 'bg-blue-600 text-white'
                : zone.fixtures.length > 0
                  ? 'bg-green-600/30 text-green-400 border border-green-600/50'
                  : 'bg-white/10 text-gray-400'
            }`}
          >
            {zone.name}
            {zone.fixtures.length > 0 && (
              <span className="ml-2 text-xs opacity-70">
                ({zone.fixtures.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Current zone header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-1">
          {currentZone.name}
        </h2>
        <p className="text-gray-400 text-sm">
          What lights are in this zone?
        </p>
      </div>

      {/* Fixture type grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-3">
          {FIXTURE_TYPES.map((type) => {
            const count = getCount(type.id);
            return (
              <div
                key={type.id}
                className={`p-4 rounded-xl border transition-all ${
                  count > 0
                    ? 'bg-blue-600/20 border-blue-500/50'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <div className="font-medium text-white">{type.name}</div>
                    <div className="text-xs text-gray-400">{type.channels} ch</div>
                  </div>
                </div>
                
                {/* Quantity controls */}
                <div className="flex items-center justify-center gap-3 mt-3">
                  <button
                    onClick={() => updateFixtureQuantity(currentZone.id, type.id, -1)}
                    disabled={count === 0}
                    className={`w-10 h-10 rounded-lg text-xl font-bold transition-all ${
                      count > 0
                        ? 'bg-white/20 text-white hover:bg-white/30'
                        : 'bg-white/5 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    −
                  </button>
                  <span className="text-2xl font-bold text-white w-8 text-center">
                    {count}
                  </span>
                  <button
                    onClick={() => updateFixtureQuantity(currentZone.id, type.id, 1)}
                    className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone summary */}
      <div className="my-4 p-3 bg-white/5 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">
            {currentZone.name} Total:
          </span>
          <span className="text-white font-medium">
            {zoneFixtureCount} fixture{zoneFixtureCount !== 1 ? 's' : ''}, {zoneChannelCount} channels
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-400">
            All Zones Total:
          </span>
          <span className="text-white font-medium">
            {totalFixtures} fixture{totalFixtures !== 1 ? 's' : ''}, {getTotalChannels()} channels
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={handlePrev}
          className="px-6 py-3 bg-white/10 rounded-xl text-white font-medium"
        >
          ← {currentZoneIndex > 0 ? 'Prev Zone' : 'Back'}
        </button>
        
        {/* Skip zone option */}
        {currentZoneIndex < activeZones.length - 1 && zoneFixtureCount === 0 && (
          <button
            onClick={() => setCurrentZoneIndex(currentZoneIndex + 1)}
            className="px-4 py-3 text-gray-400 hover:text-white"
          >
            Skip
          </button>
        )}
        
        <button
          onClick={handleNext}
          disabled={!canProceed && currentZoneIndex === activeZones.length - 1}
          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
            currentZoneIndex < activeZones.length - 1
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : canProceed
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
          }`}
        >
          {currentZoneIndex < activeZones.length - 1 
            ? `Next Zone (${activeZones[currentZoneIndex + 1]?.name}) →`
            : 'Continue to Nodes →'
          }
        </button>
      </div>
    </div>
  );
}

export default FixturesStep;
