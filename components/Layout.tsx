
import React from 'react';
import { UserRole, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="bg-red-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => onNavigate('home')}
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 shadow-inner">
                <span className="text-red-700 font-bold text-xl">W</span>
              </div>
              <div className="hidden md:block">
                <h1 className="font-bold text-lg leading-tight">District Wushu Association</h1>
                <p className="text-xs text-red-100 uppercase tracking-widest">Srinagar, Kashmir</p>
              </div>
            </div>

            <div className="flex space-x-4 items-center">
              <button onClick={() => onNavigate('home')} className="hover:text-red-200 px-2 text-sm font-medium">Home</button>
              <button onClick={() => onNavigate('live')} className="hover:text-red-200 px-2 text-sm font-medium flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-1.5 animate-pulse"></span>
                Live
              </button>
              <button onClick={() => onNavigate('tournaments')} className="hover:text-red-200 px-2 text-sm font-medium">Events</button>
              
              {!user ? (
                <button 
                  onClick={() => onNavigate('login')}
                  className="bg-white text-red-700 px-4 py-1.5 rounded-full font-semibold text-sm hover:bg-red-50 transition ml-2"
                >
                  Login
                </button>
              ) : (
                <div className="flex items-center space-x-4 ml-4">
                  <button 
                    onClick={() => onNavigate('dashboard')}
                    className="text-sm font-medium border-b-2 border-transparent hover:border-white transition"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={onLogout}
                    className="text-xs bg-red-800 px-3 py-1 rounded hover:bg-red-900 transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="text-white font-bold text-base mb-4 uppercase tracking-wider">About DWA Srinagar</h3>
            <p className="leading-relaxed">
              Committed to promoting the martial art of Wushu in Srinagar district. 
              We nurture talent, conduct championships, and follow the guidelines of 
              the Wushu Association of J&K.
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold text-base mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              <li className="hover:text-white transition cursor-pointer">Official Guidelines</li>
              <li className="hover:text-white transition cursor-pointer">Tournament Calendar</li>
              <li className="hover:text-white transition cursor-pointer">Registration Portal</li>
              <li className="hover:text-white transition cursor-pointer">Contact Us</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-base mb-4 uppercase tracking-wider">Contact</h3>
            <p>Srinagar</p>
            <p>Email: contact@wushusrinagar.com</p>
            <p>Phone: +91 194-XXXXXXX</p>
            <div className="mt-4 flex space-x-4">
              <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center hover:bg-red-700 cursor-pointer transition">F</div>
              <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center hover:bg-red-700 cursor-pointer transition">T</div>
              <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center hover:bg-red-700 cursor-pointer transition">I</div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-xs">
          &copy; {new Date().getFullYear()} District Wushu Association Srinagar. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};
