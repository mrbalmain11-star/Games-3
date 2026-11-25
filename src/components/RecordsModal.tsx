import React, { useEffect, useState } from 'react';
import { CoinIcon, FoodIconRenderer } from './GameIcons';

export interface BetRecord {
  id: string;
  roundNumber: number;
  timestamp: string;
  bets: { foodId: string; foodName: string; amount: number }[];
  totalBet: number;
  winningId: string;
  winningName: string;
  totalWon: number;
  netChange: number;
  status: 'win' | 'loss';
}

interface RecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  playerCoins?: number;
}

export const RecordsModal: React.FC<RecordsModalProps> = ({
  isOpen,
  onClose,
  userId,
  playerCoins = 1000000000,
}) => {
  const [records, setRecords] = useState<BetRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchRecords();
  }, [isOpen, userId]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.history || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculate Cumulative Profit
  const cumulativeProfit = records.reduce((acc, curr) => acc + curr.netChange, 0);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs select-none"
    >
      <div
        dir="rtl"
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden border-2 border-[#FFE082] shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #6AD5E8 0%, #35A6CC 35%, #18729A 100%)',
        }}
      >
        {/* Top Header */}
        <div className="pt-4 pb-2 px-4 flex items-center justify-between relative z-20">
          {/* Back Button with absolute reliable click */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-b from-[#FFF2CF] to-[#DEC089] border border-[#B3874B] shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-transform shrink-0 hover:brightness-110"
            title="رجوع"
          >
            <span className="text-[#6D4213] text-xl font-bold leading-none pointer-events-none">↩</span>
          </button>

          {/* Title */}
          <h2
            className="font-black text-2xl text-[#1E3A5F] flex-1 text-center"
            style={{ fontFamily: "'Tajawal', sans-serif" }}
          >
            سجلاتي
          </h2>

          <div className="w-10" />
        </div>

        {/* Content Box */}
        <div className="px-3 pb-4 space-y-3">

          {/* User Profile Card (Requested by User) */}
          <div
            className="p-3 rounded-2xl border-2 border-[#FFE082] shadow-lg flex items-center gap-3 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #104C61 0%, #0D3E50 60%, #072633 100%)',
            }}
          >
            {/* User Uploaded Profile Picture in Exact Square Frame (قياس المربع بلضبط بدون حواف سوداء) */}
            <div className="relative shrink-0 w-20 h-20 aspect-square rounded-2xl overflow-hidden border-2 border-[#FFD54F] shadow-lg bg-neutral-900 flex items-center justify-center">
              <img
                src="/assets/aistudio/Screenshot_____-__-__-__-__-__-____com.miui.gallery_92978a14.jpg"
                alt="حمدان"
                className="w-full h-full object-cover select-none"
                style={{
                  objectPosition: 'center 46%',
                  transform: 'scale(1.28)',
                }}
              />
              <span className="absolute bottom-0 right-0 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-tl-lg shadow-sm border-t border-l border-white z-10">
                VIP 👑
              </span>
            </div>

            {/* User Account Details */}
            <div className="flex-1 text-xs text-white space-y-1">
              {/* Name & Flag */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-sm text-[#FFF176]">
                  <span>حمدان</span>
                  <span className="text-base" title="العراق">🇮🇶</span>
                </div>
                <span className="bg-cyan-900/80 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-cyan-200 border border-cyan-500/40">
                  ID: 1200
                </span>
              </div>

              {/* Age & Country */}
              <div className="flex items-center gap-3 text-cyan-100 text-[11px] font-semibold">
                <span>العمر: <strong className="text-white">27 سنة</strong></span>
                <span>الدولة: <strong className="text-white">العراق</strong></span>
              </div>

              {/* Bet Classification & Cumulative Profit */}
              <div className="pt-1 border-t border-cyan-700/50 flex items-center justify-between text-[11px]">
                <div className="text-amber-200 font-bold">
                  تصنيف الرهان: <span className="text-white font-extrabold">VIP ملوكي 👑</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-cyan-200">الربح التراكمي:</span>
                <div className="flex items-center gap-0.5 text-yellow-300 font-black tabular-nums">
                  <CoinIcon size={12} />
                  <span>{cumulativeProfit >= 0 ? `+${cumulativeProfit.toLocaleString()}` : cumulativeProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* History List Header */}
          <div className="flex items-center justify-between px-1 text-xs font-bold text-cyan-50">
            <span>سجل الرهانات الأخيرة:</span>
            <span className="text-[11px] text-cyan-200">الرصيد: {playerCoins.toLocaleString()} 🪙</span>
          </div>

          {/* Scrollable Records List */}
          <div className="bg-[#1C8CA8]/75 border border-[#4DD0E1]/50 rounded-2xl p-2.5 max-h-[290px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="py-10 text-center text-white font-bold">جاري تحميل السجلات...</div>
            ) : records.length === 0 ? (
              <div className="py-8 text-center text-white/90">
                <p className="font-bold text-sm mb-1">لا توجد سجلات رهانات مسجلة</p>
                <p className="text-xs text-cyan-100">ضع رهانك في الجولة القادمة وستظهر سجلاتك هنا فوراً!</p>
              </div>
            ) : (
              records.map(rec => {
                const isWin = rec.status === 'win';
                return (
                  <div
                    key={rec.id}
                    className={`p-2.5 rounded-xl border text-xs transition-all ${
                      isWin
                        ? 'bg-gradient-to-r from-[#1B5E20]/90 to-[#2E7D32]/80 border-emerald-400 text-white shadow-md'
                        : 'bg-[#104F60]/90 border-[#2A8296] text-cyan-50'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-white/20 pb-1 mb-1.5 text-[11px]">
                      <span className="font-bold text-amber-200">جولة #{rec.roundNumber}</span>
                      <span className="text-white/80">{rec.timestamp}</span>
                      <span
                        className={`px-2 py-0.2 rounded-full font-black text-[10px] ${
                          isWin ? 'bg-amber-400 text-[#3E2723]' : 'bg-rose-500/80 text-white'
                        }`}
                      >
                        {isWin ? 'فوز 🏆' : 'لم تصب'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/80">الفائز:</span>
                        <div className="w-5 h-5 rounded-full bg-white/25 p-0.5 flex items-center justify-center">
                          <FoodIconRenderer id={rec.winningId} size={16} />
                        </div>
                        <span className="font-extrabold text-yellow-200">{rec.winningName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>الرهان:</span>
                        <span className="font-bold tabular-nums">{rec.totalBet.toLocaleString()}</span>
                        <CoinIcon size={12} />
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="flex flex-wrap gap-1 my-1">
                      {rec.bets.map((b, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 bg-black/25 px-1.5 py-0.2 rounded-md text-[10px]"
                        >
                          <FoodIconRenderer id={b.foodId} size={13} />
                          <span>{b.foodName}:</span>
                          <span className="font-bold text-amber-200">{b.amount}</span>
                        </div>
                      ))}
                    </div>

                    {/* Net PnL */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/15 text-[11px] font-bold">
                      <span>الصافي:</span>
                      <div
                        className={`flex items-center gap-1 font-black tabular-nums ${
                          rec.netChange > 0 ? 'text-yellow-300' : 'text-rose-200'
                        }`}
                      >
                        <span>{rec.netChange > 0 ? `+${rec.netChange.toLocaleString()}` : rec.netChange.toLocaleString()}</span>
                        <CoinIcon size={13} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="text-left px-1 text-[11px] font-semibold text-cyan-200/70">
            v1.11.0
          </div>
        </div>
      </div>
    </div>
  );
};
