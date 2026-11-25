import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Game Types & Constants
export type FoodCategory = 'meat' | 'veggie';

export interface FoodItem {
  id: string;
  nameAr: string;
  category: FoodCategory;
  multiplier: number;
  isHot?: boolean;
}

export const FOOD_ITEMS: FoodItem[] = [
  { id: 'carrot', nameAr: 'جزر', category: 'veggie', multiplier: 5 },
  { id: 'shrimp', nameAr: 'روبيان', category: 'meat', multiplier: 10 },
  { id: 'tomato', nameAr: 'طماطم', category: 'veggie', multiplier: 5 },
  { id: 'chicken', nameAr: 'دجاج', category: 'meat', multiplier: 15 },
  { id: 'corn', nameAr: 'ذرة', category: 'veggie', multiplier: 5 },
  { id: 'meat', nameAr: 'لحم', category: 'meat', multiplier: 25 },
  { id: 'broccoli', nameAr: 'بروكلي', category: 'veggie', multiplier: 5 },
  { id: 'fish', nameAr: 'سمك', category: 'meat', multiplier: 45, isHot: true },
];

export interface Player {
  id: string;
  username: string;
  avatar: string;
  badge?: string;
  coins: number;
  todayWin: number;
  weeklyScore: number;
  monthlyScore: number;
}

export interface Bet {
  userId: string;
  foodId: string;
  amount: number;
}

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

// In-Memory Database with Persistence for Server Authoritative state
let roundNumber = 340;
let roundDurationSeconds = 30;
let bettingPhaseSeconds = 22; // 22s to place bets, 8s spinning & results
let roundTimer = bettingPhaseSeconds;
let roundState: 'betting' | 'spinning' | 'result' = 'betting';
let currentWinningFoodId: string | null = null;

// Initial pre-seeded users with zeroed leaderboard
const players: Record<string, Player> = {
  'user_nabd': {
    id: 'user_nabd',
    username: '👑 حمدان',
    avatar: '/assets/aistudio/Screenshot_____-__-__-__-__-__-____com.miui.gallery_92978a14.jpg',
    badge: 'ID: 1200',
    coins: 200000000000, // 200 مليار كونز
    todayWin: 0,
    weeklyScore: 0,
    monthlyScore: 0,
  },
  'user_binzayed': {
    id: 'user_binzayed',
    username: 'ⒷⒾⓃ ⓏⒶⓎⒺⒹ Closed',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badge: '👑VIP',
    coins: 5675000,
    todayWin: 0,
    weeklyScore: 0,
    monthlyScore: 0,
  },
  'user_zeer': {
    id: 'user_zeer',
    username: 'الزير سالم',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    badge: '💎PRO',
    coins: 5345000,
    todayWin: 0,
    weeklyScore: 0,
    monthlyScore: 0,
  },
  'user_abslot': {
    id: 'user_abslot',
    username: 'ابslot',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    coins: 825000,
    todayWin: 0,
    weeklyScore: 0,
    monthlyScore: 0,
  },
  'user_harweena': {
    id: 'user_harweena',
    username: 'هروينه',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    coins: 695000,
    todayWin: 0,
    weeklyScore: 0,
    monthlyScore: 0,
  },
};

// Current Active bets in this round: foodId -> Record<userId, number>
let currentRoundBets: Record<string, Record<string, number>> = {};
// Past results history
let pastResults: string[] = ['fish', 'carrot', 'corn', 'broccoli', 'chicken', 'broccoli', 'meat', 'tomato', 'shrimp', 'corn'];
// User records history
let userRecords: Record<string, BetRecord[]> = {
  'user_nabd': []
};

