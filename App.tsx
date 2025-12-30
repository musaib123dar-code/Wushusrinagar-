
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { User, UserRole, Tournament, AuthState, Bout, Gender, PlayerStatus } from './types';
import { Layout } from './components/Layout';
import { 
  INITIAL_ADMIN, 
  INITIAL_OFFICIALS, 
  INITIAL_PLAYERS, 
  INITIAL_TOURNAMENTS, 
  INITIAL_ANNOUNCEMENTS 
} from './constants';
import { DashboardSidebar } from './components/DashboardSidebar';
import { PlayerIDCard } from './components/PlayerIDCard';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  // --- Global App State ---
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [players, setPlayers] = useState<User[]>(() => {
    const saved = localStorage.getItem('dwa_players_v5');
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });
  const [officials] = useState<User[]>(INITIAL_OFFICIALS);
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem('dwa_tournaments_v5');
    return saved ? JSON.parse(saved) : INITIAL_TOURNAMENTS;
  });
  const [bouts, setBouts] = useState<Bout[]>(() => {
    const saved = localStorage.getItem('dwa_bouts_v5');
    return saved ? JSON.parse(saved) : [];
  });

  // --- UI State ---
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeTab, setActiveTab] = useState<string>('stats');
  const [scoringSubTab, setScoringSubTab] = useState<'upcoming' | 'active' | 'completed'>('upcoming');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [registrySearch, setRegistrySearch] = useState<string>('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  
  // Registration form
  const [regData, setRegData] = useState({
    name: '', email: '', dob: '', gender: Gender.MALE, weight: '', academy: ''
  });

  // Tournament Management State
  const [expandedTournamentId, setExpandedTournamentId] = useState<string | null>(null);
  const [tournamentSubTab, setTournamentSubTab] = useState<'config' | 'players' | 'matches' | 'bracket'>('config');
  const [selectedCategory, setSelectedCategory] = useState<{ [key: string]: string }>({});
  const [enrollFilter, setEnrollFilter] = useState({
    gender: 'ALL' as Gender | 'ALL',
    weightMin: 0, weightMax: 120,
    ageMin: 5, ageMax: 70
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Persistence ---
  useEffect(() => { localStorage.setItem('dwa_bouts_v5', JSON.stringify(bouts)); }, [bouts]);
  useEffect(() => { localStorage.setItem('dwa_players_v5', JSON.stringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem('dwa_tournaments_v5', JSON.stringify(tournaments)); }, [tournaments]);

  useEffect(() => {
    const fetchAi = async () => {
      if (tournaments.length > 0) {
        const summary = await geminiService.generateTournamentSummary(tournaments[0].title, tournaments[0].description);
        setAiSummary(summary);
      }
    };
    fetchAi();
  }, [tournaments]);

  // --- Helpers ---
  const calculateAge = (dob: string | undefined) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const getAgeGroup = (age: number) => {
    if (age < 12) return 'Sub-Junior';
    if (age < 18) return 'Junior';
    if (age < 35) return 'Senior';
    return 'Veteran';
  };

  const downloadBulkTemplate = () => {
    const data = [
      { Name: "John Doe", Email: "john@example.com", Gender: "MALE", DOB: "2005-01-01", Weight: "65", Academy: "Srinagar Wushu Academy" },
      { Name: "Jane Smith", Email: "jane@example.com", Gender: "FEMALE", DOB: "2008-05-12", Weight: "52", Academy: "Dal Lake Wushu Club" }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Athletes");
    XLSX.writeFile(wb, "DWA_Athlete_Import_Template.xlsx");
  };

  // --- Logic ---
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
      if (foundUser.role === UserRole.ADMIN) setActiveTab('stats');
      else if (foundUser.role === UserRole.OFFICIAL) setActiveTab('fixtures');
      else setActiveTab('profile');
    } else setLoginError('Invalid credentials.');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: `ply-${Date.now()}`,
      name: regData.name,
      email: regData.email,
      role: UserRole.PLAYER,
      gender: regData.gender,
      dob: regData.dob,
      weight: parseFloat(regData.weight),
      academy: regData.academy,
      district: 'Srinagar',
      status: 'VERIFIED',
      verified: true,
      joinedDate: new Date().toISOString().split('T')[0],
      avatar: `https://picsum.photos/seed/${Date.now()}/200/200`,
      stats: { wins: 0, losses: 0, medals: { gold: 0, silver: 0, bronze: 0 } }
    };
    setPlayers(prev => [...prev, newUser]);
    alert("Registration Successful!");
    setCurrentView('home');
  };

  const handleUpdatePlayer = (id: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...editFormData } : p));
    setEditingPlayerId(null);
    setEditFormData({});
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        const newPlayers: User[] = data.map((row: any) => ({
          id: `ply-bulk-${Math.random().toString(36).substr(2, 5)}`,
          name: row.Name || 'Athlete',
          email: row.Email || '',
          role: UserRole.PLAYER,
          gender: (row.Gender || 'MALE').toUpperCase() as Gender,
          dob: row.DOB || '',
          weight: parseFloat(row.Weight || '0'),
          academy: row.Academy || 'District Academy',
          district: 'Srinagar',
          status: 'VERIFIED',
          verified: true,
          joinedDate: new Date().toISOString().split('T')[0],
          avatar: `https://picsum.photos/seed/${Math.random()}/200/200`,
          stats: { wins: 0, losses: 0, medals: { gold: 0, silver: 0, bronze: 0 } }
        }));
        setPlayers(prev => [...prev, ...newPlayers]);
        alert(`Imported ${newPlayers.length} athletes.`);
      } catch (err) {
        alert("File parsing error. Use the template.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const addCategory = (tournamentId: string) => {
    const name = prompt("Category Name (e.g. Senior Men 65kg):");
    if (!name) return;
    setTournaments(prev => prev.map(t => t.id === tournamentId ? {
      ...t, categories: [...t.categories, name], categoryPlayers: { ...t.categoryPlayers, [name]: [] }
    } : t));
  };

  const confirmFilteredSquad = (tournamentId: string, category: string) => {
    if (!category) return alert("Select a bracket first.");
    const matchingIds = players.filter(p => {
      if (p.status !== 'VERIFIED') return false;
      const age = calculateAge(p.dob);
      const genderMatch = enrollFilter.gender === 'ALL' || p.gender === enrollFilter.gender;
      const weightMatch = (p.weight || 0) >= enrollFilter.weightMin && (p.weight || 0) <= enrollFilter.weightMax;
      const ageMatch = age >= enrollFilter.ageMin && age <= enrollFilter.ageMax;
      return genderMatch && weightMatch && ageMatch;
    }).map(p => p.id);

    setTournaments(prev => prev.map(t => t.id === tournamentId ? {
      ...t, categoryPlayers: { ...t.categoryPlayers, [category]: matchingIds }
    } : t));
    alert(`${matchingIds.length} athletes confirmed for ${category}.`);
  };

  /**
   * Refined Bracket Generation Logic
   * Integrated User-provided algorithm for standard knockout + BYEs.
   */
  const generateKnockoutFixtures = (tournamentId: string, category: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament || !category) return;
    const athleteIds = tournament.categoryPlayers[category] || [];
    const N = athleteIds.length;
    if (N < 2) return alert("Minimum 2 players needed.");

    // Step 1: Find next power of 2
    let bracketSize = 1;
    while (bracketSize < N) bracketSize *= 2;

    // Step 2: Calculate total rounds
    const totalRounds = Math.log2(bracketSize);

    // Step 3: Calculate BYEs
    const byes = bracketSize - N;

    // Shuffle for fairness
    const shuffledIds = [...athleteIds].sort(() => Math.random() - 0.5);
    
    let allMatches: Bout[] = [];

    // Create Round 1 Matches
    let index = 0;
    for (let i = 0; i < bracketSize / 2; i++) {
      const bout: Bout = {
        id: `B-${tournamentId}-${category.replace(/\s+/g, '')}-R1-M${i + 1}`,
        tournamentId,
        category,
        player1Score: 0,
        player2Score: 0,
        round: 1,
        matchNumber: i + 1,
        status: 'PENDING'
      };

      if (i < byes) {
        // BYE match: Only 1 player, moves automatically
        bout.player1Id = shuffledIds[index++];
        bout.status = 'BYE';
        bout.winnerId = bout.player1Id;
      } else {
        // Normal match: 2 players
        bout.player1Id = shuffledIds[index++];
        bout.player2Id = shuffledIds[index++];
      }
      allMatches.push(bout);
    }

    // Initialize Empty structure for higher rounds
    for (let r = 2; r <= totalRounds; r++) {
      const matchesInRound = Math.pow(2, totalRounds - r);
      for (let m = 1; m <= matchesInRound; m++) {
        allMatches.push({
          id: `B-${tournamentId}-${category.replace(/\s+/g, '')}-R${r}-M${m}`,
          tournamentId, category, player1Score: 0, player2Score: 0,
          round: r, matchNumber: m, status: 'PENDING'
        });
      }
    }

    // Propagate BYE winners to Round 2
    allMatches.filter(b => b.round === 1 && b.status === 'BYE').forEach(byeBout => {
      const nextMatchNum = Math.ceil(byeBout.matchNumber / 2);
      const nextBout = allMatches.find(b => b.round === 2 && b.matchNumber === nextMatchNum);
      if (nextBout) {
        if (byeBout.matchNumber % 2 !== 0) nextBout.player1Id = byeBout.winnerId;
        else nextBout.player2Id = byeBout.winnerId;
      }
    });

    setBouts(prev => [...prev.filter(b => !(b.tournamentId === tournamentId && b.category === category)), ...allMatches]);
    alert(`Professional Bracket generated with ${byes} BYEs.`);
  };

  const finalizeBout = (boutId: string) => {
    const currentBout = bouts.find(b => b.id === boutId);
    if (!currentBout || currentBout.player1Score === currentBout.player2Score) return;
    const winnerId = currentBout.player1Score > currentBout.player2Score ? currentBout.player1Id : currentBout.player2Id;
    if (!winnerId) return;

    setBouts(prev => {
      const updated = prev.map(b => b.id === boutId ? { ...b, status: 'FINISHED' as const, winnerId } : b);
      const nextRound = currentBout.round + 1;
      const nextMatchNumber = Math.ceil(currentBout.matchNumber / 2);
      const nextBout = updated.find(b => b.tournamentId === currentBout.tournamentId && b.category === currentBout.category && b.round === nextRound && b.matchNumber === nextMatchNumber);
      if (nextBout) {
        if (currentBout.matchNumber % 2 !== 0) nextBout.player1Id = winnerId;
        else nextBout.player2Id = winnerId;
      }
      return updated;
    });
  };

  const updateBoutScore = (boutId: string, pNum: 1 | 2, val: number | string) => {
    const current = bouts.find(b => b.id === boutId);
    if (!current) return;
    const currentScore = pNum === 1 ? current.player1Score : current.player2Score;
    const score = typeof val === 'string' ? parseInt(val) || 0 : currentScore + val;
    setBouts(prev => prev.map(b => b.id === boutId ? {
      ...b, [pNum === 1 ? 'player1Score' : 'player2Score']: Math.max(0, score),
      status: (b.status === 'FINISHED' ? 'FINISHED' : 'LIVE') as any
    } : b));
  };

  // --- Views ---
  const renderDashboard = () => (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
      <DashboardSidebar role={auth.user!.role} activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-grow p-4 lg:p-12 bg-slate-100 overflow-y-auto">
        <div className="bg-white rounded-[48px] shadow-sm p-6 lg:p-10 min-h-full">
          {activeTab === 'stats' && (
            <div className="space-y-12 animate-fade-in">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Command Center</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Athletes', val: players.length, icon: '👤' },
                  { label: 'Live Bouts', val: bouts.filter(b => b.status === 'LIVE').length, icon: '⚡', highlight: true },
                  { label: 'Tournaments', val: tournaments.length, icon: '🏆' },
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
              <div className="bg-slate-900 p-10 rounded-[48px] text-white">
                <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em] mb-8">AI Briefing</h3>
                <p className="text-xl italic opacity-90 leading-relaxed">"{aiSummary}"</p>
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b pb-8">
                <h2 className="text-4xl font-black uppercase tracking-tighter">Athlete Registry</h2>
                <div className="flex gap-4 flex-wrap">
                  <button onClick={downloadBulkTemplate} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl tracking-widest">Get Template</button>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-red-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl tracking-widest">Bulk Import</button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleBulkUpload} />
                </div>
              </div>
              <div className="overflow-x-auto bg-slate-50 rounded-[32px] p-2">
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="px-6 py-4">Athlete</th><th className="px-6 py-4">Bio</th><th className="px-6 py-4">Weight</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.filter(p => p.name.toLowerCase().includes(registrySearch.toLowerCase())).map(p => {
                      const isEditing = editingPlayerId === p.id;
                      return (
                        <tr key={p.id} className="bg-white rounded-2xl group border-2 border-transparent hover:border-slate-200">
                          <td className="px-6 py-4 first:rounded-l-2xl">
                            <div className="flex items-center gap-4">
                              <img src={p.avatar} className="w-10 h-10 rounded-xl" />
                              <div>
                                {isEditing ? (
                                  <input className="border p-1 rounded font-black text-xs uppercase" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                                ) : (
                                  <p className="font-black text-xs uppercase">{p.name}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black uppercase text-[10px]">
                             {isEditing ? (
                               <div className="flex gap-2">
                                  <select value={editFormData.gender} onChange={e => setEditFormData({...editFormData, gender: e.target.value as Gender})} className="border text-[8px] font-black uppercase"><option value="MALE">M</option><option value="FEMALE">F</option></select>
                                  <input type="date" value={editFormData.dob} onChange={e => setEditFormData({...editFormData, dob: e.target.value})} className="border text-[8px]" />
                               </div>
                             ) : `${p.gender} • ${calculateAge(p.dob)} yrs`}
                          </td>
                          <td className="px-6 py-4 font-black text-red-600 text-lg">
                            {isEditing ? (
                              <input type="number" step="0.1" value={editFormData.weight || 0} onChange={e => setEditFormData({...editFormData, weight: parseFloat(e.target.value)})} className="w-16 border" />
                            ) : p.weight} <span className="text-[9px] text-slate-400">KG</span>
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value as PlayerStatus})} className="border text-[8px] font-black uppercase"><option value="VERIFIED">Verified</option><option value="PENDING">Pending</option><option value="REJECTED">Rejected</option></select>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${p.status === 'VERIFIED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.status}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isEditing ? (
                              <button onClick={() => handleUpdatePlayer(p.id)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase">Save</button>
                            ) : (
                              <div className="flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => { setEditingPlayerId(p.id); setEditFormData(p); }} className="text-slate-900 font-black text-[9px] uppercase hover:underline">Edit</button>
                                <button onClick={() => setPlayers(prev => prev.filter(x => x.id !== p.id))} className="text-red-600 font-black text-[9px] uppercase hover:underline">Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tournaments' && (
            <div className="space-y-10">
              <h2 className="text-4xl font-black uppercase tracking-tighter border-b pb-8">Tournament Logistics</h2>
              {tournaments.map(t => (
                <div key={t.id} className="border-4 border-slate-50 rounded-[40px] overflow-hidden bg-white mb-6">
                  <div className="p-8 flex justify-between items-center bg-slate-50/50">
                    <div><h3 className="text-xl font-black uppercase tracking-tight">{t.title}</h3><p className="text-slate-400 text-[10px] font-bold uppercase mt-1">📍 {t.location}</p></div>
                    <button onClick={() => setExpandedTournamentId(expandedTournamentId === t.id ? null : t.id)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl">Expand Panel</button>
                  </div>
                  {expandedTournamentId === t.id && (
                    <div className="p-8 border-t-2 animate-fade-in">
                      <div className="flex gap-6 border-b mb-8 overflow-x-auto">
                        {['config', 'players', 'matches', 'bracket'].map(sub => (
                          <button key={sub} onClick={() => setTournamentSubTab(sub as any)} className={`text-[10px] font-black uppercase tracking-widest pb-3 border-b-4 transition ${tournamentSubTab === sub ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400'}`}>{sub}</button>
                        ))}
                      </div>

                      {tournamentSubTab === 'config' && (
                        <div className="space-y-8 p-4">
                          <div className="flex justify-between items-center"><h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Brackets</h4><button onClick={() => addCategory(t.id)} className="bg-red-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">+ Create Bracket</button></div>
                          <div className="flex flex-wrap gap-3">
                            {t.categories.map(c => (
                              <div key={c} className="bg-slate-100 px-6 py-3 rounded-xl flex items-center gap-4 text-[10px] font-black uppercase shadow-inner">{c}<button onClick={() => setTournaments(prev => prev.map(x => x.id === t.id ? {...x, categories: x.categories.filter(cat => cat !== c)} : x))} className="text-red-500">✕</button></div>
                            ))}
                          </div>
                        </div>
                      )}

                      {tournamentSubTab === 'players' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="bg-slate-50 p-6 rounded-3xl space-y-6">
                            <h5 className="text-[10px] font-black uppercase text-slate-400">Squad Filter Configuration</h5>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1"><label className="text-[8px] font-black uppercase text-slate-500">Gender</label><select className="w-full p-2 rounded-lg border text-[10px] font-black uppercase" value={enrollFilter.gender} onChange={e => setEnrollFilter({...enrollFilter, gender: e.target.value as any})}><option value="ALL">All</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select></div>
                               <div className="space-y-1"><label className="text-[8px] font-black uppercase text-slate-500">Weight Range</label><div className="flex gap-1"><input type="number" className="w-full p-2 rounded-lg border text-[10px]" placeholder="Min" onChange={e => setEnrollFilter({...enrollFilter, weightMin: parseFloat(e.target.value) || 0})} /><input type="number" className="w-full p-2 rounded-lg border text-[10px]" placeholder="Max" onChange={e => setEnrollFilter({...enrollFilter, weightMax: parseFloat(e.target.value) || 120})} /></div></div>
                               <div className="space-y-1 col-span-2"><label className="text-[8px] font-black uppercase text-slate-500">Age Range</label><div className="flex gap-1"><input type="number" className="w-full p-2 rounded-lg border text-[10px]" placeholder="From" onChange={e => setEnrollFilter({...enrollFilter, ageMin: parseInt(e.target.value) || 0})} /><input type="number" className="w-full p-2 rounded-lg border text-[10px]" placeholder="To" onChange={e => setEnrollFilter({...enrollFilter, ageMax: parseInt(e.target.value) || 100})} /></div></div>
                            </div>
                            <div className="pt-4 border-t">
                              <select className="w-full p-4 rounded-xl border-2 bg-white text-[10px] font-black uppercase outline-none focus:border-red-600 mb-4" value={selectedCategory[t.id] || ''} onChange={e => setSelectedCategory({ ...selectedCategory, [t.id]: e.target.value })}><option value="">Select Target Bracket...</option>{t.categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                              <button onClick={() => confirmFilteredSquad(t.id, selectedCategory[t.id])} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Apply Rules & Confirm Squad</button>
                            </div>
                          </div>
                          <div className="bg-slate-900 p-8 rounded-[32px] text-white">
                             <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">Confirmed Athletes ({selectedCategory[t.id] ? (t.categoryPlayers[selectedCategory[t.id]] || []).length : 0})</h5>
                             <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {(t.categoryPlayers[selectedCategory[t.id]] || []).map(pid => {
                                   const p = players.find(x => x.id === pid);
                                   return <div key={pid} className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase">{p?.name} <span className="opacity-40">{p?.weight}KG</span></div>;
                                })}
                             </div>
                             {(t.categoryPlayers[selectedCategory[t.id]] || []).length >= 2 && <button onClick={() => generateKnockoutFixtures(t.id, selectedCategory[t.id])} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] mt-6 shadow-xl">Finalize & Generate Bracket</button>}
                          </div>
                        </div>
                      )}

                      {tournamentSubTab === 'matches' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {bouts.filter(b => b.tournamentId === t.id && b.category === selectedCategory[t.id]).map(b => (
                             <div key={b.id} className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex justify-between items-center text-[10px] font-black uppercase">
                                <div><p className="text-slate-400">Match {b.matchNumber}</p><p className="mt-1">{players.find(p => p.id === b.player1Id)?.name || 'TBD'}<br/>vs<br/>{players.find(p => p.id === b.player2Id)?.name || 'TBD'}</p></div>
                                <div className={`px-2 py-1 rounded-lg ${b.status === 'LIVE' ? 'bg-red-600 text-white' : 'bg-slate-200'}`}>{b.status}</div>
                             </div>
                           ))}
                        </div>
                      )}

                      {tournamentSubTab === 'bracket' && (
                        <div className="bg-slate-50 p-8 rounded-[40px] shadow-inner overflow-x-auto min-h-[500px]">
                           <div className="flex gap-16">
                              {Array.from({ length: Math.ceil(Math.log2(Math.pow(2, Math.ceil(Math.log2((t.categoryPlayers[selectedCategory[t.id]] || []).length || 1))))) || 1 }).map((_, rIdx) => {
                                const rNum = rIdx + 1;
                                const rBouts = bouts.filter(b => b.category === selectedCategory[t.id] && b.round === rNum);
                                return (
                                  <div key={rNum} className="flex flex-col gap-8 min-w-[280px]">
                                     <div className="text-[9px] font-black uppercase text-slate-300 border-b border-slate-200 pb-2 text-center">Round {rNum}</div>
                                     <div className="flex flex-col justify-around flex-grow gap-4">
                                       {rBouts.map(b => (
                                         <div key={b.id} className={`p-4 bg-white rounded-xl border-2 transition shadow-sm ${b.status === 'LIVE' ? 'border-red-600 scale-105 z-10' : b.status === 'BYE' ? 'border-blue-100 opacity-60' : 'border-slate-100'}`}>
                                            <div className="space-y-1.5 font-black text-[10px] uppercase">
                                               <div className={`flex justify-between items-center p-2 rounded-lg ${b.winnerId === b.player1Id ? 'bg-green-50 text-green-700' : 'bg-slate-50'}`}><span className="truncate max-w-[120px]">{players.find(p => p.id === b.player1Id)?.name || 'TBD'}</span><span>{b.player1Score}</span></div>
                                               <div className={`flex justify-between items-center p-2 rounded-lg ${b.winnerId === b.player2Id ? 'bg-green-50 text-green-700' : 'bg-slate-50'}`}><span className="truncate max-w-[120px]">{players.find(p => p.id === b.player2Id)?.name || (b.status === 'BYE' ? 'BYE SLOT' : 'TBD')}</span><span>{b.player2Score}</span></div>
                                            </div>
                                            {b.status === 'BYE' && <div className="text-[7px] text-blue-600 font-black uppercase mt-2 text-center">Bye Entry</div>}
                                         </div>
                                       ))}
                                     </div>
                                  </div>
                                );
                              })}
                           </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'fixtures' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b pb-8">
                <h2 className="text-4xl font-black uppercase tracking-tighter">Bout Control</h2>
                <div className="flex gap-2">
                   {['upcoming', 'active', 'completed'].map(sub => (
                     <button key={sub} onClick={() => setScoringSubTab(sub as any)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition shadow-md ${scoringSubTab === sub ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>{sub}</button>
                   ))}
                </div>
              </div>
              {scoringSubTab === 'active' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {bouts.filter(b => b.status === 'LIVE').map(bout => (
                    <div key={bout.id} className="p-8 bg-slate-50 rounded-[40px] border-2 border-slate-200 flex flex-col items-center gap-8 shadow-lg relative">
                       <div className="text-center"><p className="text-red-600 text-[12px] font-black uppercase mb-2">{bout.category}</p></div>
                       <div className="flex items-center gap-8 w-full justify-center">
                          <div className="text-center flex-1">
                             <span className="text-[10px] font-black uppercase block mb-4 truncate">{players.find(p => p.id === bout.player1Id)?.name}</span>
                             <div className="text-7xl font-black text-red-600">{bout.player1Score}</div>
                             <div className="flex gap-2 justify-center mt-6"><button onClick={() => updateBoutScore(bout.id, 1, 1)} className="bg-white border-2 w-12 h-12 rounded-xl text-xl font-black">+</button><button onClick={() => updateBoutScore(bout.id, 1, -1)} className="bg-white border-2 w-12 h-12 rounded-xl text-xl font-black">-</button></div>
                          </div>
                          <div className="text-3xl text-slate-200 italic font-black">VS</div>
                          <div className="text-center flex-1">
                             <span className="text-[10px] font-black uppercase block mb-4 truncate">{players.find(p => p.id === bout.player2Id)?.name}</span>
                             <div className="text-7xl font-black text-blue-600">{bout.player2Score}</div>
                             <div className="flex gap-2 justify-center mt-6"><button onClick={() => updateBoutScore(bout.id, 2, 1)} className="bg-white border-2 w-12 h-12 rounded-xl text-xl font-black">+</button><button onClick={() => updateBoutScore(bout.id, 2, -1)} className="bg-white border-2 w-12 h-12 rounded-xl text-xl font-black">-</button></div>
                          </div>
                       </div>
                       <button onClick={() => finalizeBout(bout.id)} disabled={bout.player1Score === bout.player2Score} className="w-full bg-slate-900 text-white py-6 rounded-[24px] font-black uppercase text-[10px] tracking-widest disabled:opacity-30">Declare Winner</button>
                    </div>
                  ))}
                </div>
              )}
              {scoringSubTab === 'upcoming' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {bouts.filter(b => b.status === 'PENDING' && b.player1Id && b.player2Id).map(b => (
                     <div key={b.id} className="p-6 bg-white border-2 rounded-3xl shadow-sm flex flex-col items-center gap-3">
                        <p className="text-[8px] font-black uppercase text-slate-400">{b.category}</p>
                        <div className="text-center font-black text-[10px] uppercase">{players.find(x => x.id === b.player1Id)?.name}<br/><span className="text-red-500">VS</span><br/>{players.find(x => x.id === b.player2Id)?.name}</div>
                        <button onClick={() => setBouts(prev => prev.map(x => x.id === b.id ? {...x, status: 'LIVE'} : x))} className="w-full bg-red-600 text-white py-2 rounded-xl text-[9px] font-black uppercase shadow-lg">Start</button>
                     </div>
                   ))}
                </div>
              )}
              {scoringSubTab === 'completed' && (
                <div className="bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden">
                   <table className="w-full text-left"><thead><tr className="text-[9px] font-black uppercase text-slate-500 border-b border-white/10 pb-4"><th className="pb-4">Bracket</th><th className="pb-4">Winner</th><th className="pb-4">Score</th></tr></thead><tbody className="divide-y divide-white/5">{bouts.filter(b => b.status === 'FINISHED').map(b => (<tr key={b.id} className="text-xs font-black uppercase"><td className="py-4">{b.category}</td><td className="py-4 text-green-500">{players.find(p => p.id === b.winnerId)?.name}</td><td className="py-4">{b.player1Score} - {b.player2Score}</td></tr>))}</tbody></table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Layout user={auth.user} onLogout={() => { setAuth({ user: null, isAuthenticated: false }); setCurrentView('home'); }} onNavigate={setCurrentView}>
      {currentView === 'home' && (
        <div className="animate-fade-in relative bg-slate-900 py-48 md:py-64 overflow-hidden">
          <div className="absolute inset-0 opacity-20"><img src="https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2000" className="w-full h-full object-cover" /></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
             <div className="inline-block bg-red-600 text-white px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-8">Official District Platform</div>
             <h1 className="text-7xl md:text-[12rem] font-black text-white uppercase tracking-tighter leading-[0.85] mb-8">Srinagar <span className="text-red-600 italic block">Wushu</span></h1>
             <div className="flex flex-wrap justify-center gap-6 mt-12"><button onClick={() => setCurrentView('register')} className="bg-red-600 text-white px-12 py-6 rounded-[32px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition">Enroll Now</button><button onClick={() => setCurrentView('tournaments')} className="bg-white text-slate-900 px-12 py-6 rounded-[32px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition">Events</button></div>
          </div>
        </div>
      )}
      {currentView === 'login' && (
        <div className="max-w-md mx-auto py-24 px-6">
          <form onSubmit={handleLogin} className="bg-white p-12 rounded-[40px] shadow-2xl border-2 space-y-6">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-center mb-8">Secure Login</h2>
            <input required type="email" placeholder="Email" className="w-full p-4 rounded-xl border-2 bg-slate-50 font-black uppercase text-xs" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            <input required type="password" placeholder="Passphrase" className="w-full p-4 rounded-xl border-2 bg-slate-50 font-black uppercase text-xs" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            {loginError && <p className="text-red-600 text-[10px] font-black uppercase text-center">{loginError}</p>}
            <button type="submit" className="w-full bg-red-600 text-white py-6 rounded-[24px] font-black uppercase tracking-widest shadow-xl transition active:scale-95">Authenticate</button>
          </form>
        </div>
      )}
      {currentView === 'register' && (
        <div className="max-w-4xl mx-auto py-24 px-6">
          <form onSubmit={handleRegister} className="bg-white p-12 md:p-20 rounded-[80px] shadow-2xl border-2 space-y-12">
            <h2 className="text-5xl font-black uppercase tracking-tighter text-center">Athlete Entry</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <input required placeholder="Full Name" className="px-8 py-5 rounded-2xl border-2 bg-slate-50 font-black uppercase text-xs focus:border-red-600" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} />
              <input required type="email" placeholder="Email" className="px-8 py-5 rounded-2xl border-2 bg-slate-50 font-black uppercase text-xs focus:border-red-600" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} />
              <input required type="date" className="px-8 py-5 rounded-2xl border-2 bg-slate-50 font-black uppercase text-xs focus:border-red-600" value={regData.dob} onChange={e => setRegData({...regData, dob: e.target.value})} />
              <select className="px-8 py-5 rounded-2xl border-2 bg-slate-50 font-black uppercase text-xs focus:border-red-600" value={regData.gender} onChange={e => setRegData({...regData, gender: e.target.value as any})}><option value="MALE">Male</option><option value="FEMALE">Female</option></select>
              <input required type="number" step="0.1" placeholder="Weight (KG)" className="px-8 py-5 rounded-2xl border-2 bg-slate-50 font-black uppercase text-xs focus:border-red-600" value={regData.weight} onChange={e => setRegData({...regData, weight: e.target.value})} />
              <input required placeholder="Academy" className="px-8 py-5 rounded-2xl border-2 bg-slate-50 font-black uppercase text-xs focus:border-red-600" value={regData.academy} onChange={e => setRegData({...regData, academy: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-8 rounded-[40px] font-black uppercase tracking-[0.3em] shadow-2xl transition active:scale-95">Confirm Submission</button>
          </form>
        </div>
      )}
      {currentView === 'tournaments' && (
        <div className="max-w-7xl mx-auto px-6 py-24 animate-fade-in">
           <h1 className="text-7xl font-black uppercase tracking-tighter mb-16">Arena Schedule</h1>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {tournaments.map(t => (
                <div key={t.id} className="bg-white rounded-[60px] overflow-hidden border-4 border-slate-50 hover:shadow-2xl transition duration-700">
                   <div className="h-64 relative bg-slate-200"><img src={`https://picsum.photos/seed/${t.id}/1200/600`} className="w-full h-full object-cover" /><div className="absolute top-8 left-8 bg-white px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">{t.status}</div></div>
                   <div className="p-12 space-y-8">
                      <h3 className="text-4xl font-black uppercase tracking-tighter">{t.title}</h3>
                      <p className="text-slate-500 text-lg opacity-80">{t.description}</p>
                      <button onClick={() => setCurrentView('register')} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-lg">Register for Event</button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
      {currentView === 'live' && (
        <div className="max-w-7xl mx-auto px-6 py-24 animate-fade-in">
           <h1 className="text-7xl font-black uppercase tracking-tighter mb-16 flex items-center gap-6">Arena Live <div className="w-10 h-10 bg-red-600 rounded-full animate-pulse"></div></h1>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {bouts.filter(b => b.status === 'LIVE').map(b => (
                <div key={b.id} className="p-12 bg-white rounded-[60px] shadow-xl border-t-8 border-red-600">
                   <p className="text-red-600 font-black text-xs uppercase mb-8">{b.category}</p>
                   <div className="space-y-10 font-black uppercase">
                      <div className="flex justify-between items-center text-xl"><span>{players.find(x => x.id === b.player1Id)?.name}</span><span className="text-5xl text-red-600">{b.player1Score}</span></div>
                      <div className="h-px bg-slate-100 relative"><div className="absolute inset-0 m-auto w-10 h-6 bg-slate-50 border-2 rounded-lg flex items-center justify-center text-[8px] font-black text-slate-300">VS</div></div>
                      <div className="flex justify-between items-center text-xl"><span>{players.find(x => x.id === b.player2Id)?.name}</span><span className="text-5xl text-blue-600">{b.player2Score}</span></div>
                   </div>
                </div>
              ))}
              {bouts.filter(b => b.status === 'LIVE').length === 0 && <p className="col-span-3 text-center text-slate-400 font-black uppercase py-24">No live bouts currently in arena.</p>}
           </div>
        </div>
      )}
      {currentView === 'dashboard' && renderDashboard()}
    </Layout>
  );
};

export default App;
