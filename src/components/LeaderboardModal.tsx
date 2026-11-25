import React, { useState, useEffect } from 'react';
import { CoinIcon } from './GameIcons';

interface LeaderboardPlayer {
  id: string;
  username: string;
  avatar: string;
  badge?: string;
  score: number;
  coins: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: { id: string; username: string; coins: number; todayWin: number };
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchLeaderboard(activeTab);
  }, [isOpen, activeTab]);

  const fetchLeaderboard = async (tab: 'daily' | 'weekly' | 'monthly') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?type=${tab}`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.leaderboard);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
    >
      <div
        dir="rtl"
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden border-2 border-[#FFE082] shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #6AD5E8 0%, #35A6CC 35%, #18729A 100%)',
        }}
      >
        {/* Top Header Section */}
        <div className="pt-4 pb-3 px-4 flex items-center justify-between relative">
          {/* Switch/Refresh Button (Left in RTL is visually on the other side) */}
          <button
            onClick={() => fetchLeaderboard(activeTab)}
            className="w-9 h-9 rounded-full bg-gradient-to-b from-[#FFF2CF] to-[#DEC089] border border-[#B3874B] shadow-md flex items-center justify-center active:scale-95 transition-transform"
            title="تحديث"
          >
            <span className="text-[#6D4213] text-lg font-bold">⇄</span>
          </button>

          {/* Golden Scalloped Header Badge: مقامي درجه */}
          <div className="relative">
            <div
              className="px-8 py-2 rounded-2xl border-2 border-[#FFF0A0] shadow-lg flex items-center justify-center min-w-[170px]"
              style={{
                background: 'linear-gradient(180deg, #FFE873 0%, #F5B800 50%, #E69D00 100%)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3), inset 0 2px 2px #FFF9C4',
              }}
            >
              <span
                className="font-black text-xl text-[#4A2600]"
                style={{
                  fontFamily: "'Tajawal', sans-serif",
                  textShadow: '0 1px 0 rgba(255,255,255,0.7)',
                }}
              >
                مقامي درجه
              </span>
            </div>
            {/* Small decorative corner diamonds */}
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-[#FFF59D] border border-[#D79A00]" />
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-[#FFF59D] border border-[#D79A00]" />
          </div>

          {/* Back/Close Button */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gradient-to-b from-[#FFF2CF] to-[#DEC089] border border-[#B3874B] shadow-md flex items-center justify-center active:scale-95 transition-transform"
            title="رجوع"
          >
            <span className="text-[#6D4213] text-xl font-bold leading-none">↩</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="px-3 pb-4">
          <div className="bg-[#1C8CA8]/70 border border-[#4DD0E1]/50 rounded-2xl p-2.5 backdrop-blur-md shadow-inner">
            {/* 3 Tabs Row */}
            <div className="flex items-center justify-between gap-1 mb-3 px-1 py-1 rounded-full bg-[#125B6F]/50">
              <button
                onClick={() => setActiveTab('daily')}
                className={`flex-1 py-1.5 rounded-full text-center text-sm font-bold transition-all ${
                  activeTab === 'daily'
                    ? 'bg-gradient-to-b from-[#FFF267] to-[#FBC02D] text-[#3E2723] shadow-md scale-102'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                اليومية
              </button>
              <button
                onClick={() => setActiveTab('weekly')}
                className={`flex-1 py-1.5 rounded-full text-center text-sm font-bold transition-all ${
                  activeTab === 'weekly'
                    ? 'bg-gradient-to-b from-[#FFF267] to-[#FBC02D] text-[#3E2723] shadow-md scale-102'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                الأسبوعية
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`flex-1 py-1.5 rounded-full text-center text-sm font-bold transition-all ${
                  activeTab === 'monthly'
                    ? 'bg-gradient-to-b from-[#FFF267] to-[#FBC02D] text-[#3E2723] shadow-md scale-102'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                الشهرية
              </button>
            </div>

            {/* List of Players */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-12 text-center text-white/80 font-bold">جاري تحميل الترتيب...</div>
              ) : (
                players.map((p, idx) => {
                  const rank = idx + 1;
                  // Color schemes matching Screenshot 2:
                  let bgStyle = 'bg-[#14667B]/80 text-white';
                  let borderStyle = 'border-[#26859D]';
                  let crownBadge = null;

                  if (rank === 1) {
                    bgStyle = 'bg-gradient-to-r from-[#F9A825] via-[#FBC02D] to-[#FDD835] text-[#3E2723]';
                    borderStyle = 'border-[#FFE082] shadow-md';
                    crownBadge = '👑';
                  } else if (rank === 2) {
                    bgStyle = 'bg-gradient-to-r from-[#26C6DA] to-[#80DEEA] text-[#004D40]';
                    borderStyle = 'border-[#B2EBF2] shadow-sm';
                    crownBadge = '💎';
                  } else if (rank === 3) {
                    bgStyle = 'bg-gradient-to-r from-[#EF9A9A] to-[#FFCDD2] text-[#B71C1C]';
                    borderStyle = 'border-[#FFEBEE] shadow-sm';
                    crownBadge = '🌸';
                  }

                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border ${borderStyle} ${bgStyle} transition-all`}
                    >
                      {/* Left: Coin Score (Replacing Diamonds) */}
                      <div className="flex items-center gap-1.5 min-w-[95px] justify-start">
                        <CoinIcon size={19} />
                        <span className="font-extrabold text-sm sm:text-base tabular-nums">
                          {p.score.toLocaleString()}
                        </span>
                      </div>

                      {/* Center: Username & Tag */}
                      <div className="flex items-center gap-2 flex-1 justify-center px-1 truncate">
                        <span className="font-bold text-sm truncate">
                          {p.badge && <span className="text-xs mr-1 opacity-90">{p.badge}</span>}
                          {p.username}
                        </span>
                      </div>

                      {/* Right: Avatar + Rank Number */}
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <img
                            src={p.avatar}
                            alt={p.username}
                            className={`w-9 h-9 rounded-full object-cover border-2 ${
                              rank === 1 ? 'border-amber-400' : rank === 2 ? 'border-cyan-200' : rank === 3 ? 'border-pink-300' : 'border-white/50'
                            }`}
                          />
                          {crownBadge && (
                            <span className="absolute -top-2 -right-1 text-xs">{crownBadge}</span>
                          )}
                        </div>
                        <span className="font-black text-base w-5 text-center">{rank}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Current Player Rank Footer if available */}
            {currentUser && (
              <div className="mt-3 pt-2 border-t border-[#4DD0E1]/40 flex items-center justify-between px-2 text-xs text-white">
                <div className="flex items-center gap-1">
                  <CoinIcon size={14} />
                  <span className="font-bold">{currentUser.coins.toLocaleString()} كونز</span>
                </div>
                <div>
                  حسابك: <span className="font-bold text-[#FFF176]">{currentUser.username}</span>
                </div>
              </div>
            )}
          </div>

          {/* Version */}
          <div className="text-left mt-2 px-1 text-[11px] font-semibold text-cyan-200/70">
            v1.11.0
          </div>
        </div>
      </div>
    </div>
  );
};
