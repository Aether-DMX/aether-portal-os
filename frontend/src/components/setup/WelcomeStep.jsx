/**
 * WelcomeStep.jsx
 * Step 1 of Setup Wizard
 * User chooses: Guided Setup, Manual Setup, or Import Project
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import useSetupStore from '../../store/setupStore';

function WelcomeStep() {
  const navigate = useNavigate();
  const { setMode, nextStep } = useSetupStore();

  const handleGuided = () => {
    setMode('guided');
    nextStep();
  };

  const handleManual = () => {
    setMode('manual');
    // Go to existing patch/fixtures page
    navigate('/patch');
  };

  const handleImport = () => {
    setMode('import');
    // Go to settings for import
    navigate('/settings');
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      {/* Logo/Icon */}
      <div className="text-6xl mb-4">✨</div>
      
      {/* Title */}
      <h1 className="text-3xl font-bold text-white mb-2">
        Welcome to AETHER
      </h1>
      <p className="text-gray-400 mb-8 max-w-md">
        Let's set up your lighting system. This will only take a few minutes.
      </p>

      {/* Options */}
      <div className="w-full max-w-sm space-y-3">
        {/* Guided Setup - Primary */}
        <button
          onClick={handleGuided}
          className="w-full p-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition-all flex items-center gap-3"
        >
          <span className="text-2xl">🪄</span>
          <div className="text-left">
            <div className="font-semibold">Guided Setup</div>
            <div className="text-sm text-blue-200">Walk me through it step by step</div>
          </div>
        </button>

        {/* Manual Setup - Secondary */}
        <button
          onClick={handleManual}
          className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all flex items-center gap-3"
        >
          <span className="text-2xl">⚙️</span>
          <div className="text-left">
            <div className="font-semibold">Manual Setup</div>
            <div className="text-sm text-gray-400">I know DMX, show me the patch table</div>
          </div>
        </button>

        {/* Import - Secondary */}
        <button
          onClick={handleImport}
          className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all flex items-center gap-3"
        >
          <span className="text-2xl">📁</span>
          <div className="text-left">
            <div className="font-semibold">Import Project</div>
            <div className="text-sm text-gray-400">Restore from a backup file</div>
          </div>
        </button>
      </div>

      {/* Skip option */}
      <button
        onClick={() => navigate('/')}
        className="mt-8 text-gray-500 hover:text-gray-400 text-sm"
      >
        Skip for now
      </button>
    </div>
  );
}

export default WelcomeStep;
