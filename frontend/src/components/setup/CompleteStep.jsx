/**
 * CompleteStep.jsx
 * Step 5 of Setup Wizard
 * Shows summary and allows testing lights
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSetupStore from '../../store/setupStore';

function CompleteStep() {
  const navigate = useNavigate();
  const { 
    zones,
    createdFixtures,
    createdGroups,
    availableNodes,
    nodeAssignments,
    testAllZones,
    reset
  } = useSetupStore();

  const [testing, setTesting] = useState(false);
  const [testComplete, setTestComplete] = useState(false);

  // Get summary stats
  const activeZones = zones.filter(z => z.name.trim() && z.fixtures.length > 0);
  const totalFixtures = createdFixtures.length || activeZones.reduce((sum, z) => sum + z.fixtures.length, 0);
  const totalChannels = createdFixtures.reduce((sum, f) => sum + (f.channel_count || 0), 0) ||
    activeZones.reduce((sum, z) => sum + z.fixtures.reduce((fSum, f) => fSum + f.channels, 0), 0);
  const assignedNodes = Object.keys(nodeAssignments).length;

  const handleTest = async () => {
    setTesting(true);
    setTestComplete(false);
    await testAllZones();
    setTesting(false);
    setTestComplete(true);
  };

  const handleFinish = (allWorking) => {
    // Clear setup state
    reset();
    // Navigate to dashboard
    navigate('/');
  };

  const handleEditSetup = () => {
    // Go back to step 2 to edit
    useSetupStore.getState().setStep(2);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      {/* Success icon */}
      <div className="text-6xl mb-4">
        {testComplete ? '🎉' : '✅'}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white mb-2">
        {testComplete ? 'Awesome!' : "You're All Set!"}
      </h1>
      <p className="text-gray-400 mb-6">
        {testComplete 
          ? 'Your lighting system is ready to use.'
          : 'Your AETHER system has been configured.'
        }
      </p>

      {/* Summary */}
      <div className="w-full max-w-sm bg-white/5 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Your System
        </h3>
        <div className="space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-gray-400">Zones</span>
            <span className="text-white font-medium">{activeZones.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Fixtures</span>
            <span className="text-white font-medium">{totalFixtures}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">DMX Channels</span>
            <span className="text-white font-medium">{totalChannels}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Nodes Connected</span>
            <span className="text-white font-medium">{assignedNodes}</span>
          </div>
        </div>

        {/* Zone breakdown */}
        <div className="mt-4 pt-4 border-t border-white/10">
          {activeZones.map(zone => (
            <div key={zone.id} className="flex items-center gap-2 text-sm mb-1">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: zone.color }}
              />
              <span className="text-gray-300">{zone.name}</span>
              <span className="text-gray-500 ml-auto">
                {zone.fixtures.length} fixtures
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Test Button */}
      {!testComplete && (
        <button
          onClick={handleTest}
          disabled={testing}
          className={`w-full max-w-sm py-4 rounded-xl font-medium mb-4 transition-all ${
            testing
              ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-600/50'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {testing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-pulse">💡</span>
              Testing lights...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>💡</span>
              Test All Lights
            </span>
          )}
        </button>
      )}

      {/* Post-test options */}
      {testComplete && (
        <div className="w-full max-w-sm space-y-3">
          <p className="text-gray-400 text-sm mb-4">
            Did all your lights respond correctly?
          </p>
          <button
            onClick={() => handleFinish(true)}
            className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-medium"
          >
            ✅ Yes, all working!
          </button>
          <button
            onClick={() => handleFinish(false)}
            className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium"
          >
            ⚠️ Some issues, but continue anyway
          </button>
        </div>
      )}

      {/* Edit / Skip options */}
      {!testComplete && (
        <div className="flex gap-4">
          <button
            onClick={handleEditSetup}
            className="text-gray-400 hover:text-white text-sm"
          >
            ← Edit Setup
          </button>
          <button
            onClick={() => handleFinish(true)}
            className="text-gray-400 hover:text-white text-sm"
          >
            Skip Test →
          </button>
        </div>
      )}
    </div>
  );
}

export default CompleteStep;
