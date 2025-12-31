
import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { User, UserRole, Tournament, AuthState, Bout, Gender, PlayerStatus } from './types';
import { Layout } from './components/Layout';
import { INITIAL_ADMIN } from './constants';
import { DashboardSidebar } from './components/DashboardSidebar';
import { PlayerIDCard } from './components/PlayerIDCard';
import { geminiService } from './services/geminiService';
import { api } from './services/api';

const App: React.FC = () => {
  // --- Global App State ---
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [players, setPlayers] = useState<User[]>([]);
  const [officials, setOfficials] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [bouts, setBouts] = useState<Bout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- UI State ---
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeTab, setActiveTab] = useState<string>('stats');
  const [scoringSubTab, setScoringSubTab] = useState<'upcoming' | 'active' | 'completed'>('upcoming');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [registrySearch, setRegistrySearch] = useState<string>('');
  
  // Edit & Add Modal/Form States
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingOfficialId, setEditingOfficialId] = useState<string | null>(null);
  const [isAddingOfficial, setIsAddingOfficial] = useState(false);
  const [activeCategoryAddId, setActiveCategoryAddId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  
  // New Entry Temp States
  const [newOfficialName, setNewOfficialName] = useState('');
  const [newOfficialEmail, setNewOfficialEmail] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // AI State
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Tournament Management UI
  const [expandedTournamentId, setExpandedTournamentId] = useState<string | null>(null);
  const [tournamentSubTab, setTournamentSubTab] = useState<'config' | 'players' | 'matches' | 'bracket'>('config');
  const [selectedCategory, setSelectedCategory] = useState<{ [key: string]: string }>({});
  const [enrollFilter, setEnrollFilter] = useState({
    gender: 'ALL' as Gender | 'ALL',
    weightMin: 0, weightMax: 120,
    ageMin: 5, ageMax: 70
  });

  const [regData, setRegData] = useState({ name: '', email: '', dob: '', gender: Gender.MALE, weight: '', academy: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Data Loading ---
  useEffect(() => {
    const initData = async () => {
      const [p, o, t, b] = await Promise.all([
        api.players.getAll(),
        api.officials.getAll(),
        api.tournaments.getAll(),
        api.bouts.getAll()
      ]);
      setPlayers(p);
      setOfficials(o);
      setTournaments(t);
      setBouts(b);
      setIsLoading(false);
    };
    initData();
  }, []);

  // --- Persistence Sync ---
  useEffect(() => { if (!isLoading) api.players.saveAll(players); }, [players, isLoading]);
  useEffect(() => { if (!isLoading) api.officials.saveAll(officials); }, [officials, isLoading]);
  useEffect(() => { if (!isLoading) api.tournaments.saveAll(tournaments); }, [tournaments, isLoading]);
  useEffect(() => { if (!isLoading) api.bouts.saveAll(bouts); }, [bouts, isLoading]);

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    let foundUser: User | null = null;
    const lowerEmail = loginEmail.toLowerCase();
    
    if (lowerEmail === INITIAL_ADMIN.email.toLowerCase() && (loginPassword === 'admin123' || loginPassword === 'password')) {
      foundUser = INITIAL_ADMIN;
    } else {
      const allUsers = [...officials, ...players];
      const user = allUsers.find(u => u.email.toLowerCase() === lowerEmail);
      if (user && (loginPassword === 'password' || loginPassword === 'password123')) foundUser = user;
    }
    
    if (foundUser) {
      setAuth({ user: foundUser, isAuthenticated: true });
      setCurrentView('dashboard');
      setActiveTab(foundUser.role === UserRole.ADMIN ? 'stats' : (foundUser.role === UserRole.OFFICIAL ? 'fixtures' : 'profile'));
    } else setLoginError('Invalid credentials.');
  };

  const handleAddOfficial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficialName.trim()) return;
    const newOff: User = {
      id: `off-${Date.now()}`,
      name: newOfficialName,
      email: newOfficialEmail || `${newOfficialName.toLowerCase().replace(/\s/g, '')}@wushu.com`,
      role: UserRole.OFFICIAL,
      joinedDate: new Date().toISOString().split('T')[0],
      avatar: `https://picsum.photos/seed/${Date.now()}/200/200`
    };
    setOfficials(prev => [...prev, newOff]);
    setNewOfficialName('');
    setNewOfficialEmail('');
    setIsAddingOfficial(false);
  };

  const handleAddCategory = (tournamentId: string) => {
    if (!newCategoryName.trim()) return;
    setTournaments(prev => prev.map(t => t.id === tournamentId ? {
      ...t, 
      categories: [...t.categories, newCategoryName], 
      categoryPlayers: { ...t.categoryPlayers, [newCategoryName]: [] }
    } : t));
    setNewCategoryName('');
    setActiveCategoryAddId(null);
  };

  // Add handleUpdateOfficial to fix: Cannot find name 'handleUpdateOfficial'
  const handleUpdateOfficial = (id: string) => {
    setOfficials(prev => prev.map(off => off.id === id ? { ...off, ...editFormData } : off));
    setEditingOfficialId(null);
    setEditFormData({});
  };

  // Add confirmFilteredSquad to fix: Cannot find name 'confirmFilteredSquad'
  const confirmFilteredSquad = (tournamentId: string, category: string) => {
    if (!category) return alert("Please select a category first.");
    const filteredPlayers = players.filter(p => {
      if (enrollFilter.gender !== 'ALL' && p.gender !== enrollFilter.gender) return false;
      if (p.weight && (p.weight < enrollFilter.weightMin || p.weight > enrollFilter.weightMax)) return false;
      return true;
    });

    if (filteredPlayers.length === 0) {
      alert("No athletes match the current enrollment filters.");
      return;
    }

    setTournaments(prev => prev.map(t => {
      if (t.id === tournamentId) {
        const currentIds = t.categoryPlayers[category] || [];
        const newIds = filteredPlayers.map(p => p.id).filter(id => !currentIds.includes(id));
        return {
          ...t,
          categoryPlayers: { ...t.categoryPlayers, [category]: [...currentIds, ...newIds] }
        };
      }
      return t;
    }));
    alert(`Successfully enrolled ${filteredPlayers.length} athletes into ${category}.`);
  };

  const handleComplexAnalysis = async () => {
    if (!aiQuery.trim()) return;
    setIsAnalyzing(true);
    const result = await geminiService.getComplexAnalysis(aiQuery, { playersCount: players.length, tournamentsCount: tournaments.length });
    setAiAnalysis(result || "Analysis core resulted in an empty response.");
    setIsAnalyzing(false);
  };

  const generateKnockoutFixtures = (tournamentId: string, category: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament || !category) return;
    
    const athleteIds = tournament.categoryPlayers[category] || [];
    if (athleteIds.length < 2) return alert("At least 2 athletes required.");

    let bracketSize = 1;
    while (bracketSize < athleteIds.length) bracketSize *= 2;
    const totalRounds = Math.log2(bracketSize);
    const byes = bracketSize - athleteIds.length;

    const shuffledIds = [...athleteIds].sort(() => Math.random() - 0.5);
    let allMatches: Bout[] = [];

    let index = 0;
    for (let i = 0; i < bracketSize / 2; i++) {
      const bout: Bout = {
        id: `B-${tournamentId}-${category.replace(/\s+/g, '')}-R1-M${i + 1}`,
        tournamentId, category, player1Score: 0, player2Score: 0, round: 1, matchNumber: i + 1, status: 'PENDING'
      };
      if (i < byes) {
        bout.player1Id = shuffledIds[index++];
        bout.status = 'BYE';
        bout.winnerId = bout.player1Id;
      } else {
        bout.player1Id = shuffledIds[index++];
        bout.player2Id = shuffledIds[index++];
      }
      allMatches.push(bout);
    }

    for (let r = 2; r <= totalRounds; r++) {
      const matchesInRound = Math.pow(2, totalRounds - r);
      for (let m = 1; m <= matchesInRound; m++) {
        allMatches.push({
          id: `B-${tournamentId}-${category.replace(/\s+/g, '')}-R${r}-M${m}`,
          tournamentId, category, player1Score: 0, player2Score: 0, round: r, matchNumber: m, status: 'PENDING'
        });
      }
    }

    // Propagate byes
    allMatches.filter(b => b.round === 1 && b.status === 'BYE').forEach(byeBout => {
      const nextBout = allMatches.find(b => b.round === 2 && b.matchNumber === Math.ceil(byeBout.matchNumber / 2));
      if (nextBout) {
        if (byeBout.matchNumber % 2 !== 0) nextBout.player1Id = byeBout.winnerId;
        else nextBout.player2Id = byeBout.winnerId;
      }
    });

    setBouts(prev => [
      ...prev.filter(b => !(b.tournamentId === tournamentId && b.category === category)), 
      ...allMatches
    ]);
    alert("Bracket finalized.");
  };

  const updateBoutScore = (boutId: string, pNum: 1 | 2, val: number) => {
    setBouts(prev => prev.map(b => b.id === boutId ? {
      ...b, [pNum === 1 ? 'player1Score' : 'player2Score']: Math.max(0, (pNum === 1 ? b.player1Score : b.player2Score) + val),
      status: (b.status === 'FINISHED' ? 'FINISHED' : 'LIVE') as any
    } : b));
  };

  const finalizeBout = (boutId: string) => {
    const currentBout = bouts.find(b => b.id === boutId);
    if (!currentBout || currentBout.player1Score === currentBout.player2Score) return;
    const winnerId = currentBout.player1Score > currentBout.player2Score ? currentBout.player1Id : currentBout.player2Id;
    
    setBouts(prev => {
      const updated = prev.map(b => b.id === boutId ? { ...b, status: 'FINISHED' as const, winnerId } : b);
      const nextBout = updated.find(b => 
        b.tournamentId === currentBout.tournamentId && 
        b.category === currentBout.category && 
        b.round === currentBout.round + 1 && 
        b.matchNumber === Math.ceil(currentBout.matchNumber / 2)
      );
      if (nextBout) {
        if (currentBout.matchNumber % 2 !== 0) nextBout.player1Id = winnerId;
        else nextBout.player2Id = winnerId;
      }
      return updated;
    });
  };

  // --- Dashboard Tab Components ---
  const renderStats = () => (
    <div className="space-y-12 animate-fade-in">
      <h2 className="text-4xl font-black uppercase tracking-tighter">Command Center</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Athletes', val: players.length, icon: '🥋' },
          { label: 'Live Arena', val: bouts.filter(b => b.status === 'LIVE').length, icon: '⚡', highlight: true },
          { label: 'Events', val: tournaments.length, icon: '🏆' },
          { label: 'Officials', val: officials.length, icon: '⚖️' }
        ].map(stat => (
          <div key={stat.label} className={`p-8 rounded-[40px] border-2 border-slate-100 flex flex-col justify-between shadow-lg transition duration-500 group ${stat.highlight ? 'bg-red-600 text-white' : 'bg-slate-50'}`}>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">{stat.icon}</div>
            <div className="mt-8">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{stat.label}</p>
              <p className="text-5xl font-black mt-2">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl"></div>
        <h3 className="text-[11px] font-black uppercase text-red-500 tracking-[0.4em] mb-8 flex items-center gap-3">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          G3P Strategic Engine
        </h3>
        <div className="flex gap-4">
          <input 
            className="flex-grow bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-sm font-black uppercase outline-none focus:border-red-600 transition"
            placeholder="Consult the association's technical AI core..." 
            value={aiQuery} onChange={e => setAiQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleComplexAnalysis()}
          />
          <button onClick={handleComplexAnalysis} disabled={isAnalyzing} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition active:scale-95 disabled:opacity-50">
            {isAnalyzing ? 'Thinking...' : 'Analyze'}
          </button>
        </div>
        {aiAnalysis && <div className="mt-8 p-8 bg-white/5 border border-white/10 rounded-3xl animate-fade-in text-slate-300 text-sm italic leading-loose whitespace-pre-wrap">{aiAnalysis}</div>}
      </div>
    </div>
  );

  const renderOfficials = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start border-b pb-8">
        <h2 className="text-4xl font-black uppercase tracking-tighter">Officials Panel</h2>
        <button onClick={() => setIsAddingOfficial(true)} className="bg-red-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition active:scale-95">+ New Official</button>
      </div>

      {isAddingOfficial && (
        <div className="p-10 bg-slate-50 border-2 border-slate-200 rounded-[40px] animate-fade-in shadow-inner">
          <h3 className="text-xs font-black uppercase mb-6 tracking-widest text-slate-600">Administrative Appointment</h3>
          <form onSubmit={handleAddOfficial} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Full Name</label>
              <input required className="w-full p-4 rounded-2xl border-2 font-black uppercase text-[10px] outline-none focus:border-red-600" value={newOfficialName} onChange={e => setNewOfficialName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Email</label>
              <input type="email" className="w-full p-4 rounded-2xl border-2 font-black uppercase text-[10px] outline-none focus:border-red-600" value={newOfficialEmail} onChange={e => setNewOfficialEmail(e.target.value)} />
            </div>
            <div className="flex gap-4 md:col-span-2 pt-4">
              <button type="submit" className="bg-red-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg">Confirm Appointment</button>
              <button type="button" onClick={() => setIsAddingOfficial(false)} className="bg-slate-300 text-slate-700 px-8 py-3 rounded-2xl text-[10px] font-black uppercase">Discard</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {officials.map(off => {
          const isEditing = editingOfficialId === off.id;
          return (
            <div key={off.id} className="bg-white p-8 rounded-[40px] border-2 border-slate-50 flex flex-col items-center space-y-4 group transition hover:border-red-600 shadow-sm relative overflow-hidden">
              <img src={off.avatar} className="w-24 h-24 rounded-3xl object-cover shadow-2xl transition duration-500" />
              <div className="text-center w-full">
                {isEditing ? (
                  <div className="space-y-2">
                    <input className="w-full border p-2 rounded-xl text-center text-xs font-black uppercase" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                    <input className="w-full border p-2 rounded-xl text-center text-[10px] font-black uppercase" value={editFormData.email || ''} onChange={e => setEditFormData({...editFormData, email: e.target.value})} />
                    <div className="flex gap-2 justify-center mt-4">
                      <button onClick={() => handleUpdateOfficial(off.id)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase">Save</button>
                      <button onClick={() => setEditingOfficialId(null)} className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xl font-black uppercase tracking-tight">{off.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{off.email}</p>
                    <div className="flex gap-4 justify-center mt-6 opacity-0 group-hover:opacity-100 transition duration-300">
                       <button onClick={() => { setEditingOfficialId(off.id); setEditFormData(off); }} className="text-[9px] font-black uppercase text-slate-600 hover:underline">Edit</button>
                       <button onClick={() => setOfficials(prev => prev.filter(x => x.id !== off.id))} className="text-[9px] font-black uppercase text-red-600 hover:underline">Delete</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTournaments = () => (
    <div className="space-y-10 animate-fade-in">
      <h2 className="text-4xl font-black uppercase tracking-tighter border-b pb-8">Tournament Command</h2>
      {tournaments.map(t => (
        <div key={t.id} className="border-4 border-slate-50 rounded-[40px] overflow-hidden bg-white mb-6 shadow-sm">
          <div className="p-8 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">{t.title}</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">📍 {t.location} • {t.date}</p>
            </div>
            <button onClick={() => setExpandedTournamentId(expandedTournamentId === t.id ? null : t.id)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl transition active:scale-95">Terminal Access</button>
          </div>
          {expandedTournamentId === t.id && (
            <div className="p-8 border-t-2 animate-fade-in">
              <div className="flex gap-6 border-b mb-8 overflow-x-auto pb-2">
                {['config', 'players', 'matches', 'bracket'].map(sub => (
                  <button key={sub} onClick={() => setTournamentSubTab(sub as any)} className={`text-[10px] font-black uppercase tracking-widest pb-3 border-b-4 transition duration-300 ${tournamentSubTab === sub ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400'}`}>{sub}</button>
                ))}
              </div>

              {tournamentSubTab === 'config' && (
                <div className="space-y-10 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Title</label><input className="w-full p-4 rounded-2xl border-2 bg-slate-50 text-xs font-black focus:border-red-600 outline-none" value={t.title} onChange={e => setTournaments(prev => prev.map(x => x.id === t.id ? {...x, title: e.target.value} : x))} /></div>
                     <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Location</label><input className="w-full p-4 rounded-2xl border-2 bg-slate-50 text-xs font-black focus:border-red-600 outline-none" value={t.location} onChange={e => setTournaments(prev => prev.map(x => x.id === t.id ? {...x, location: e.target.value} : x))} /></div>
                  </div>
                  <div className="pt-8 border-t">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bracket Categories</h4>
                      {activeCategoryAddId === t.id ? (
                        <div className="flex gap-2 animate-fade-in items-center bg-slate-50 p-3 rounded-2xl border-2">
                          <input 
                            className="p-2 rounded-xl border bg-white text-[10px] font-black uppercase outline-none focus:border-red-600"
                            placeholder="New Category Label..."
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleAddCategory(t.id)}
                          />
                          <button onClick={() => handleAddCategory(t.id)} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase transition shadow-md">Add</button>
                          <button onClick={() => setActiveCategoryAddId(null)} className="text-[8px] font-black uppercase text-slate-400">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setActiveCategoryAddId(t.id)} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase shadow-lg">+ New Category</button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {t.categories.map(c => (
                        <div key={c} className="bg-slate-100 px-6 py-3 rounded-2xl flex items-center gap-4 text-[10px] font-black uppercase shadow-inner border">
                          {c}
                          <button onClick={() => setTournaments(prev => prev.map(x => x.id === t.id ? {...x, categories: x.categories.filter(cat => cat !== c)} : x))} className="text-red-500 font-black hover:text-red-700 transition">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tournamentSubTab === 'players' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-slate-50 p-8 rounded-[40px] space-y-8 border shadow-inner">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Squad Assignment</h5>
                    <select className="w-full p-4 rounded-2xl border-2 bg-white text-[11px] font-black uppercase outline-none focus:border-red-600 mb-6 shadow-sm" value={selectedCategory[t.id] || ''} onChange={e => setSelectedCategory({ ...selectedCategory, [t.id]: e.target.value })}><option value="">Select Category...</option>{t.categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <button onClick={() => confirmFilteredSquad(t.id, selectedCategory[t.id])} className="w-full bg-red-600 text-white py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition active:scale-95">Enroll Matching Athletes</button>
                  </div>
                  <div className="bg-slate-900 p-8 rounded-[48px] text-white shadow-2xl overflow-hidden">
                     <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-8 border-b border-white/10 pb-4">Assigned Athletes ({selectedCategory[t.id] ? (t.categoryPlayers[selectedCategory[t.id]] || []).length : 0})</h5>
                     <div className="space-y-3 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                        {(t.categoryPlayers[selectedCategory[t.id]] || []).map(pid => <div key={pid} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-black uppercase">{players.find(x => x.id === pid)?.name}</div>)}
                     </div>
                     {(t.categoryPlayers[selectedCategory[t.id]] || []).length >= 2 && <button onClick={() => generateKnockoutFixtures(t.id, selectedCategory[t.id])} className="w-full bg-white text-slate-900 py-5 rounded-3xl font-black uppercase text-[11px] mt-8 shadow-2xl transition hover:bg-red-50 active:scale-95">Generate Official Bracket</button>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-black text-4xl animate-pulse">TERMINAL LOADING...</div>;

  return (
    <Layout user={auth.user} onLogout={() => { setAuth({ user: null, isAuthenticated: false }); setCurrentView('home'); }} onNavigate={setCurrentView}>
      {currentView === 'home' && (
        <div className="animate-fade-in relative bg-slate-900 py-48 md:py-64 overflow-hidden">
          <div className="absolute inset-0 opacity-20"><img src="https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2000" className="w-full h-full object-cover" /></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
             <div className="inline-block bg-red-600 text-white px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-12 shadow-2xl">District Wushu Association Srinagar</div>
             <h1 className="text-8xl md:text-[14rem] font-black text-white uppercase tracking-tighter leading-[0.8] mb-12">Kashmir <span className="text-red-600 italic block">Wushu</span></h1>
             <p className="text-slate-400 max-w-xl mx-auto mb-16 font-medium text-lg opacity-80">Developing championship talent with technical precision.</p>
             <div className="flex flex-wrap justify-center gap-8 mt-12">
              <button onClick={() => setCurrentView('register')} className="bg-red-600 text-white px-16 py-8 rounded-[40px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition active:scale-95">Enroll Warrior</button>
              <button onClick={() => setCurrentView('tournaments')} className="bg-white text-slate-900 px-16 py-8 rounded-[40px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition active:scale-95">Arena Events</button>
             </div>
          </div>
        </div>
      )}
      
      {currentView === 'login' && (
        <div className="max-w-md mx-auto py-32 px-6">
          <form onSubmit={handleLogin} className="bg-white p-12 md:p-16 rounded-[60px] shadow-2xl border-2 space-y-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-center mb-10">Terminal Auth</h2>
            <div className="space-y-4">
              <input required type="email" placeholder="Email" className="w-full p-6 rounded-3xl border-2 bg-slate-50 font-black uppercase focus:border-red-600 outline-none" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              <input required type="password" placeholder="Passphrase" className="w-full p-6 rounded-3xl border-2 bg-slate-50 font-black uppercase focus:border-red-600 outline-none" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-red-600 text-white py-8 rounded-[32px] font-black uppercase tracking-[0.4em] transition active:scale-95">Authenticate</button>
          </form>
        </div>
      )}

      {currentView === 'dashboard' && (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
          <DashboardSidebar role={auth.user!.role} activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="flex-grow p-4 lg:p-12 bg-slate-100 overflow-y-auto">
            <div className="bg-white rounded-[48px] shadow-sm p-6 lg:p-10 min-h-full">
               {activeTab === 'stats' && renderStats()}
               {activeTab === 'officials' && renderOfficials()}
               {activeTab === 'tournaments' && renderTournaments()}
               {activeTab === 'profile' && auth.user?.role === UserRole.PLAYER && (
                  <div className="flex flex-col items-center py-20 space-y-12 animate-fade-in">
                    <h2 className="text-6xl font-black uppercase tracking-tighter">Athlete Passport</h2>
                    <PlayerIDCard player={auth.user} showDownload={true} />
                  </div>
               )}
               {activeTab === 'fixtures' && (
                  <div className="space-y-8 animate-fade-in">
                    <h2 className="text-4xl font-black uppercase tracking-tighter border-b pb-8">Arena Control</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {bouts.filter(b => b.status === 'LIVE').map(bout => (
                        <div key={bout.id} className="p-10 bg-slate-900 rounded-[60px] text-white flex flex-col items-center gap-12 shadow-2xl">
                           <p className="text-red-600 text-[14px] font-black uppercase tracking-widest">{bout.category}</p>
                           <div className="flex items-center gap-12 w-full justify-center">
                              <div className="text-center flex-1">
                                 <span className="text-[12px] font-black block mb-4">{players.find(p => p.id === bout.player1Id)?.name}</span>
                                 <div className="text-9xl font-black text-red-600">{bout.player1Score}</div>
                                 <div className="flex gap-4 justify-center mt-6">
                                    <button onClick={() => updateBoutScore(bout.id, 1, 1)} className="bg-white/10 w-12 h-12 rounded-xl text-xl font-black">+</button>
                                    <button onClick={() => updateBoutScore(bout.id, 1, -1)} className="bg-white/10 w-12 h-12 rounded-xl text-xl font-black">-</button>
                                 </div>
                              </div>
                              <div className="text-3xl font-black text-white/20">VS</div>
                              <div className="text-center flex-1">
                                 <span className="text-[12px] font-black block mb-4">{players.find(p => p.id === bout.player2Id)?.name}</span>
                                 <div className="text-9xl font-black text-blue-500">{bout.player2Score}</div>
                                 <div className="flex gap-4 justify-center mt-6">
                                    <button onClick={() => updateBoutScore(bout.id, 2, 1)} className="bg-white/10 w-12 h-12 rounded-xl text-xl font-black">+</button>
                                    <button onClick={() => updateBoutScore(bout.id, 2, -1)} className="bg-white/10 w-12 h-12 rounded-xl text-xl font-black">-</button>
                                 </div>
                              </div>
                           </div>
                           <button onClick={() => finalizeBout(bout.id)} disabled={bout.player1Score === bout.player2Score} className="w-full bg-red-600 text-white py-6 rounded-[32px] font-black uppercase text-[12px] tracking-widest disabled:opacity-30">Final Verdict</button>
                        </div>
                      ))}
                    </div>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
