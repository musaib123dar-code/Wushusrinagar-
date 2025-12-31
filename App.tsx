
import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { User, UserRole, Tournament, AuthState, Bout, Gender, PlayerStatus } from './types';
import { Layout } from './components/Layout';
import { 
  INITIAL_ADMIN, 
  INITIAL_OFFICIALS, 
  INITIAL_PLAYERS, 
  INITIAL_TOURNAMENTS, 
} from './constants';
import { DashboardSidebar } from './components/DashboardSidebar';
import { PlayerIDCard } from './components/PlayerIDCard';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  // --- Global App State ---
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [players, setPlayers] = useState<User[]>(() => {
    const saved = localStorage.getItem('dwa_players_v10');
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });
  const [officials, setOfficials] = useState<User[]>(() => {
    const saved = localStorage.getItem('dwa_officials_v10');
    return saved ? JSON.parse(saved) : INITIAL_OFFICIALS;
  });
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem('dwa_tournaments_v10');
    return saved ? JSON.parse(saved) : INITIAL_TOURNAMENTS;
  });
  const [bouts, setBouts] = useState<Bout[]>(() => {
    const saved = localStorage.getItem('dwa_bouts_v10');
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
  
  // Edit & Add States
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingOfficialId, setEditingOfficialId] = useState<string | null>(null);
  const [isAddingOfficial, setIsAddingOfficial] = useState(false);
  const [activeCategoryAddId, setActiveCategoryAddId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  
  // New Entry Forms
  const [newOfficialName, setNewOfficialName] = useState('');
  const [newOfficialEmail, setNewOfficialEmail] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Thinking Mode State
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Tournament Management State
  const [expandedTournamentId, setExpandedTournamentId] = useState<string | null>(null);
  const [tournamentSubTab, setTournamentSubTab] = useState<'config' | 'players' | 'matches' | 'bracket'>('config');
  const [selectedCategory, setSelectedCategory] = useState<{ [key: string]: string }>({});
  const [enrollFilter, setEnrollFilter] = useState({
    gender: 'ALL' as Gender | 'ALL',
    weightMin: 0, weightMax: 120,
    ageMin: 5, ageMax: 70
  });

  // Registration form
  const [regData, setRegData] = useState({
    name: '', email: '', dob: '', gender: Gender.MALE, weight: '', academy: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Persistence ---
  useEffect(() => { localStorage.setItem('dwa_bouts_v10', JSON.stringify(bouts)); }, [bouts]);
  useEffect(() => { localStorage.setItem('dwa_players_v10', JSON.stringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem('dwa_officials_v10', JSON.stringify(officials)); }, [officials]);
  useEffect(() => { localStorage.setItem('dwa_tournaments_v10', JSON.stringify(tournaments)); }, [tournaments]);

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

  const handleComplexAnalysis = async () => {
    if (!aiQuery.trim()) return;
    setIsAnalyzing(true);
    const context = {
      playersCount: players.length,
      tournamentsCount: tournaments.length,
      activeBoutsCount: bouts.filter(b => b.status === 'LIVE').length,
      officialsCount: officials.length
    };
    const result = await geminiService.getComplexAnalysis(aiQuery, context);
    setAiAnalysis(result || "Strategic engine is currently recalibrating.");
    setIsAnalyzing(false);
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
    alert("Warrior registration confirmed!");
    setCurrentView('home');
  };

  const handleAddOfficial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficialName) return;
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
    if (!newCategoryName) return;
    setTournaments(prev => prev.map(t => t.id === tournamentId ? {
      ...t, 
      categories: [...t.categories, newCategoryName], 
      categoryPlayers: { ...t.categoryPlayers, [newCategoryName]: [] }
    } : t));
    setNewCategoryName('');
    setActiveCategoryAddId(null);
  };

  const handleUpdateOfficial = (id: string) => {
    setOfficials(prev => prev.map(o => o.id === id ? { ...o, ...editFormData } : o));
    setEditingOfficialId(null);
    setEditFormData({});
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
        alert(`Successfully imported ${newPlayers.length} athletes.`);
      } catch (err) {
        alert("Import failed. Ensure your template is correct.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const confirmFilteredSquad = (tournamentId: string, category: string) => {
    if (!category) return alert("Select a bracket category.");
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

  const generateKnockoutFixtures = (tournamentId: string, category: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament || !category) return;
    
    const athleteIds = tournament.categoryPlayers[category] || [];
    const N = athleteIds.length;
    if (N < 2) return alert("At least 2 athletes required to build a bracket.");

    let bracketSize = 1;
    while (bracketSize < N) bracketSize *= 2;
    const totalRounds = Math.log2(bracketSize);
    const byes = bracketSize - N;

    const shuffledIds = [...athleteIds].sort(() => Math.random() - 0.5);
    let allMatches: Bout[] = [];

    // Round 1
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
        bout.player1Id = shuffledIds[index++];
        bout.player2Id = undefined;
        bout.status = 'BYE';
        bout.winnerId = bout.player1Id;
      } else {
        bout.player1Id = shuffledIds[index++];
        bout.player2Id = shuffledIds[index++];
        bout.status = 'PENDING';
      }
      allMatches.push(bout);
    }

    // Following Rounds
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

    // Immediate propagation for BYEs
    allMatches.filter(b => b.round === 1 && b.status === 'BYE').forEach(byeBout => {
      const nextMatchNum = Math.ceil(byeBout.matchNumber / 2);
      const nextBout = allMatches.find(b => b.round === 2 && b.matchNumber === nextMatchNum);
      if (nextBout) {
        if (byeBout.matchNumber % 2 !== 0) nextBout.player1Id = byeBout.winnerId;
        else nextBout.player2Id = byeBout.winnerId;
      }
    });

    setBouts(prev => [
      ...prev.filter(b => !(b.tournamentId === tournamentId && b.category === category)), 
      ...allMatches
    ]);
    alert(`Arena Bracket finalized for ${category}.`);
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
      const nextBout = updated.find(b => 
        b.tournamentId === currentBout.tournamentId && 
        b.category === currentBout.category && 
        b.round === nextRound && 
        b.matchNumber === nextMatchNumber
      );
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
                  { label: 'Athletes', val: players.length, icon: '🥋' },
                  { label: 'Live Arena', val: bouts.filter(b => b.status === 'LIVE').length, icon: '⚡', highlight: true },
                  { label: 'Total Events', val: tournaments.length, icon: '🏆' },
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

              {/* Strategic Thinking AI */}
              <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <h3 className="text-[11px] font-black uppercase text-red-500 tracking-[0.4em] mb-8 flex items-center gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                  G3P Strategic Engine
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      placeholder="Consult the association's strategic AI core..." 
                      className="flex-grow bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-sm font-black uppercase outline-none focus:border-red-600 transition"
                      value={aiQuery}
                      onChange={e => setAiQuery(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleComplexAnalysis()}
                    />
                    <button 
                      onClick={handleComplexAnalysis}
                      disabled={isAnalyzing}
                      className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition active:scale-95 disabled:opacity-50"
                    >
                      {isAnalyzing ? 'Thinking...' : 'Analyze'}
                    </button>
                  </div>
                  {aiAnalysis && (
                    <div className="mt-8 p-8 bg-white/5 border border-white/10 rounded-3xl animate-fade-in text-slate-300 text-sm italic leading-loose whitespace-pre-wrap font-medium">
                      {aiAnalysis}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b pb-8">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter">Athlete Registry</h2>
                  <div className="mt-4 relative max-w-sm">
                    <input 
                      type="text" 
                      placeholder="Search Roster..." 
                      className="w-full pl-12 pr-6 py-3 rounded-2xl border-2 bg-slate-50 text-[11px] font-black uppercase focus:border-red-600 transition" 
                      value={registrySearch} 
                      onChange={e => setRegistrySearch(e.target.value)} 
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                  </div>
                </div>
                <div className="flex gap-4 flex-wrap">
                  <button onClick={downloadBulkTemplate} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl tracking-widest transition active:scale-95">Template</button>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-red-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl tracking-widest transition active:scale-95">Import</button>
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
                        <tr key={p.id} className="bg-white rounded-2xl group border-2 border-transparent hover:border-slate-200 shadow-sm transition">
                          <td className="px-6 py-4 first:rounded-l-2xl">
                            <div className="flex items-center gap-4">
                              <img src={p.avatar} className="w-10 h-10 rounded-xl" />
                              <div>
                                {isEditing ? (
                                  <input className="border p-2 rounded-xl font-black text-xs uppercase" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
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
                          <td className="px-6 py-4 text-right last:rounded-r-2xl">
                            {isEditing ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => handleUpdatePlayer(p.id)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase transition active:scale-95">Save</button>
                                <button onClick={() => setEditingPlayerId(null)} className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase transition active:scale-95">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition duration-300">
                                <button onClick={() => { setEditingPlayerId(p.id); setEditFormData(p); }} className="text-slate-900 font-black text-[9px] uppercase hover:underline">Edit</button>
                                <button onClick={() => setPlayers(prev => prev.filter(x => x.id !== p.id))} className="text-red-600 font-black text-[9px] uppercase hover:underline">Purge</button>
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

          {activeTab === 'officials' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-start border-b pb-8">
                <h2 className="text-4xl font-black uppercase tracking-tighter">Officials Panel</h2>
                {!isAddingOfficial && (
                  <button 
                    onClick={() => setIsAddingOfficial(true)} 
                    className="bg-red-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition active:scale-95"
                  >
                    + New Official
                  </button>
                )}
              </div>

              {isAddingOfficial && (
                <div className="p-8 bg-slate-50 border-2 border-slate-200 rounded-[40px] animate-fade-in shadow-inner">
                  <h3 className="text-xs font-black uppercase mb-6 tracking-widest text-slate-600">Appoint Official</h3>
                  <form onSubmit={handleAddOfficial} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input required placeholder="Full Name" className="p-4 rounded-2xl border-2 font-black uppercase text-[10px] outline-none focus:border-red-600" value={newOfficialName} onChange={e => setNewOfficialName(e.target.value)} />
                    <input type="email" placeholder="Official Email (Optional)" className="p-4 rounded-2xl border-2 font-black uppercase text-[10px] outline-none focus:border-red-600" value={newOfficialEmail} onChange={e => setNewOfficialEmail(e.target.value)} />
                    <div className="flex gap-4 md:col-span-2">
                      <button type="submit" className="bg-red-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg transition active:scale-95">Authorize</button>
                      <button type="button" onClick={() => setIsAddingOfficial(false)} className="bg-slate-300 text-slate-700 px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition active:scale-95">Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {officials.map(off => {
                  const isEditing = editingOfficialId === off.id;
                  return (
                    <div key={off.id} className="bg-slate-50 p-8 rounded-[40px] border-2 border-slate-100 flex flex-col items-center space-y-4 group transition hover:border-red-600 shadow-sm relative overflow-hidden">
                      <img src={off.avatar} className="w-24 h-24 rounded-3xl object-cover shadow-2xl transition duration-500" />
                      <div className="text-center w-full">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input className="w-full border p-2 rounded-xl text-center text-xs font-black uppercase" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                            <input className="w-full border p-2 rounded-xl text-center text-[10px] font-black uppercase" value={editFormData.email || ''} onChange={e => setEditFormData({...editFormData, email: e.target.value})} />
                            <div className="flex gap-2 justify-center mt-4">
                              <button onClick={() => handleUpdateOfficial(off.id)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase transition active:scale-95">Save</button>
                              <button onClick={() => setEditingOfficialId(null)} className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase transition active:scale-95">Cancel</button>
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
          )}

          {activeTab === 'tournaments' && (
            <div className="space-y-10">
              <h2 className="text-4xl font-black uppercase tracking-tighter border-b pb-8">Event Command</h2>
              {tournaments.map(t => (
                <div key={t.id} className="border-4 border-slate-50 rounded-[40px] overflow-hidden bg-white mb-6 shadow-sm transition duration-500">
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
                             <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Title</label><input className="w-full p-4 rounded-2xl border-2 bg-slate-50 text-xs font-black uppercase outline-none focus:border-red-600 transition" value={t.title} onChange={e => setTournaments(prev => prev.map(x => x.id === t.id ? {...x, title: e.target.value} : x))} /></div>
                             <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Location</label><input className="w-full p-4 rounded-2xl border-2 bg-slate-50 text-xs font-black uppercase outline-none focus:border-red-600 transition" value={t.location} onChange={e => setTournaments(prev => prev.map(x => x.id === t.id ? {...x, location: e.target.value} : x))} /></div>
                             <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Date</label><input type="date" className="w-full p-4 rounded-2xl border-2 bg-slate-50 text-xs font-black uppercase outline-none focus:border-red-600 transition" value={t.date} onChange={e => setTournaments(prev => prev.map(x => x.id === t.id ? {...x, date: e.target.value} : x))} /></div>
                             <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Operational Status</label><select className="w-full p-4 rounded-2xl border-2 bg-slate-50 text-xs font-black uppercase outline-none" value={t.status} onChange={e => setTournaments(prev => prev.map(x => x.id === t.id ? {...x, status: e.target.value as any} : x))}><option value="UPCOMING">Upcoming</option><option value="ONGOING">Ongoing</option><option value="COMPLETED">Completed</option></select></div>
                          </div>
                          <div className="pt-8 border-t">
                            <div className="flex justify-between items-center mb-6">
                              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bracket Categories</h4>
                              {activeCategoryAddId === t.id ? (
                                <div className="flex gap-2 animate-fade-in items-center">
                                  <input 
                                    className="p-2 rounded-xl border-2 bg-slate-50 text-[10px] font-black uppercase outline-none focus:border-red-600"
                                    placeholder="Enter Category..."
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                  />
                                  <button onClick={() => handleAddCategory(t.id)} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase transition active:scale-95 shadow-md">Add</button>
                                  <button onClick={() => setActiveCategoryAddId(null)} className="text-[8px] font-black uppercase text-slate-400">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setActiveCategoryAddId(t.id)} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase shadow-lg transition active:scale-95">+ New Category</button>
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
                            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filtered Squad Assignment</h5>
                            <div className="grid grid-cols-2 gap-6">
                               <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500">Gender</label><select className="w-full p-3 rounded-xl border-2 text-[10px] font-black uppercase" value={enrollFilter.gender} onChange={e => setEnrollFilter({...enrollFilter, gender: e.target.value as any})}><option value="ALL">All</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select></div>
                               <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-500">Weight (KG)</label><div className="flex gap-2"><input type="number" className="w-full p-3 rounded-xl border-2 text-[10px] font-black" placeholder="Min" onChange={e => setEnrollFilter({...enrollFilter, weightMin: parseFloat(e.target.value) || 0})} /><input type="number" className="w-full p-3 rounded-xl border-2 text-[10px] font-black" placeholder="Max" onChange={e => setEnrollFilter({...enrollFilter, weightMax: parseFloat(e.target.value) || 120})} /></div></div>
                            </div>
                            <div className="pt-4 border-t-2 border-slate-200">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Select Target Bracket Category</p>
                              <select className="w-full p-4 rounded-2xl border-2 bg-white text-[11px] font-black uppercase outline-none focus:border-red-600 mb-6 shadow-sm" value={selectedCategory[t.id] || ''} onChange={e => setSelectedCategory({ ...selectedCategory, [t.id]: e.target.value })}><option value="">Select Category...</option>{t.categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                              <button onClick={() => confirmFilteredSquad(t.id, selectedCategory[t.id])} className="w-full bg-red-600 text-white py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition active:scale-95">Finalize Squad Selection</button>
                            </div>
                          </div>
                          <div className="bg-slate-900 p-8 rounded-[48px] text-white shadow-2xl overflow-hidden">
                             <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-8 border-b border-white/10 pb-4">Assigned Athletes ({selectedCategory[t.id] ? (t.categoryPlayers[selectedCategory[t.id]] || []).length : 0})</h5>
                             <div className="space-y-3 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                                {(t.categoryPlayers[selectedCategory[t.id]] || []).map(pid => {
                                   const p = players.find(x => x.id === pid);
                                   return <div key={pid} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center text-[10px] font-black uppercase">{p?.name} <span className="text-slate-500">{p?.weight}KG</span></div>;
                                })}
                                {(t.categoryPlayers[selectedCategory[t.id]] || []).length === 0 && <p className="text-center py-20 text-slate-600 font-black uppercase text-[11px] tracking-widest">No assigned athletes.</p>}
                             </div>
                             {(t.categoryPlayers[selectedCategory[t.id]] || []).length >= 2 && (
                               <button onClick={() => generateKnockoutFixtures(t.id, selectedCategory[t.id])} className="w-full bg-white text-slate-900 py-5 rounded-3xl font-black uppercase text-[11px] mt-8 shadow-2xl transition hover:bg-red-50 active:scale-95">Generate Bracket System</button>
                             )}
                          </div>
                        </div>
                      )}

                      {tournamentSubTab === 'matches' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                           {bouts.filter(b => b.tournamentId === t.id && b.category === selectedCategory[t.id]).map(b => (
                             <div key={b.id} className="p-8 bg-slate-50 rounded-[40px] border-2 border-slate-100 flex flex-col justify-between shadow-sm hover:border-red-600 transition duration-500">
                                <div className="flex justify-between items-center mb-6">
                                  <span className="text-[9px] font-black uppercase text-slate-400">R{b.round} • Match {b.matchNumber}</span>
                                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${b.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>{b.status}</span>
                                </div>
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center font-black uppercase text-[12px]">
                                    <span className="truncate max-w-[140px]">{players.find(p => p.id === b.player1Id)?.name || 'TBD'}</span>
                                    <span className="text-red-600">{b.player1Score}</span>
                                  </div>
                                  <div className="flex justify-between items-center font-black uppercase text-[12px]">
                                    <span className="truncate max-w-[140px]">{players.find(p => p.id === b.player2Id)?.name || (b.status === 'BYE' ? 'BYE SLOT' : 'TBD')}</span>
                                    <span className="text-blue-600">{b.player2Score}</span>
                                  </div>
                                </div>
                             </div>
                           ))}
                           {bouts.filter(b => b.tournamentId === t.id && b.category === selectedCategory[t.id]).length === 0 && (
                             <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase border-2 border-dashed rounded-[40px] tracking-widest">No fixtures generated.</div>
                           )}
                        </div>
                      )}

                      {tournamentSubTab === 'bracket' && (
                        <div className="bg-slate-50 p-12 rounded-[60px] shadow-inner overflow-x-auto min-h-[600px] border-2 border-slate-100">
                           <div className="flex gap-20 items-stretch">
                              {Array.from(new Set(bouts.filter(b => b.category === selectedCategory[t.id]).map(b => b.round))).sort((a,b)=>a-b).map((rNum) => {
                                const rBouts = bouts.filter(b => b.category === selectedCategory[t.id] && b.round === rNum);
                                return (
                                  <div key={rNum} className="flex flex-col gap-12 min-w-[320px]">
                                     <div className="text-[10px] font-black uppercase text-slate-400 border-b-2 border-red-600/20 pb-4 text-center tracking-widest">Round {rNum}</div>
                                     <div className="flex flex-col justify-around flex-grow gap-6">
                                       {rBouts.map(b => (
                                         <div key={b.id} className={`p-6 bg-white rounded-[32px] border-2 transition-all duration-500 shadow-xl relative ${b.status === 'LIVE' ? 'border-red-600 scale-105 z-10' : b.status === 'BYE' ? 'border-blue-100 opacity-60' : 'border-slate-100'}`}>
                                            <div className="space-y-3 font-black text-[11px] uppercase tracking-tight">
                                               <div className={`flex justify-between items-center p-3 rounded-2xl transition duration-500 ${b.winnerId === b.player1Id ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-50'}`}>
                                                  <span className="truncate max-w-[160px]">{players.find(p => p.id === b.player1Id)?.name || 'TBD'}</span>
                                                  <span className="text-lg">{b.player1Score}</span>
                                               </div>
                                               <div className={`flex justify-between items-center p-3 rounded-2xl transition duration-500 ${b.winnerId === b.player2Id ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-50'}`}>
                                                  <span className="truncate max-w-[160px]">{players.find(p => p.id === b.player2Id)?.name || (b.status === 'BYE' ? 'BYE SLOT' : 'TBD')}</span>
                                                  <span className="text-lg">{b.player2Score}</span>
                                               </div>
                                            </div>
                                            {b.status === 'BYE' && <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-[7px] font-black px-3 py-1 rounded-full uppercase shadow-lg tracking-widest">BYE Entry</div>}
                                            {b.status === 'LIVE' && <div className="absolute -bottom-3 inset-x-0 mx-auto w-fit bg-red-600 text-white text-[7px] font-black px-4 py-1.5 rounded-full uppercase shadow-lg animate-bounce tracking-widest">Live Arena</div>}
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
                <h2 className="text-4xl font-black uppercase tracking-tighter">Arena Control</h2>
                <div className="flex gap-4">
                   {['upcoming', 'active', 'completed'].map(sub => (
                     <button key={sub} onClick={() => setScoringSubTab(sub as any)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition duration-500 shadow-xl ${scoringSubTab === sub ? 'bg-slate-900 text-white shadow-slate-300' : 'bg-slate-200 text-slate-500'}`}>{sub}</button>
                   ))}
                </div>
              </div>
              
              {scoringSubTab === 'active' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {bouts.filter(b => b.status === 'LIVE').map(bout => (
                    <div key={bout.id} className="p-10 bg-slate-900 rounded-[60px] border-4 border-white/5 flex flex-col items-center gap-12 shadow-2xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                       <div className="text-center z-10"><p className="text-red-600 text-[14px] font-black uppercase tracking-[0.5em] mb-4">{bout.category}</p></div>
                       <div className="flex items-center gap-12 w-full justify-center z-10">
                          <div className="text-center flex-1">
                             <span className="text-[12px] font-black uppercase block mb-6 truncate text-white tracking-widest">{players.find(p => p.id === bout.player1Id)?.name}</span>
                             <div className="text-9xl font-black text-red-600 drop-shadow-2xl">{bout.player1Score}</div>
                             <div className="flex gap-4 justify-center mt-10">
                                <button onClick={() => updateBoutScore(bout.id, 1, 1)} className="bg-white/10 text-white border-2 border-white/10 w-16 h-16 rounded-[24px] text-2xl font-black transition active:scale-90 hover:bg-red-600">+</button>
                                <button onClick={() => updateBoutScore(bout.id, 1, -1)} className="bg-white/10 text-white border-2 border-white/10 w-16 h-16 rounded-[24px] text-2xl font-black transition active:scale-90 hover:bg-slate-700">-</button>
                             </div>
                          </div>
                          <div className="text-5xl text-white/5 italic font-black select-none">VS</div>
                          <div className="text-center flex-1">
                             <span className="text-[12px] font-black uppercase block mb-6 truncate text-white tracking-widest">{players.find(p => p.id === bout.player2Id)?.name}</span>
                             <div className="text-9xl font-black text-blue-500 drop-shadow-2xl">{bout.player2Score}</div>
                             <div className="flex gap-4 justify-center mt-10">
                                <button onClick={() => updateBoutScore(bout.id, 2, 1)} className="bg-white/10 text-white border-2 border-white/10 w-16 h-16 rounded-[24px] text-2xl font-black transition active:scale-90 hover:bg-blue-600">+</button>
                                <button onClick={() => updateBoutScore(bout.id, 2, -1)} className="bg-white/10 text-white border-2 border-white/10 w-16 h-16 rounded-[24px] text-2xl font-black transition active:scale-90 hover:bg-slate-700">-</button>
                             </div>
                          </div>
                       </div>
                       <button onClick={() => finalizeBout(bout.id)} disabled={bout.player1Score === bout.player2Score} className="w-full bg-red-600 text-white py-8 rounded-[40px] font-black uppercase text-[12px] tracking-[0.4em] transition active:scale-95 shadow-2xl z-10">Authorize Victory</button>
                    </div>
                  ))}
                  {bouts.filter(b => b.status === 'LIVE').length === 0 && (
                    <div className="col-span-2 py-40 text-center text-slate-400 font-black uppercase border-4 border-dashed rounded-[60px] tracking-widest">Arena Secure: No active bouts.</div>
                  )}
                </div>
              )}

              {scoringSubTab === 'upcoming' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {bouts.filter(b => b.status === 'PENDING' && b.player1Id && b.player2Id).map(b => (
                     <div key={b.id} className="p-10 bg-white border-2 border-slate-100 rounded-[50px] shadow-sm flex flex-col items-center gap-6 transition hover:border-red-600 hover:shadow-2xl duration-500">
                        <p className="text-[10px] font-black uppercase text-red-600 tracking-widest">{b.category}</p>
                        <div className="text-center font-black text-[13px] uppercase tracking-tight leading-loose py-4">
                          <span className="text-slate-900 block">{players.find(x => x.id === b.player1Id)?.name}</span>
                          <span className="text-[8px] text-slate-300 block my-2">VS</span>
                          <span className="text-slate-900 block">{players.find(x => x.id === b.player2Id)?.name}</span>
                        </div>
                        <button onClick={() => setBouts(prev => prev.map(x => x.id === b.id ? {...x, status: 'LIVE'} : x))} className="w-full bg-slate-900 text-white py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl transition active:scale-95 hover:bg-red-600">Start Bout</button>
                     </div>
                   ))}
                   {bouts.filter(b => b.status === 'PENDING' && b.player1Id && b.player2Id).length === 0 && (
                     <p className="col-span-full py-20 text-center text-slate-400 font-black uppercase tracking-[0.4em]">No pending matches.</p>
                   )}
                </div>
              )}

              {scoringSubTab === 'completed' && (
                <div className="bg-slate-900 p-12 rounded-[60px] text-white overflow-hidden shadow-2xl border-4 border-white/5 relative">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-blue-600"></div>
                   <table className="w-full text-left text-[11px] uppercase font-black">
                     <thead>
                       <tr className="text-slate-500 border-b border-white/10 pb-6">
                         <th className="pb-6">Category Bracket</th><th className="pb-6">Authorized Victor</th><th className="pb-6 text-center">Final Score</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                       {bouts.filter(b => b.status === 'FINISHED').map(b => (
                         <tr key={b.id} className="transition hover:bg-white/5 group">
                           <td className="py-8 text-slate-300">{b.category}</td>
                           <td className="py-8 text-green-500">{players.find(p => p.id === b.winnerId)?.name}</td>
                           <td className="py-8 text-center text-red-600 font-mono text-lg">{b.player1Score} — {b.player2Score}</td>
                         </tr>
                       ))}
                       {bouts.filter(b => b.status === 'FINISHED').length === 0 && (
                         <tr><td colSpan={3} className="py-20 text-center text-slate-600 uppercase tracking-widest">No archived data.</td></tr>
                       )}
                     </tbody>
                   </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && auth.user?.role === UserRole.PLAYER && (
            <div className="flex flex-col items-center py-20 space-y-12 animate-fade-in">
              <div className="text-center space-y-4">
                <h2 className="text-6xl font-black uppercase tracking-tighter">Athlete Identity</h2>
                <p className="text-slate-400 font-black uppercase text-[11px] tracking-[0.4em]">District Association Srinagar</p>
              </div>
              <PlayerIDCard player={auth.user} showDownload={true} />
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
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
             <div className="inline-block bg-red-600 text-white px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-12 shadow-2xl">District Wushu Association Srinagar</div>
             <h1 className="text-8xl md:text-[14rem] font-black text-white uppercase tracking-tighter leading-[0.8] mb-12">
              Kashmir <span className="text-red-600 italic block">Wushu</span>
             </h1>
             <p className="text-slate-400 max-w-xl mx-auto mb-16 font-medium text-lg leading-relaxed opacity-80">
              The premier martial arts authority in Srinagar. Managing championship excellence with technical precision.
             </p>
             <div className="flex flex-wrap justify-center gap-8 mt-12">
              <button onClick={() => setCurrentView('register')} className="bg-red-600 text-white px-16 py-8 rounded-[40px] font-black uppercase tracking-[0.3em] shadow-[0_20px_60px_rgba(220,38,38,0.3)] hover:scale-105 transition active:scale-95">Enroll Warrior</button>
              <button onClick={() => setCurrentView('tournaments')} className="bg-white text-slate-900 px-16 py-8 rounded-[40px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition active:scale-95">Arena Events</button>
             </div>
          </div>
        </div>
      )}
      
      {currentView === 'login' && (
        <div className="max-w-md mx-auto py-32 px-6">
          <form onSubmit={handleLogin} className="bg-white p-12 md:p-16 rounded-[60px] shadow-2xl border-2 space-y-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-center mb-10">Secure Access</h2>
            <div className="space-y-4">
              <input required type="email" placeholder="Email" className="w-full p-6 rounded-3xl border-2 bg-slate-50 font-black uppercase text-[11px] outline-none focus:border-red-600 transition" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              <input required type="password" placeholder="Passphrase" className="w-full p-6 rounded-3xl border-2 bg-slate-50 font-black uppercase text-[11px] outline-none focus:border-red-600 transition" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            </div>
            {loginError && <p className="text-red-600 text-[11px] font-black uppercase text-center">{loginError}</p>}
            <button type="submit" className="w-full bg-red-600 text-white py-8 rounded-[32px] font-black uppercase tracking-[0.4em] transition hover:bg-red-700 active:scale-95">Authenticate</button>
          </form>
        </div>
      )}

      {currentView === 'register' && (
        <div className="max-w-4xl mx-auto py-32 px-6">
          <form onSubmit={handleRegister} className="bg-white p-12 md:p-24 rounded-[100px] shadow-2xl border-4 border-slate-50 space-y-16">
            <h2 className="text-6xl font-black uppercase tracking-tighter text-center">Warrior Entry</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <input required placeholder="Name" className="w-full px-8 py-6 rounded-3xl border-2 bg-slate-50 font-black uppercase text-xs focus:border-red-600 transition" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} />
              <input required type="email" placeholder="Email" className="w-full px-8 py-6 rounded-3xl border-2 bg-slate-50 font-black uppercase text-xs focus:border-red-600 transition" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} />
              <input required type="date" className="w-full px-8 py-6 rounded-3xl border-2 bg-slate-50 font-black uppercase text-xs focus:border-red-600 transition" value={regData.dob} onChange={e => setRegData({...regData, dob: e.target.value})} />
              <select className="w-full px-8 py-6 rounded-3xl border-2 bg-slate-50 font-black uppercase text-xs focus:border-red-600 transition" value={regData.gender} onChange={e => setRegData({...regData, gender: e.target.value as any})}><option value="MALE">Male</option><option value="FEMALE">Female</option></select>
              <input required type="number" step="0.1" placeholder="Weight (KG)" className="w-full px-8 py-6 rounded-3xl border-2 bg-slate-50 font-black uppercase text-xs focus:border-red-600 transition" value={regData.weight} onChange={e => setRegData({...regData, weight: e.target.value})} />
              <input required placeholder="Academy" className="w-full px-8 py-6 rounded-3xl border-2 bg-slate-50 font-black uppercase text-xs focus:border-red-600 transition" value={regData.academy} onChange={e => setRegData({...regData, academy: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-10 rounded-[50px] font-black uppercase tracking-[0.5em] transition hover:bg-red-600 active:scale-95">Enroll Warrior</button>
          </form>
        </div>
      )}

      {currentView === 'tournaments' && (
        <div className="max-w-7xl mx-auto px-6 py-32 animate-fade-in">
           <h1 className="text-8xl font-black uppercase tracking-tighter mb-24 text-center">Arena Events</h1>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {tournaments.map(t => (
                <div key={t.id} className="bg-white rounded-[80px] overflow-hidden border-4 border-slate-50 group hover:shadow-2xl transition duration-700">
                   <div className="h-80 relative bg-slate-200 overflow-hidden">
                    <img src={`https://picsum.photos/seed/${t.id}/1600/800`} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />
                    <div className="absolute top-10 left-10 bg-white px-8 py-3 rounded-full text-[10px] font-black uppercase shadow-xl tracking-widest">{t.status}</div>
                   </div>
                   <div className="p-16 space-y-10">
                      <h3 className="text-5xl font-black uppercase tracking-tighter">{t.title}</h3>
                      <p className="text-slate-500 text-lg opacity-80 leading-relaxed">{t.description}</p>
                      <button onClick={() => setCurrentView('register')} className="w-full bg-slate-900 text-white py-7 rounded-[32px] font-black uppercase tracking-widest transition hover:bg-red-600 active:scale-95">Register Athlete</button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {currentView === 'live' && (
        <div className="max-w-7xl mx-auto px-6 py-32 animate-fade-in">
           <h1 className="text-8xl font-black uppercase tracking-tighter mb-24 text-center flex items-center justify-center gap-10">Arena Live <div className="w-14 h-14 bg-red-600 rounded-full animate-pulse shadow-xl shadow-red-200"></div></h1>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {bouts.filter(b => b.status === 'LIVE').map(b => (
                <div key={b.id} className="p-16 bg-slate-900 rounded-[80px] shadow-2xl border-t-[12px] border-red-600 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                   <p className="text-red-600 font-black text-xs uppercase tracking-widest mb-12 text-center">{b.category}</p>
                   <div className="space-y-12 font-black uppercase text-white tracking-tighter">
                      <div className="flex justify-between items-center text-2xl">
                        <span className="truncate max-w-[180px]">{players.find(x => x.id === b.player1Id)?.name}</span>
                        <span className="text-7xl text-red-600 drop-shadow-2xl">{b.player1Score}</span>
                      </div>
                      <div className="h-px bg-white/10 relative"><div className="absolute inset-0 m-auto w-14 h-8 bg-slate-800 border-2 border-white/10 rounded-xl flex items-center justify-center text-[9px] font-black text-slate-500 uppercase tracking-widest">VS</div></div>
                      <div className="flex justify-between items-center text-2xl">
                        <span className="truncate max-w-[180px]">{players.find(x => x.id === b.player2Id)?.name}</span>
                        <span className="text-7xl text-blue-500 drop-shadow-2xl">{b.player2Score}</span>
                      </div>
                   </div>
                </div>
              ))}
              {bouts.filter(b => b.status === 'LIVE').length === 0 && (
                <div className="col-span-3 text-center bg-slate-50 py-32 border-4 border-dashed rounded-[80px]">
                  <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xl">No active combat feed.</p>
                </div>
              )}
           </div>
        </div>
      )}
      
      {currentView === 'dashboard' && renderDashboard()}
    </Layout>
  );
};

export default App;