// Master Game Loop running every 1 second
setInterval(() => {
  roundTimer--;

  if (roundTimer <= 0) {
    if (roundState === 'betting') {
      // Transition from betting to spinning
      roundState = 'spinning';
      roundTimer = 8; // 8s to spin, land, celebrate

      // Select strictly ONE winning food square per round (بكل جولة يفوز مربع واحد فقط)
      const weights = [
        { id: 'carrot', weight: 22 },
        { id: 'tomato', weight: 20 },
        { id: 'corn', weight: 20 },
        { id: 'broccoli', weight: 20 },
        { id: 'shrimp', weight: 12 },
        { id: 'chicken', weight: 10 },
        { id: 'meat', weight: 5 },
        { id: 'fish', weight: 3 },
      ];
      const totalWeight = weights.reduce((acc, w) => acc + w.weight, 0);
      let randomPoint = Math.random() * totalWeight;
      let selected = 'carrot';
      for (const item of weights) {
        if (randomPoint <= item.weight) {
          selected = item.id;
          break;
        }
        randomPoint -= item.weight;
      }
      currentWinningFoodId = selected;

      // Settle bets on server
      settleCurrentRound(currentWinningFoodId);
    } else {
      // Transition back to betting phase
      roundNumber++;
      roundState = 'betting';
      roundTimer = bettingPhaseSeconds;
      currentWinningFoodId = null;
      currentRoundBets = {};
    }
  }
}, 1000);

function settleCurrentRound(winningId: string) {
  // Add to past results
  pastResults.unshift(winningId);
  if (pastResults.length > 25) pastResults.pop();

  // Determine winners
  // Collect all bets per user for this round
  const userRoundTotals: Record<string, { bets: { foodId: string; amount: number }[]; totalBet: number }> = {};

  for (const foodId of Object.keys(currentRoundBets)) {
    for (const [userId, amount] of Object.entries(currentRoundBets[foodId])) {
      if (!userRoundTotals[userId]) {
        userRoundTotals[userId] = { bets: [], totalBet: 0 };
      }
      userRoundTotals[userId].bets.push({ foodId, amount });
      userRoundTotals[userId].totalBet += amount;
    }
  }

  // Calculate winnings for each user
  for (const [userId, userSummary] of Object.entries(userRoundTotals)) {
    const player = players[userId];
    if (!player) continue;

    let wonCoins = 0;

    userSummary.bets.forEach(b => {
      if (b.foodId === winningId) {
        const food = FOOD_ITEMS.find(f => f.id === winningId);
        const mult = food ? food.multiplier : 5;
        wonCoins += b.amount * mult;
      }
    });

    if (wonCoins > 0) {
      player.coins += wonCoins;
      player.todayWin += wonCoins;
      player.weeklyScore += wonCoins;
      player.monthlyScore += wonCoins;
    }

    const netChange = wonCoins - userSummary.totalBet;
    const foodItem = FOOD_ITEMS.find(f => f.id === winningId);
    const winName = winningId === 'salad' ? 'سلطة' : winningId === 'pizza' ? 'بيتزا' : (foodItem?.nameAr || winningId);

    const record: BetRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      roundNumber,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      bets: userSummary.bets.map(b => ({
        foodId: b.foodId,
        foodName: FOOD_ITEMS.find(f => f.id === b.foodId)?.nameAr || b.foodId,
        amount: b.amount,
      })),
      totalBet: userSummary.totalBet,
      winningId,
      winningName: winName,
      totalWon: wonCoins,
      netChange,
      status: wonCoins > 0 ? 'win' : 'loss',
    };

    if (!userRecords[userId]) userRecords[userId] = [];
    userRecords[userId].unshift(record);
    if (userRecords[userId].length > 50) userRecords[userId].pop();
  }
}

// REST API Endpoints

// 1. Get Game State & Current Round
app.get('/api/game/state', (req, res) => {
  const userId = (req.query.userId as string) || 'user_nabd';
  const player = players[userId] || players['user_nabd'];

  // Current user's bets in this round
  const userBets: Record<string, number> = {};
  for (const [foodId, betsMap] of Object.entries(currentRoundBets)) {
    if (betsMap[userId]) {
      userBets[foodId] = betsMap[userId];
    }
  }

  // Total bet on each food across all players
  const totalBetsPerFood: Record<string, number> = {};
  for (const [foodId, betsMap] of Object.entries(currentRoundBets)) {
    totalBetsPerFood[foodId] = Object.values(betsMap).reduce((a, b) => a + b, 0);
  }

  res.json({
    roundNumber,
    roundState,
    roundTimer,
    currentWinningFoodId,
    player,
    userBets,
    totalBetsPerFood,
    pastResults,
    serverTime: new Date().toISOString(),
    utcString: `UTC+3 ${new Date().toISOString().slice(0, 10)}`,
  });
});

