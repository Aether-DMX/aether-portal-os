import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, Zap, Layers, Calendar, Settings } from 'lucide-react';

const mainButtons = [
  { name: 'Live DMX', icon: Sliders, path: '/live-dmx', desc: 'Control & Monitor' },
  { name: 'Effects', icon: Zap, path: '/dmx-effects', desc: 'Scenes & Chases' },
  { name: 'Fixtures', icon: Layers, path: '/fixtures-menu', desc: 'Patch & Groups' },
  { name: 'Schedules', icon: Calendar, path: '/schedules-menu', desc: 'Automation' },
  { name: 'Settings', icon: Settings, path: '/settings', desc: 'System Config' },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="page-center">
        <div className="flex flex-row flex-nowrap gap-4 justify-center items-center">
          {mainButtons.map((item, index) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="menu-card"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="menu-card-icon">
                <item.icon size={28} color="white" strokeWidth={2.5} />
              </div>
              <span className="menu-card-title">{item.name}</span>
              <span className="menu-card-desc">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const DashboardHeaderExtension = () => null;
