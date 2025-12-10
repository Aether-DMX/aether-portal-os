/**
 * SetupWizard.jsx
 * First-run setup wizard for AETHER DMX
 * Guides users through: Zones → Fixtures → Nodes → Test
 * 
 * API Endpoints Used (aether-core:8891):
 * - GET /api/fixtures
 * - POST /api/fixtures
 * - GET /api/groups  
 * - POST /api/groups
 * - GET /api/nodes
 * - POST /api/nodes/:id/configure
 * - POST /api/dmx/set
 * - POST /api/settings/system
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSetupStore from '../store/setupStore';

// Step components
import WelcomeStep from '../components/setup/WelcomeStep';
import ZonesStep from '../components/setup/ZonesStep';
import FixturesStep from '../components/setup/FixturesStep';
import NodesStep from '../components/setup/NodesStep';
import CompleteStep from '../components/setup/CompleteStep';

function SetupWizard() {
  const navigate = useNavigate();
  const { step, reset } = useSetupStore();

  // Reset wizard state when mounting
  useEffect(() => {
    // Optionally reset on mount - uncomment if you want fresh start each time
    // reset();
  }, []);

  // Progress indicator
  const steps = [
    { num: 1, label: 'Welcome' },
    { num: 2, label: 'Zones' },
    { num: 3, label: 'Fixtures' },
    { num: 4, label: 'Nodes' },
    { num: 5, label: 'Complete' },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-black">
      {/* Header with progress */}
      {step > 1 && step < 5 && (
        <div className="px-4 pt-4 pb-2">
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-2">
            {steps.map((s, i) => (
              <React.Fragment key={s.num}>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step >= s.num 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/10 text-gray-500'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 ${step > s.num ? 'bg-blue-500' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-sm text-gray-400 text-center">
            Step {step} of 5 — {steps[step - 1]?.label}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-hidden">
        {step === 1 && <WelcomeStep />}
        {step === 2 && <ZonesStep />}
        {step === 3 && <FixturesStep />}
        {step === 4 && <NodesStep />}
        {step === 5 && <CompleteStep />}
      </div>
    </div>
  );
}

export default SetupWizard;