// 2. Place Bet (Authoritative & Atomic)
app.post('/api/game/bet', (req, res) => {
  const { userId, foodId, amount } = req.body;

  if (roundState !== 'betting') {
    return res.status(400).json({ error: 'انتهى وقت الرهان لهذه الجولة!' });
  }

  const validFood = FOOD_ITEMS.find(f => f.id === foodId);
  if (!validFood) {
    return res.status(400).json({ error: 'عنصر الطعام غير صالح' });
  }

  const validChips = [10, 100, 500, 1000, 5000, 10000, 100000, 500000, 5000000, 10000000];
  if (!validChips.includes(amount) && amount <= 0) {
    return res.status(400).json({ error: 'مبلغ الرهان غير صالح' });
  }

  const player = players[userId || 'user_nabd'];
  if (!player) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  // Check maximum 6 food types rule
  // Collect existing food types this player has bet on
  const existingFoodsBetOn = new Set<string>();
  for (const [fId, betsMap] of Object.entries(currentRoundBets)) {
    if (betsMap[player.id] && betsMap[player.id] > 0) {
      existingFoodsBetOn.add(fId);
    }
  }
  if (!existingFoodsBetOn.has(foodId) && existingFoodsBetOn.size >= 6) {
    return res.status(400).json({ error: 'الحد الأقصى هو الرهان على 6 أطعمة في الجولة الواحدة!' });
  }

  // Check balance - prevent negative balance
  if (player.coins < amount) {
    return res.status(400).json({ error: 'رصيد الكونز غير كافٍ!' });
  }

  // Deduct atomically
  player.coins -= amount;

  if (!currentRoundBets[foodId]) {
    currentRoundBets[foodId] = {};
  }
  currentRoundBets[foodId][player.id] = (currentRoundBets[foodId][player.id] || 0) + amount;

  res.json({
    success: true,
    newBalance: player.coins,
    foodId,
    betOnFood: currentRoundBets[foodId][player.id],
  });
});

// 3. User Wallet & Switch Account / Add Test Coins
app.get('/api/user/:userId', (req, res) => {
  const player = players[req.params.userId];
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(player);
});

app.post('/api/user/test-action', (req, res) => {
  const { userId, action, amount } = req.body;
  const player = players[userId || 'user_nabd'];
  if (!player) return res.status(404).json({ error: 'Player not found' });

  if (action === 'add_coins') {
    player.coins += Number(amount) || 100000;
  } else if (action === 'set_200b' || action === 'set_1b' || action === 'set_900m') {
    player.coins = 200000000000;
  } else if (action === 'reset_balance') {
    player.coins = 200000000000;
  } else if (action === 'force_outcome' && roundState === 'betting') {
    // Allows testing specific food outcome next
    currentWinningFoodId = req.body.forcedFoodId;
  }

  res.json({ success: true, player });
});

// 4. Leaderboard API
app.get('/api/leaderboard', (req, res) => {
  const type = (req.query.type as string) || 'daily'; // daily, weekly, monthly

  const playerList = Object.values(players).map(p => {
    let score = p.todayWin;
    if (type === 'weekly') score = p.weeklyScore;
    if (type === 'monthly') score = p.monthlyScore;
    return {
      id: p.id,
      username: p.username,
      avatar: p.avatar,
      badge: p.badge,
      score,
      coins: p.coins,
    };
  });

  playerList.sort((a, b) => b.score - a.score);

  res.json({
    type,
    leaderboard: playerList,
  });
});

// 5. User History API
app.get('/api/history/:userId', (req, res) => {
  const history = userRecords[req.params.userId] || [];
  res.json({ history });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[ToTi Chat Greedy] Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
