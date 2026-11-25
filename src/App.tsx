import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CoinIcon,
  GreedyWoodSign,
  FoodIconRenderer,
  SaladBowlIcon,
  PizzaIcon,
} from './components/GameIcons';
import { LeaderboardModal } from './components/LeaderboardModal';
import { RulesModal } from './components/RulesModal';
import { RecordsModal } from './components/RecordsModal';
import { WalletTestModal } from './components/WalletTestModal';
import { sound } from './utils/sound';

// أسماء الفوز الكلاسيكية لجميع الأطعمة بدون استثناء
export const WIN_CLASSIC_NAMES: Record<string, string> = {
  fish: 'مبروك ربح السمك',
  tomato: 'مبروك ربح الطماطم',
  carrot: 'مبروك ربح الجزر',
  meat: 'مبروك ربح الستيك',
  broccoli: 'مبروك ربح البروكلي',
  corn: 'مبروك ربح الذرة',
  chicken: 'مبروك ربح الدجاج',
  shrimp: 'مبروك ربح الروبيان',
  salad: 'مبروك ربح السلطة',
  pizza: 'مبروك ربح البيتزا',
};

// 8 Wheel Food Items matching the exact screenshot layout
export interface WheelFood {
  id: string;
  nameAr: string;
  multiplier: number;
  isHot?: boolean;
  angle: number; // clockwise angle from top
  category: 'meat' | 'veggie';
}

const WHEEL_ITEMS: WheelFood[] = [
  { id: 'carrot', nameAr: 'جزر', multiplier: 5, angle: 0, category: 'veggie' }, // 12 o'clock
  { id: 'shrimp', nameAr: 'روبيان', multiplier: 10, angle: 45, category: 'meat' }, // 1:30
  { id: 'tomato', nameAr: 'طماطم', multiplier: 5, angle: 90, category: 'veggie' }, // 3 o'clock
  { id: 'chicken', nameAr: 'دجاج', multiplier: 15, angle: 135, category: 'meat' }, // 4:30
  { id: 'corn', nameAr: 'ذرة', multiplier: 5, angle: 180, category: 'veggie' }, // 6 o'clock
  { id: 'meat', nameAr: 'لحم', multiplier: 25, angle: 225, category: 'meat' }, // 7:30
  { id: 'broccoli', nameAr: 'بروكلي', multiplier: 5, angle: 270, category: 'veggie' }, // 9 o'clock
  { id: 'fish', nameAr: 'سمك', multiplier: 45, angle: 315, category: 'meat' }, // 10:30
];

// Standard and VIP Chips (including 100K, 500K, 5M, 10M)
const STANDARD_CHIPS = [
  { value: 10000, label: '10000' },
  { value: 5000, label: '5000' },
  { value: 1000, label: '1000' },
  { value: 500, label: '500' },
  { value: 100, label: '100' },
  { value: 10, label: '10' },
];

const VIP_CHIPS = [
  { value: 10000000, label: '10M', fullLabel: '10 مليون' },
  { value: 5000000, label: '5M', fullLabel: '5 مليون' },
  { value: 500000, label: '500K', fullLabel: '500 ألف' },
  { value: 100000, label: '100K', fullLabel: '100 ألف' },
];

