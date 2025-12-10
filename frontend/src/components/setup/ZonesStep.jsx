/**
 * ZonesStep.jsx
 * Step 2 of Setup Wizard
 * User creates zones (areas where lights are located)
 */

import React from 'react';
import useSetupStore from '../../store/setupStore';

function ZonesStep() {
  const { 
    zones, 
    addZone, 
    removeZone, 
    updateZoneName,
    nextStep, 
    prevStep 
  } = useSetupStore();

  // Check if we can proceed (at least one named zone)
  const canProceed = zones.some(z => z.name.trim().length > 0);

  // Preset zone suggestions
  const suggestions = ['Stage', 'Audience', 'Lobby', 'Bar', 'Dance Floor', 'Entrance'];
  const unusedSuggestions = suggestions.filter(s => 
    !zones.some(z => z.name.toLowerCase() === s.toLowerCase())
  );

  const handleSuggestionClick = (suggestion) => {
    // Find first empty zone or add new one
    const emptyZone = zones.find(z => !z.name.trim());
    if (emptyZone) {
      updateZoneName(emptyZone.id, suggestion);
    } else {
      addZone();
      // Use setTimeout to let the zone be added first
      setTimeout(() => {
        const { zones: updatedZones, updateZoneName: update } = useSetupStore.getState();
        const lastZone = updatedZones[updatedZones.length - 1];
        if (lastZone) update(lastZone.id, suggestion);
      }, 0);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Where are your lights?
        </h2>
        <p className="text-gray-400">
          Create zones for different areas in your space. 
          Each zone can have different types of lights.
        </p>
      </div>

      {/* Zone List */}
      <div className="flex-1 overflow-auto space-y-3 mb-4">
        {zones.map((zone, index) => (
          <div 
            key={zone.id}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
          >
            <span className="text-gray-500 text-sm w-6">#{index + 1}</span>
            <input
              type="text"
              placeholder="Zone name (e.g., Stage, Audience)"
              value={zone.name}
              onChange={(e) => updateZoneName(zone.id, e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
              autoFocus={index === zones.length - 1 && !zone.name}
            />
            {zones.length > 1 && (
              <button
                onClick={() => removeZone(zone.id)}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
              >
                🗑️
              </button>
            )}
          </div>
        ))}

        {/* Add Zone Button */}
        <button
          onClick={addZone}
          className="w-full p-3 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 transition-all"
        >
          + Add Another Zone
        </button>
      </div>

      {/* Quick Suggestions */}
      {unusedSuggestions.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">Quick add:</div>
          <div className="flex flex-wrap gap-2">
            {unusedSuggestions.slice(0, 4).map(suggestion => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300 hover:bg-white/20 transition-colors"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tip */}
      <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
        <div className="text-blue-400 text-sm">
          💡 <strong>Tip:</strong> Zones are areas in your space like "Stage", "Bar", or "Lobby". 
          You'll add lights to each zone in the next step.
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={prevStep}
          className="px-6 py-3 bg-white/10 rounded-xl text-white font-medium"
        >
          ← Back
        </button>
        <button
          onClick={nextStep}
          disabled={!canProceed}
          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
            canProceed 
              ? 'bg-blue-600 hover:bg-blue-500 text-white' 
              : 'bg-white/5 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

export default ZonesStep;
