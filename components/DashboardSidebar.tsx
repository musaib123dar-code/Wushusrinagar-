
import React from 'react';
import { UserRole } from '../types';

interface DashboardSidebarProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ role, activeTab, setActiveTab }) => {
  const adminLinks = [
    { id: 'stats', label: 'Command Center', icon: '📊' },
    { id: 'tournaments', label: 'Manage Events', icon: '🏆' },
    { id: 'players', label: 'Athlete Registry', icon: '🥋' },
    { id: 'officials', label: 'Officials Panel', icon: '⚖️' },
  ];

  const officialLinks = [
    { id: 'fixtures', label: 'Scoring Control', icon: '🥊' },
  ];

  const playerLinks = [
    { id: 'profile', label: 'My Identity', icon: '👤' },
  ];

  const links = role === UserRole.ADMIN ? adminLinks : role === UserRole.OFFICIAL ? officialLinks : playerLinks;

  return (
    <div className="w-full lg:w-80 bg-white shadow-2xl lg:min-h-[calc(100vh-64px)] z-20 border-r border-slate-50 flex flex-col">
      <div className="p-10 border-b-2 border-slate-50 bg-slate-50">
        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Terminal</h2>
      </div>
      <nav className="mt-8 px-6 space-y-4 flex-grow">
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => setActiveTab(link.id)}
            className={`w-full flex items-center px-6 py-5 text-sm font-black uppercase tracking-widest rounded-[28px] transition-all duration-300 ${
              activeTab === link.id
                ? 'bg-red-600 text-white shadow-2xl shadow-red-200 translate-x-2'
                : 'text-slate-600 hover:bg-slate-50 hover:text-red-600'
            }`}
          >
            <span className="mr-5 text-2xl">{link.icon}</span>
            {link.label}
          </button>
        ))}
      </nav>
      
      <div className="p-10">
        <div className="p-6 bg-slate-900 rounded-[32px] text-[10px] text-slate-500 border border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-2 h-full bg-red-600 opacity-20"></div>
           <p className="font-black text-white mb-2 uppercase tracking-widest">Srinagar Association</p>
           <p className="opacity-60">System Core v1.2.0-secure</p>
           <p className="mt-4 text-red-500 font-black tracking-widest uppercase">● Encryption Active</p>
        </div>
      </div>
    </div>
  );
};
