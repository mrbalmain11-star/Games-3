import React, { useState } from 'react';
import { CoinIcon } from './GameIcons';

interface WalletTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onSwitchUser: (userId: string) => void;
  onRefreshData: () => void;
}

export const WalletTestModal: React.FC<WalletTestModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onSwitchUser,
  onRefreshData,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleAction = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/user/test-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, action, ...extra }),
      });
      if (res.ok) {
        setMsg('تم تنفيذ العملية بنجاح في خادم اللعبة!');
        onRefreshData();
      } else {
        const err = await res.json();
        setMsg(`خطأ: ${err.error || 'فشلت العملية'}`);
      }
    } catch {
      setMsg('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs select-none">
      <div
        dir="rtl"
        className="relative w-full max-w-sm rounded-3xl overflow-hidden border-2 border-amber-300 shadow-2xl bg-gradient-to-b from-[#1A3A52] to-[#0A1B28] text-white"
      >
        {/* Header */}
        <div className="p-4 border-b border-cyan-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CoinIcon size={24} />
            <h3 className="font-bold text-lg text-amber-300">إدارة المحفظة والحسابات التجريبية</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-sm max-h-[460px] overflow-y-auto">
          {/* Account Switcher */}
          <div>
            <label className="block text-xs font-bold text-cyan-200 mb-1.5">
              تبديل حساب اللاعب للاختبار:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'user_nabd', name: '👑 نبض (MBz)' },
                { id: 'user_binzayed', name: 'ⒷⒾⓃ ⓏⒶⓎⒺⒹ' },
                { id: 'user_zeer', name: 'الزير سالم' },
                { id: 'user_abslot', name: 'ابslot' },
              ].map(acc => (
                <button
                  key={acc.id}
                  onClick={() => {
                    onSwitchUser(acc.id);
                    setMsg(`تم التبديل إلى: ${acc.name}`);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-right ${
                    currentUserId === acc.id
                      ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Balance Modifier */}
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <label className="block text-xs font-bold text-amber-300 mb-2">
              شحن وتعيين رصيد الكونز الفوري:
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                disabled={loading}
                onClick={() => handleAction('set_200b')}
                className="py-2 px-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition-all shadow-md flex items-center justify-center gap-1"
              >
                <CoinIcon size={16} />
                <span>تعيين 200 مليار (200B 🪙)</span>
              </button>
              <button
                disabled={loading}
                onClick={() => handleAction('add_coins', { amount: 10000000 })}
                className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs active:scale-95 transition-all shadow-md"
              >
                +10 مليون 🪙
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={loading}
                onClick={() => handleAction('add_coins', { amount: 100000 })}
                className="py-1.5 px-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-all text-center"
              >
                +100 ألف
              </button>
              <button
                disabled={loading}
                onClick={() => handleAction('add_coins', { amount: 500000 })}
                className="py-1.5 px-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-all text-center"
              >
                +500 ألف
              </button>
              <button
                disabled={loading}
                onClick={() => handleAction('add_coins', { amount: 5000000 })}
                className="py-1.5 px-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-all text-center"
              >
                +5 مليون
              </button>
            </div>
          </div>

          {/* Test Outcomes */}
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <label className="block text-xs font-bold text-cyan-300 mb-2">
              اختبار نتائج الجولة القادمة (Force Outcome):
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                disabled={loading}
                onClick={() => handleAction('force_outcome', { forcedFoodId: 'fish' })}
                className="p-1.5 bg-amber-600/50 hover:bg-amber-600 rounded-lg text-right font-bold"
              >
                🐟 السمك (45x مضاعفة!)
              </button>
              <button
                disabled={loading}
                onClick={() => handleAction('force_outcome', { forcedFoodId: 'meat' })}
                className="p-1.5 bg-rose-600/50 hover:bg-rose-600 rounded-lg text-right font-bold"
              >
                🥩 اللحم (25x مضاعفة)
              </button>
              <button
                disabled={loading}
                onClick={() => handleAction('force_outcome', { forcedFoodId: 'chicken' })}
                className="p-1.5 bg-orange-600/50 hover:bg-orange-600 rounded-lg text-right font-bold"
              >
                🍗 الدجاج (15x مضاعفة)
              </button>
              <button
                disabled={loading}
                onClick={() => handleAction('force_outcome', { forcedFoodId: 'shrimp' })}
                className="p-1.5 bg-emerald-600/50 hover:bg-emerald-600 rounded-lg text-right font-bold"
              >
                🍤 الروبيان (10x مضاعفة)
              </button>
            </div>
          </div>

          {/* Supabase status */}
          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60 text-xs text-emerald-200">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>نظام محفظة توتي شات (Supabase Wallet Sync):</span>
            </div>
            <p className="text-[11px] text-emerald-100/80 leading-relaxed">
              عمليات الخصم والإضافة تتم من جهة الخادم بحماية كاملة من الرصيد السالب، مع توثيق السجلات، وإلزامية عملة الكونز 🪙 بدون أي ماس أو عملات منفصلة.
            </p>
          </div>

          {msg && (
            <div className="p-2 rounded-lg bg-amber-900/60 text-amber-200 text-xs font-bold text-center">
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
