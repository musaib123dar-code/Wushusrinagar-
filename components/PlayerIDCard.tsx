
import React, { useRef, useState } from 'react';
import { User } from '../types';
import html2canvas from 'html2canvas';

interface PlayerIDCardProps {
  player: User;
  showDownload?: boolean;
}

export const PlayerIDCard: React.FC<PlayerIDCardProps> = ({ player, showDownload = false }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      // Small delay to ensure any hover states are cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 4, // Ultra-high resolution
        backgroundColor: null,
        logging: false,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `DWA_Srinagar_ID_${player.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate ID card image:', err);
      alert('Could not generate ID card. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const statusColor = player.status === 'VERIFIED' ? 'bg-green-500' : 
                      player.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500';

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* The Visual ID Card Container */}
      <div 
        ref={cardRef}
        className="relative w-[340px] h-[210px] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col font-sans border border-white/10"
        style={{ transform: 'translateZ(0)' }}
      >
        {/* Dynamic Background Graphics */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/20 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-900/40 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none"></div>
        
        {/* Header Bar */}
        <div className="px-4 py-3 bg-gradient-to-r from-red-700 to-red-900 border-b border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-inner">
              <span className="text-red-800 font-black text-sm">W</span>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest leading-none">District Wushu Association</h4>
              <p className="text-[7px] font-bold text-red-200 uppercase tracking-tighter mt-0.5">Srinagar, Jammu & Kashmir</p>
            </div>
          </div>
          <div className="bg-white/10 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border border-white/10">
            Player Pass
          </div>
        </div>

        {/* Card Content Area */}
        <div className="flex-grow flex p-4 relative z-10 bg-slate-900/50 backdrop-blur-sm">
          {/* Photo Section */}
          <div className="w-1/3 flex flex-col items-center">
            <div className="relative group">
              <img 
                src={player.avatar || `https://picsum.photos/seed/${player.id}/200/200`} 
                alt={player.name}
                crossOrigin="anonymous"
                className="w-20 h-24 rounded-lg object-cover border-2 border-white/20 shadow-lg"
              />
              <div className={`absolute -bottom-2 inset-x-0 mx-auto w-fit ${statusColor} text-white text-[7px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-md border border-white/20`}>
                {player.status || 'PENDING'}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="w-2/3 pl-5 flex flex-col justify-center">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-black uppercase leading-tight tracking-tight truncate max-w-[140px]">
                {player.name}
              </h3>
              <span className="text-[7px] font-black bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 uppercase">{player.gender || 'MALE'}</span>
            </div>
            <p className="text-[8px] font-mono font-bold text-red-500 mt-0.5 tracking-wider uppercase">
              ID: {player.id}
            </p>
            
            <div className="mt-3 space-y-1.5">
              <div className="flex flex-col">
                <span className="text-[6px] uppercase font-black text-slate-400 tracking-[0.2em] leading-none">Academy / Club</span>
                <span className="text-[9px] font-bold truncate leading-tight mt-0.5">{player.academy || 'N/A'}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                 <div className="flex flex-col">
                   <span className="text-[6px] uppercase font-black text-slate-400 tracking-[0.2em] leading-none">District</span>
                   <span className="text-[9px] font-bold leading-tight mt-0.5">{player.district || 'Srinagar'}</span>
                 </div>
                 <div className="flex flex-col text-right">
                   <span className="text-[6px] uppercase font-black text-slate-400 tracking-[0.2em] leading-none">Joined</span>
                   <span className="text-[9px] font-bold leading-tight mt-0.5">{player.joinedDate || 'N/A'}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Area with QR and Signature */}
        <div className="bg-black/30 backdrop-blur-md px-4 py-2 flex items-center justify-between text-[7px] relative z-10 border-t border-white/5">
          <div className="flex flex-col">
            <span className="font-black text-slate-400 uppercase tracking-widest text-[5px] leading-none">Authorized Signature</span>
            <span className="font-serif italic text-white/90 mt-1 text-[10px]">Showkat Malik</span>
          </div>
          
          <div className="flex items-center space-x-3">
             <div className="text-right">
                <p className="text-[5px] font-black text-slate-400 uppercase tracking-tighter">Valid until</p>
                <p className="text-[7px] font-bold text-white leading-none">Dec 2025</p>
             </div>
             <div className="w-9 h-9 bg-white p-0.5 rounded shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${player.id}`} 
                  alt="Validation QR" 
                  crossOrigin="anonymous"
                  className="w-full h-full" 
                />
             </div>
          </div>
        </div>
      </div>

      {/* Reusable Download Button */}
      {showDownload && (
        <button 
          onClick={handleDownload}
          disabled={isGenerating}
          className={`flex items-center gap-3 px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-xs shadow-2xl shadow-red-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed tracking-[0.2em] ${isGenerating ? 'animate-pulse' : ''}`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download ID Pass
            </>
          )}
        </button>
      )}
    </div>
  );
};