export default function App() {
  // Game State
  const [currentUserId, setCurrentUserId] = useState<string>('user_nabd');
  const [roundNumber, setRoundNumber] = useState<number>(340);
  const [roundState, setRoundState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [roundTimer, setRoundTimer] = useState<number>(15);
  const [currentWinningFoodId, setCurrentWinningFoodId] = useState<string | null>(null);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number>(-1);
  const [pastResults, setPastResults] = useState<string[]>([
    'fish', 'carrot', 'corn', 'broccoli', 'chicken', 'broccoli', 'meat', 'tomato', 'shrimp', 'corn',
  ]);

  // Player State (200 Billion initial balance - 200 مليار كونز)
  const [playerCoins, setPlayerCoins] = useState<number>(200000000000);
  const [todayWin, setTodayWin] = useState<number>(0);
  const [userBets, setUserBets] = useState<Record<string, number>>({});
  const [totalBetsPerFood, setTotalBetsPerFood] = useState<Record<string, number>>({});
  
  // Chip selection state (Standard or VIP Tier)
  const [chipTier, setChipTier] = useState<'standard' | 'vip'>('standard');
  const [selectedChip, setSelectedChip] = useState<number>(10);

  // UI Modals
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showRecords, setShowRecords] = useState<boolean>(false);
  const [showTestWallet, setShowTestWallet] = useState<boolean>(false);

  // Feedback Notification & Simple Classic Win Ribbon
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [winRibbon, setWinRibbon] = useState<{ text: string; amount: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [lastBetFoodId, setLastBetFoodId] = useState<string | null>(null);

  // Spin animation timer ref
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevRoundStateRef = useRef<string>('betting');

  // Start calm background music on first user click if enabled
  useEffect(() => {
    const handleInitialUserGesture = () => {
      if (musicEnabled) {
        sound.startBgMusic();
      }
      window.removeEventListener('click', handleInitialUserGesture);
    };
    window.addEventListener('click', handleInitialUserGesture);
    return () => window.removeEventListener('click', handleInitialUserGesture);
  }, [musicEnabled]);

  // Trigger Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper format number
  const formatCoins = (num: number): string => {
    return num.toLocaleString();
  };

  // Fetch Game State from Authoritative Server
  const fetchGameState = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/state?userId=${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setRoundNumber(data.roundNumber);
        setRoundState(data.roundState);
        setRoundTimer(data.roundTimer);
        setCurrentWinningFoodId(data.currentWinningFoodId);
        if (data.player) {
          setPlayerCoins(data.player.coins);
          setTodayWin(data.player.todayWin);
        }
        setUserBets(data.userBets || {});
        if (data.totalBetsPerFood) {
          setTotalBetsPerFood(data.totalBetsPerFood);
        }
        if (data.pastResults) {
          setPastResults(data.pastResults);
        }
      }
    } catch {
      // offline fallback
    }
  }, [currentUserId]);

  // Poll state every second
  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 1000);
    return () => clearInterval(interval);
  }, [fetchGameState]);

  // Sound and spinning effects when round state changes
  useEffect(() => {
    if (roundState === 'betting' && roundTimer <= 5 && roundTimer > 0) {
      sound.playCountdownBeep(roundTimer === 1);
    }

    if (roundState === 'spinning' && prevRoundStateRef.current === 'betting') {
      startSpinningAnimation(currentWinningFoodId);
    }

    if (roundState === 'result' && currentWinningFoodId) {
      const ribbonText = WIN_CLASSIC_NAMES[currentWinningFoodId] || `مبروك ربح ${currentWinningFoodId}`;
      const targetItem = WHEEL_ITEMS.find(w => w.id === currentWinningFoodId);
      const userBetOnWinner = userBets[currentWinningFoodId] || 0;
      const totalWon = userBetOnWinner > 0 && targetItem ? userBetOnWinner * targetItem.multiplier : 0;
      setWinRibbon({ text: ribbonText, amount: totalWon });
    }

    if (roundState === 'betting' && prevRoundStateRef.current !== 'betting') {
      setActiveHighlightIndex(-1);
      setWinRibbon(null);
    }

    prevRoundStateRef.current = roundState;
  }, [roundState, roundTimer, currentWinningFoodId]);

  // Rotary spinning chase animation around the 8 foods (strictly lands on 1 winning square)
  const startSpinningAnimation = (targetWinningId: string | null) => {
    let currentIndex = 0;
    let stepCount = 0;
    const targetIdx = targetWinningId
      ? WHEEL_ITEMS.findIndex(w => w.id === targetWinningId)
      : Math.floor(Math.random() * 8);
    const validTargetIdx = targetIdx >= 0 ? targetIdx : 0;
    
    // Deterministic step count so the animation always lands precisely on validTargetIdx
    const totalSteps = 24 + ((validTargetIdx - (currentIndex % 8) + 8) % 8);
    let speed = 55; // ms per slot

    if (spinIntervalRef.current) clearTimeout(spinIntervalRef.current);

    const step = () => {
      currentIndex = (currentIndex + 1) % 8;
      setActiveHighlightIndex(currentIndex);
      sound.playWheelTick(1);
      stepCount++;

      if (stepCount < totalSteps) {
        if (stepCount > totalSteps - 8) {
          speed += 32; // smooth, gentle deceleration
        }
        spinIntervalRef.current = setTimeout(step, speed);
      } else {
        // Stop cleanly on the exact single winning slot!
        setActiveHighlightIndex(validTargetIdx);
        const winningItem = WHEEL_ITEMS[validTargetIdx];
        sound.playWin();

        // Announce winner cleanly via classic ribbon for all foods (شريط بسيط بدون تأثير بخط كلاسيكي)
        if (winningItem) {
          const userBetOnWinner = userBets[winningItem.id] || 0;
          const totalWon = userBetOnWinner > 0 ? userBetOnWinner * winningItem.multiplier : 0;
          const ribbonText = WIN_CLASSIC_NAMES[winningItem.id] || `مبروك ربح ${winningItem.nameAr}`;
          setWinRibbon({ text: ribbonText, amount: totalWon });
        }
      }
    };

    spinIntervalRef.current = setTimeout(step, speed);
  };

  // Place Bet Handler
  const handlePlaceBet = async (foodId: string) => {
    if (roundState !== 'betting') {
      showToast('انتهى وقت الرهان لهذه الجولة!');
      return;
    }

    if (playerCoins < selectedChip) {
      showToast('رصيد الكونز غير كافٍ!');
      return;
    }

    // Check maximum 6 food types rule
    const currentBetFoodCount = Object.keys(userBets).filter(k => userBets[k] > 0);
    if (!userBets[foodId] && currentBetFoodCount.length >= 6) {
      showToast('الحد الأقصى هو الرهان على 6 أطعمة في الجولة الواحدة!');
      return;
    }

    // Client optimistic update
    sound.playBetPlace();
    setLastBetFoodId(foodId);
    setTimeout(() => setLastBetFoodId(null), 400);

    const prevBet = userBets[foodId] || 0;
    const newBet = prevBet + selectedChip;
    setUserBets(prev => ({ ...prev, [foodId]: newBet }));
    setPlayerCoins(prev => prev - selectedChip);

    try {
      const res = await fetch('/api/game/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          foodId,
          amount: selectedChip,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        // rollback
        setUserBets(prev => ({ ...prev, [foodId]: prevBet }));
        setPlayerCoins(prev => prev + selectedChip);
        showToast(errorData.error || 'فشل في تثبيت الرهان');
      } else {
        const data = await res.json();
        setPlayerCoins(data.newBalance);
      }
    } catch {
      // rollback
      setUserBets(prev => ({ ...prev, [foodId]: prevBet }));
      setPlayerCoins(prev => prev + selectedChip);
      showToast('خطأ في الاتصال بالخادم');
    }
  };

  // Toggle sound effects
  const toggleSound = () => {
    const isNowOn = sound.toggleSound();
    setSoundEnabled(isNowOn);
    showToast(isNowOn ? 'تم تفعيل المؤثرات الصوتية 🔊' : 'تم كتم المؤثرات 🔈');
  };

  // Toggle calm background music
  const toggleMusic = () => {
    const isNowOn = sound.toggleMusic();
    setMusicEnabled(isNowOn);
    showToast(isNowOn ? 'تم تشغيل الموسيقى الهادئة 🎵' : 'تم كتم الموسيقى 🔇');
  };

  return (
    <div
      dir="rtl"
      className="w-full h-screen min-h-screen flex flex-col justify-between bg-[#040C14] text-white select-none overflow-hidden font-['Tajawal',sans-serif]"
    >
      {/* FULL-SCREEN GAME CONTAINER (Takes 100% of the screen width and height seamlessly) */}
      <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0B2135] via-[#081B2C] to-[#030B12]">

        {/* Main Game Shell (Rich Turquoise Pool & Sunlit Carnival Deck spanning full viewport) */}
        <div
          className="relative flex-1 flex flex-col justify-between p-2 sm:p-3 overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 50% 28%, #60A5FA 0%, #38BDF8 22%, #0284C7 48%, #0369A1 72%, #082F49 100%)',
          }}
        >
          {/* Subtle Ambient Caustics & Sun Gleam */}
          <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.85)_0%,transparent_60%)]" />
          <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-white/25 via-white/10 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Top Game Bar Inside The Pop-Up Arena */}
          <div className="relative z-10 w-full max-w-2xl mx-auto flex items-center justify-between px-2 pt-0.5 shrink-0">
            {/* Rounds & UTC Time */}
            <div className="text-right text-[11px] sm:text-xs leading-tight font-extrabold text-cyan-50 drop-shadow-md">
              <div className="flex items-center gap-1">
                <span className="text-cyan-100">جولات اليوم:</span>
                <span className="text-yellow-300 font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{roundNumber}</span>
              </div>
              <div className="text-[10px] sm:text-[11px] opacity-90 text-cyan-200 font-mono">UTC+3 2026-10-31</div>
            </div>

            {/* Center Wooden Sign */}
            <div className="transform scale-95 sm:scale-100 drop-shadow-xl hover:scale-102 transition-transform">
              <GreedyWoodSign />
            </div>

            {/* Top Controls: Audio, Close & Rules */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Calm Music Toggle Button (موسيقى هادئة) */}
              <button
                onClick={toggleMusic}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border shadow-md flex items-center justify-center text-xs font-bold transition-transform active:scale-90 ${
                  musicEnabled
                    ? 'bg-gradient-to-b from-[#00ACC1] to-[#00838F] border-[#80DEEA] text-yellow-300 shadow-[0_0_10px_rgba(128,222,234,0.7)]'
                    : 'bg-black/50 border-slate-600 text-slate-400'
                }`}
                title={musicEnabled ? 'كتم الموسيقى' : 'تشغيل الموسيقى الهادئة'}
              >
                {musicEnabled ? '🎵' : '🔇'}
              </button>

              {/* Sound FX Toggle Button */}
              <button
                onClick={toggleSound}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border shadow-md flex items-center justify-center text-xs font-bold transition-transform active:scale-90 ${
                  soundEnabled
                    ? 'bg-gradient-to-b from-[#00ACC1] to-[#00838F] border-[#80DEEA] text-cyan-100 shadow-[0_0_10px_rgba(128,222,234,0.7)]'
                    : 'bg-black/50 border-slate-600 text-slate-400'
                }`}
                title={soundEnabled ? 'كتم المؤثرات' : 'تشغيل المؤثرات'}
              >
                {soundEnabled ? '🔊' : '🔈'}
              </button>

              {/* Rules Button with Pink Dot */}
              <div className="relative">
                <button
                  onClick={() => setShowRules(true)}
                  className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-[#D79A00] shadow-md text-xs sm:text-sm font-black text-[#4E2600] active:scale-95 transition-transform"
                  style={{
                    background: 'linear-gradient(180deg, #FFFDE7 0%, #FFE082 45%, #FFB300 100%)',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.3), inset 0 1px 2px #FFFFFF',
                  }}
                >
                  قاعدة
                </button>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#F43F5E] border border-white shadow-xs animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#F43F5E] border border-white shadow-xs" />
              </div>
            </div>
          </div>

          {/* CLASSIC SIMPLE WINNER RIBBON (شريط بسيط بدون تأثير بخط كلاسيكي) */}
          {winRibbon && (
            <div className="w-full max-w-sm sm:max-w-md mx-auto px-4 my-1 z-30 transition-all duration-300">
              <div
                className="py-1.5 px-4 rounded-xl border border-[#D4AF37] shadow-xl flex items-center justify-between"
                style={{
                  background: 'linear-gradient(90deg, #1A130A 0%, #36230E 50%, #1A130A 100%)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,215,0,0.35)',
                }}
              >
                <span className="text-[#D4AF37] text-xs">◆</span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[#FFF2C6] text-base sm:text-lg font-bold tracking-wide select-none"
                    style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
                  >
                    {winRibbon.text}
                  </span>
                  {winRibbon.amount > 0 && (
                    <span className="text-xs font-black text-amber-300 bg-black/60 px-2 py-0.5 rounded-md border border-amber-500/50 tabular-nums shadow-inner">
                      +{winRibbon.amount.toLocaleString()} 🪙
                    </span>
                  )}
                </div>
                <span className="text-[#D4AF37] text-xs">◆</span>
              </div>
            </div>
          )}

          {/* THE 3D GOLDEN FERRIS WHEEL ARENA (Clean layout, no overlapping, strictly single winner) */}
          <div className="relative flex-1 flex items-center justify-center w-full py-1 min-h-[300px] max-h-[380px] my-auto">
            <div className="relative w-[320px] h-[320px] sm:w-[350px] sm:h-[350px] flex items-center justify-center transform scale-95 sm:scale-100 transition-transform">

              {/* Golden Wheel Outer Beveled Rim with Metallic Sheen */}
              <div
                className="absolute inset-0 rounded-full border-[10px] border-[#FBC02D] pointer-events-none"
                style={{
                  boxShadow: '0 0 35px rgba(255,215,0,0.65), inset 0 3px 5px rgba(255,255,255,0.75), inset 0 -3px 6px rgba(183,110,0,0.9), 0 10px 25px rgba(0,0,0,0.5)',
                }}
              />
              <div className="absolute inset-[6px] rounded-full border-2 border-[#FFF9C4]/80 pointer-events-none" />
              <div className="absolute inset-[11px] rounded-full border border-[#B78103]/50 pointer-events-none" />

              {/* Rotating Carnival Light Dots around the Rim with Warm Incandescent Glow */}
              {[...Array(16)].map((_, i) => {
                const angle = (i * 360) / 16;
                const r = 156;
                const lx = r * Math.cos((angle * Math.PI) / 180);
                const ly = r * Math.sin((angle * Math.PI) / 180);
                const isActive = (i + roundTimer) % 2 === 0;
                return (
                  <div
                    key={i}
                    className="absolute w-2.5 h-2.5 rounded-full border border-[#F57F17] pointer-events-none transition-opacity duration-300"
                    style={{
                      transform: `translate(${lx}px, ${ly}px)`,
                      background: isActive ? '#FFFDE7' : '#FFE082',
                      boxShadow: isActive
                        ? '0 0 10px #FFEE58, 0 0 4px #FFF'
                        : '0 0 4px rgba(255,238,88,0.4)',
                      opacity: isActive ? 1 : 0.45,
                    }}
                  />
                );
              })}

              {/* Wheel Spokes - Polished Golden Metallic Rods */}
              {[0, 45, 90, 135].map(deg => (
                <div
                  key={deg}
                  className="absolute w-[300px] sm:w-[330px] h-[3px] bg-gradient-to-r from-[#FDD835]/30 via-[#F57F17] to-[#FDD835]/30 pointer-events-none shadow-xs"
                  style={{ transform: `rotate(${deg}deg)` }}
                />
              ))}

              {/* CENTER HUB: Crowned Falcon "Toti Chat" Royal Mascot + High-Contrast Digital Timer */}
              <div
                className="relative z-10 w-[128px] h-[128px] sm:w-[138px] sm:h-[138px] rounded-full overflow-hidden flex flex-col items-center justify-center border-[4px] border-[#FFCA28] bg-black"
                style={{
                  boxShadow: '0 0 28px rgba(255,202,40,0.7), inset 0 0 14px rgba(255,215,0,0.5), 0 10px 25px rgba(0,0,0,0.85)',
                }}
              >
                {/* Crowned Falcon Royal Badge Image */}
                <img
                  src="/assets/aistudio/file_00000000b9b0820a97fa3c6e743556a6_b8d95f94.png"
                  alt="Toti Chat Falcon"
                  className="w-full h-full object-cover select-none pointer-events-none scale-105"
                  draggable={false}
                />

                {/* Elegant Translucent Glass Timer Docked Gracefully at Lower Rim */}
                <div className="absolute bottom-1.5 inset-x-2 py-0.5 px-2 rounded-full bg-black/85 backdrop-blur-xs border border-amber-400/90 shadow-[0_2px_12px_rgba(0,0,0,0.9)] flex items-center justify-center gap-1.5 z-20">
                  <span className="text-[9px] sm:text-[10px] font-black text-amber-300 drop-shadow-xs whitespace-nowrap leading-none">
                    {roundState === 'betting' ? 'حدد الوقت:' : 'جاري السحب:'}
                  </span>
                  <span
                    className={`font-black text-sm sm:text-base leading-none tracking-tight transition-all ${
                      roundTimer <= 5 && roundState === 'betting'
                        ? 'text-red-500 scale-110 animate-bounce'
                        : 'text-amber-100'
                    }`}
                    style={{
                      fontFamily: "'Changa', 'Tajawal', sans-serif",
                      textShadow: '0 0 8px rgba(255,215,0,0.8), 0 2px 4px #000',
                    }}
                  >
                    {roundTimer}S
                  </span>
                </div>
              </div>

              {/* THE 8 FOOD SLOTS - Perfect geometric sizing, self-contained, no outer protrusions */}
              {WHEEL_ITEMS.map((item, index) => {
                const angleRad = (item.angle - 90) * (Math.PI / 180);
                const radius = 126;
                const x = radius * Math.cos(angleRad);
                const y = radius * Math.sin(angleRad);

                // Strictly ONE single square wins per round (بكل جولة يفوز مربع واحد فقط)
                const isWinningSlot = roundState !== 'betting' && currentWinningFoodId === item.id;
                const isHighlightedSlot = activeHighlightIndex === index;
                const userBetAmount = userBets[item.id] || 0;
                const isJustBet = lastBetFoodId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handlePlaceBet(item.id)}
                    className={`absolute z-20 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 active:scale-95 ${
                      isJustBet ? 'scale-105' : ''
                    }`}
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                  >
                    {/* Food Card Slot - Self-Contained, No Extra Protrusions, Clean Bounds */}
                    <div
                      className={`relative w-[66px] h-[66px] sm:w-[72px] sm:h-[72px] rounded-2xl overflow-hidden flex flex-col items-center justify-between border-[2px] transition-all duration-200 shadow-xl ${
                        isWinningSlot
                          ? 'border-yellow-200 ring-4 ring-yellow-400 z-30'
                          : isHighlightedSlot
                          ? 'border-cyan-100 ring-4 ring-cyan-300 z-25'
                          : 'border-[#FFE082] hover:border-white ring-1 ring-[#FFB300]/60'
                      }`}
                      style={{
                        background: isWinningSlot
                          ? 'linear-gradient(180deg, #FFF9C4 0%, #FFCA28 40%, #FF8F00 100%)'
                          : 'linear-gradient(180deg, #60A5FA 0%, #2563EB 30%, #1D4ED8 65%, #0C2E68 100%)',
                        boxShadow: isWinningSlot
                          ? '0 0 24px rgba(255,215,0,0.9), 0 6px 14px rgba(0,0,0,0.6), inset 0 2px 2px rgba(255,255,255,0.7)'
                          : '0 4px 12px rgba(0,0,0,0.45), inset 0 1.5px 2px rgba(255,255,255,0.65)',
                      }}
                    >
                      {/* User's Placed Bet Pill - Cleanly docked inside top of card */}
                      {userBetAmount > 0 && (
                        <div className="w-full py-0.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 border-b border-amber-300 text-white text-[8px] font-black flex items-center justify-center gap-0.5 shadow-xs shrink-0 leading-none z-10">
                          <CoinIcon size={9} />
                          <span>
                            {userBetAmount >= 1000000
                              ? `${(userBetAmount / 1000000).toFixed(1)}M`
                              : userBetAmount >= 1000
                              ? `${(userBetAmount / 1000).toFixed(0)}K`
                              : userBetAmount}
                          </span>
                        </div>
                      )}

                      {/* Real Food Photo - Crisp, centered with spotlight glow */}
                      <div className="flex-1 w-full flex items-center justify-center px-1 py-0.5 overflow-hidden relative">
                        <div className="absolute inset-0 bg-radial from-white/15 via-transparent to-transparent pointer-events-none" />
                        <FoodIconRenderer id={item.id} size={39} className="drop-shadow-md relative z-1" />
                      </div>

                      {/* Multiplier Ribbon - Docked at bottom of card */}
                      <div
                        className="w-full py-0.5 text-center shadow-xs border-t border-[#FFF9C4]/80 shrink-0 leading-none"
                        style={{
                          background: 'linear-gradient(180deg, #FFFDE7 0%, #FFD54F 40%, #FFB300 100%)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                        }}
                      >
                        <span className="text-[9px] sm:text-[10px] font-black text-[#3E1B00] leading-none whitespace-nowrap drop-shadow-[0_0.5px_0_rgba(255,255,255,0.5)]">
                          {item.multiplier} أضعاف
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Salad (سلطة) - Small Square on Left */}
            <div className="absolute left-2 sm:left-4 bottom-2 z-15 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-b from-[#1E5080] via-[#0D3660] to-[#072445] border-2 border-[#FFD54F]/90 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.5)] flex flex-col items-center justify-between p-1 overflow-hidden select-none pointer-events-none">
              <div className="flex-1 flex items-center justify-center">
                <FoodIconRenderer id="salad" size={32} className="drop-shadow-sm" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-white leading-none drop-shadow-xs">سلطة</span>
            </div>

            {/* Pizza (بيتزا) - Small Square on Right */}
            <div className="absolute right-2 sm:right-4 bottom-2 z-15 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-b from-[#1E5080] via-[#0D3660] to-[#072445] border-2 border-[#FFD54F]/90 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.5)] flex flex-col items-center justify-between p-1 overflow-hidden select-none pointer-events-none">
              <div className="flex-1 flex items-center justify-center">
                <FoodIconRenderer id="pizza" size={32} className="drop-shadow-sm" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-white leading-none drop-shadow-xs">بيتزا</span>
            </div>
          </div>

          {/* BOTTOM CONTROLS WRAPPER (Fluid, responsive, perfectly aligned) */}
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-1.5 shrink-0 z-10">

            {/* Guide Banner: اختر مقدار الرهان> اختر الطعام */}
            <div className="w-full">
              <div
                className="py-1 px-4 rounded-xl text-center border border-[#FF8A80] shadow-md"
                style={{
                  background: 'linear-gradient(180deg, #E53935 0%, #C62828 50%, #8E0000 100%)',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.45)',
                }}
              >
                <span className="text-xs sm:text-sm font-black text-[#FFFDE7] tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  اختر مقدار الرهان&gt; اختر الطعام
                </span>
              </div>
            </div>

            {/* CHIP CONSOLE BAR WITH VIP HIGH-ROLLER TAB SWITCHER */}
            <div
              className="w-full rounded-2xl p-1.5 border-2 border-[#FFE082] shadow-2xl relative"
              style={{
                background: 'linear-gradient(180deg, #FFFDE7 0%, #FFD54F 25%, #FFB300 80%, #FFA000 100%)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.4), inset 0 2px 2px #FFFFFF',
              }}
            >
              {/* Chip Tier Switcher: [عادي 10-10,000] vs [👑 VIP المليوني 100K-10M] */}
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setChipTier('standard');
                      setSelectedChip(10);
                      sound.playChipSelect();
                    }}
                    className={`px-3 py-0.5 rounded-full text-[11px] sm:text-xs font-black transition-all ${
                      chipTier === 'standard'
                        ? 'bg-gradient-to-r from-purple-700 to-indigo-800 text-yellow-300 border border-yellow-200 shadow-md scale-102 ring-1 ring-yellow-300/50'
                        : 'bg-black/20 text-[#4E2600] hover:bg-black/30'
                    }`}
                  >
                    الرهان العادي (10 - 10K)
                  </button>
                  <button
                    onClick={() => {
                      setChipTier('vip');
                      setSelectedChip(10000000);
                      sound.playChipSelect();
                    }}
                    className={`px-3 py-0.5 rounded-full text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 ${
                      chipTier === 'vip'
                        ? 'bg-gradient-to-r from-red-700 via-rose-700 to-amber-700 text-yellow-200 border border-yellow-300 shadow-md scale-102 ring-1 ring-yellow-400'
                        : 'bg-black/20 text-[#4E2600] hover:bg-black/30'
                    }`}
                  >
                    <span>👑 رهان VIP المليوني (100K - 10M)</span>
                  </button>
                </div>
              </div>

              {/* Standard Tier Chips (10, 100, 500, 1000, 5000, 10000) */}
              {chipTier === 'standard' && (
                <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                  {STANDARD_CHIPS.map(chip => {
                    const isSelected = selectedChip === chip.value;
                    return (
                      <button
                        key={chip.value}
                        onClick={() => {
                          setSelectedChip(chip.value);
                          sound.playChipSelect();
                        }}
                        className={`relative py-1.5 sm:py-2 rounded-xl flex items-center justify-center gap-0.5 transition-all active:scale-95 border ${
                          isSelected
                            ? 'border-yellow-200 ring-2 ring-yellow-300 shadow-[0_0_14px_rgba(233,30,99,0.9)] scale-102'
                            : 'border-[#4DD0E1]/80 hover:border-white shadow-xs'
                        }`}
                        style={{
                          background: isSelected
                            ? 'linear-gradient(180deg, #BA68C8 0%, #8E24AA 50%, #6A1B9A 100%)'
                            : 'linear-gradient(180deg, #80DEEA 0%, #26C6DA 50%, #0097A7 100%)',
                          boxShadow: isSelected
                            ? 'inset 0 1px 1px rgba(255,255,255,0.7), 0 3px 6px rgba(0,0,0,0.3)'
                            : 'inset 0 1px 1px rgba(255,255,255,0.5)',
                        }}
                      >
                        <span
                          className={`text-[11px] sm:text-xs font-black tabular-nums leading-none ${
                            isSelected ? 'text-[#FFEE58]' : 'text-white'
                          }`}
                        >
                          {chip.label}
                        </span>
                        <CoinIcon size={12} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* VIP High-Roller Chips (100,000 | 500,000 | 5,000,000 | 10,000,000) */}
              {chipTier === 'vip' && (
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {VIP_CHIPS.map(chip => {
                    const isSelected = selectedChip === chip.value;
                    return (
                      <button
                        key={chip.value}
                        onClick={() => {
                          setSelectedChip(chip.value);
                          sound.playChipSelect();
                        }}
                        className={`relative py-1.5 sm:py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 border ${
                          isSelected
                            ? 'border-yellow-300 ring-2 ring-amber-300 shadow-[0_0_15px_rgba(255,215,0,0.9)] scale-102'
                            : 'border-amber-400/80 hover:border-white shadow-md'
                        }`}
                        style={{
                          background: isSelected
                            ? 'linear-gradient(180deg, #D50000 0%, #B71C1C 50%, #4A148C 100%)'
                            : 'linear-gradient(180deg, #37474F 0%, #263238 60%, #1A237E 100%)',
                          boxShadow: isSelected
                            ? 'inset 0 1px 1px rgba(255,255,255,0.7), 0 3px 6px rgba(0,0,0,0.35)'
                            : 'inset 0 1px 1px rgba(255,255,255,0.4)',
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs sm:text-sm font-black tabular-nums leading-none ${
                              isSelected ? 'text-[#FFEB3B]' : 'text-amber-200'
                            }`}
                          >
                            {chip.label}
                          </span>
                          <CoinIcon size={14} />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-white/90 leading-tight">
                          {chip.fullLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STATUS CAPSULES: [الكونز المتبقي] [سجلاتي] [الفوز اليوم] */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {/* Left Capsule: الكونز المتبقي */}
              <div
                className="py-1.5 sm:py-2 px-1 rounded-2xl text-center border-2 border-[#FFE082] shadow-md flex flex-col justify-center"
                style={{
                  background: 'linear-gradient(180deg, #FFB74D 0%, #F57C00 60%, #E65100 100%)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.6)',
                }}
              >
                <span className="text-[10px] sm:text-[11px] font-black text-[#FFFDE7] leading-none mb-0.5 drop-shadow-xs">
                  الكونز المتبقي
                </span>
                <div className="flex items-center justify-center gap-1">
                  <CoinIcon size={14} />
                  <span
                    className={`${playerCoins >= 10000000000 ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'} font-black text-white tabular-nums drop-shadow-sm tracking-tight truncate`}
                    title={`${playerCoins.toLocaleString()} كونز`}
                  >
                    {formatCoins(playerCoins)}
                  </span>
                </div>
              </div>

              {/* Center Capsule: سجلاتي */}
              <button
                onClick={() => setShowRecords(true)}
                className="py-1.5 sm:py-2 px-1 rounded-2xl text-center border-2 border-[#FFE082] shadow-md flex items-center justify-center active:scale-95 transition-transform"
                style={{
                  background: 'linear-gradient(180deg, #FF9800 0%, #F57C00 60%, #E65100 100%)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.6)',
                }}
              >
                <span className="text-xs sm:text-sm font-black text-[#FFFDE7] drop-shadow-xs">
                  سجلاتي
                </span>
              </button>

              {/* Right Capsule: الفوز اليوم */}
              <div
                className="py-1.5 sm:py-2 px-1 rounded-2xl text-center border-2 border-[#FFE082] shadow-md flex flex-col justify-center"
                style={{
                  background: 'linear-gradient(180deg, #FFB74D 0%, #F57C00 60%, #E65100 100%)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.6)',
                }}
              >
                <span className="text-[10px] sm:text-[11px] font-black text-[#FFFDE7] leading-none mb-0.5 drop-shadow-xs">
                  الفوز اليوم
                </span>
                <div className="flex items-center justify-center gap-1">
                  <CoinIcon size={13} />
                  <span className="text-xs sm:text-sm font-black text-white tabular-nums drop-shadow-sm truncate">
                    {formatCoins(todayWin)}
                  </span>
                </div>
              </div>
            </div>

            {/* RECENT OUTCOMES STRIP: [النتائج] */}
            <div
              className="w-full py-1 sm:py-1.5 px-3 rounded-2xl border border-[#FFE082]/80 shadow-md flex items-center justify-between"
              style={{
                background: 'linear-gradient(180deg, #FFB300 0%, #F57C00 70%, #E65100 100%)',
                boxShadow: '0 3px 8px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.5)',
              }}
            >
              <span className="text-xs sm:text-sm font-black text-[#3E1A00] shrink-0 ml-2 drop-shadow-[0_0.5px_0_rgba(255,255,255,0.4)]">النتائج</span>

              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
                {pastResults.slice(0, 8).map((resId, idx) => (
                  <div
                    key={idx}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-amber-300 flex items-center justify-center shadow-xs shrink-0 overflow-hidden hover:scale-110 transition-transform"
                    title={resId}
                  >
                    <FoodIconRenderer id={resId} size={22} />
                  </div>
                ))}
              </div>
            </div>

            {/* USER RANK STRIP (Dark Bronze Card with Score Display) */}
            <div
              className="w-full px-3 py-1.5 sm:py-2 rounded-2xl border border-amber-500/30 shadow-md flex items-center justify-between"
              style={{
                background: 'linear-gradient(180deg, #3E2723 0%, #2A1713 100%)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,215,0,0.2)',
              }}
            >
              {/* Score in coins on left */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-[#FFF8E1] tabular-nums">
                  {playerCoins >= 1000000000
                    ? `${(playerCoins / 1000000000).toFixed(2)}B`
                    : playerCoins >= 1000000
                    ? `${(playerCoins / 1000000).toFixed(0)}M`
                    : playerCoins.toLocaleString()}
                </span>
                <CoinIcon size={15} />
              </div>

              {/* Username & Rank */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#FFE082]">
                <span>👑 حمدان</span>
                <span className="bg-cyan-800/80 px-1.5 py-0.2 rounded-md text-[10px] text-cyan-200 font-mono">ID:1200</span>
                <span className="bg-amber-600/70 px-2 py-0.2 rounded-full text-[11px] sm:text-xs text-white font-black">3</span>
              </div>

              {/* Label on right */}
              <div className="text-[11px] sm:text-xs font-bold text-amber-200 border-r border-amber-600/40 pr-2 leading-tight">
                <div>الترتيب</div>
                <div className="text-[9px] opacity-80">اليوم</div>
              </div>
            </div>

            {/* BOTTOM BUTTON: أكثر (Leaderboard) & Clean Footer */}
            <div className="flex items-center justify-between px-2 pt-0.5">
              <span className="text-[11px] font-semibold text-cyan-200/60 font-mono">v1.11.0</span>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="w-[170px] sm:w-[200px] py-1.5 rounded-2xl border-2 border-[#FFE082] shadow-lg text-sm font-black text-[#4E2600] active:scale-95 transition-transform"
                style={{
                  background: 'linear-gradient(180deg, #FFFDE7 0%, #FFD54F 40%, #FFB300 100%)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.35), inset 0 2px 2px #FFFFFF',
                }}
              >
                أكثر
              </button>
              <span className="w-10" />
            </div>
          </div>
        </div>
      </div>


      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 border border-amber-400 text-amber-200 text-xs font-bold shadow-2xl flex items-center gap-2">
          <span>⚠️</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODALS */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentUser={{ id: currentUserId, username: '👑 حمدان', coins: playerCoins, todayWin }}
      />

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <RecordsModal
        isOpen={showRecords}
        onClose={() => setShowRecords(false)}
        userId={currentUserId}
        playerCoins={playerCoins}
      />

      <WalletTestModal
        isOpen={showTestWallet}
        onClose={() => setShowTestWallet(false)}
        currentUserId={currentUserId}
        onSwitchUser={uid => {
          setCurrentUserId(uid);
          fetchGameState();
        }}
        onRefreshData={fetchGameState}
      />
    </div>
  );
}
