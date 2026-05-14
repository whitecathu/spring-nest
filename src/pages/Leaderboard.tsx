import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal, Crown, Loader2, CloudOff } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { fetchLeaderboard, type LeaderboardEntry } from '../services/scoreService';
import { isSupabaseConfigured } from '../lib/supabase';
import SEO from '../components/SEO';

type GameTab = '2048' | 'memory' | 'whackamole';

const GAME_TABS: { id: GameTab; label: string; labelEn: string; icon: string }[] = [
  { id: '2048', label: '2048', labelEn: '2048', icon: '🧩' },
  { id: 'memory', label: '记忆翻牌', labelEn: 'Memory Match', icon: '🃏' },
  { id: 'whackamole', label: '打地鼠', labelEn: 'Whack A Mole', icon: '🔨' },
];

function getRankIcon(rank: number) {
  if (rank === 1)
    return (
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        <Crown className="w-5 h-5 text-yellow-500" />
      </motion.div>
    );
  if (rank === 2)
    return (
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <Medal className="w-5 h-5 text-gray-400" />
      </motion.div>
    );
  if (rank === 3)
    return (
      <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
        <Medal className="w-5 h-5 text-amber-600" />
      </motion.div>
    );
  return (
    <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-secondary">
      {rank}
    </span>
  );
}

function getRankBg(rank: number): string {
  if (rank === 1)
    return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
  if (rank === 2) return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  if (rank === 3) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
  return 'bg-white dark:bg-surface-container-high border-surface-variant/30';
}

export default function Leaderboard() {
  const { t } = useUser();
  const [activeTab, setActiveTab] = useState<GameTab>('2048');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  const loadLeaderboard = useCallback(async (game: GameTab) => {
    setLoading(true);
    try {
      const data = await fetchLeaderboard(game, 20);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (configured) {
      loadLeaderboard(activeTab);
    }
  }, [activeTab, configured, loadLeaderboard]);

  if (!configured) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20 px-6">
        <SEO
          title={t('排行榜 - Spring Nest 春日小筑', 'Leaderboard - Spring Nest')}
          description={t(
            '查看春日小筑小游戏排行榜。未配置云同步时，游戏分数优先保存在浏览器本地。',
            'View Spring Nest game leaderboards. Without cloud sync, scores stay in local browser storage first.',
          )}
          canonical="/leaderboard"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4 mx-auto">
            <CloudOff className="w-10 h-10 text-secondary/30" />
          </div>
          <h1 className="font-nunito text-2xl font-bold text-on-surface mb-2">
            {t('排行榜', 'Leaderboard')}
          </h1>
          <p className="text-secondary text-sm mb-6">
            {t(
              '排行榜需要云同步功能，请配置 Supabase 环境变量',
              'Leaderboard requires cloud sync. Please configure Supabase environment variables.',
            )}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full max-w-[800px] mx-auto px-6 py-10">
      <SEO
        title={t('排行榜 - Spring Nest 春日小筑', 'Leaderboard - Spring Nest')}
        description={t(
          '查看春日小筑小游戏排行榜，包含 2048、记忆翻牌和打地鼠等成绩。',
          'View Spring Nest game leaderboards, including 2048, Memory Match, and Whack A Mole scores.',
        )}
        canonical="/leaderboard"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-8 h-8 text-primary" />
          <h1 className="font-nunito text-3xl font-bold text-on-surface">
            {t('排行榜', 'Leaderboard')}
          </h1>
        </div>
        <p className="text-secondary text-sm">
          {t('查看各游戏的全球排名', 'View global rankings for each game')}
        </p>
      </motion.div>

      {/* Game Tabs */}
      <div className="flex gap-2 mb-8 justify-center">
        {GAME_TABS.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-on-primary shadow-[0_4px_12px_rgba(63,103,81,0.3)]'
                : 'bg-white dark:bg-surface-container-high text-secondary hover:text-primary border border-surface-variant/30'
            }`}
          >
            <span>{tab.icon}</span>
            {t(tab.label, tab.labelEn)}
          </motion.button>
        ))}
      </div>

      {/* Leaderboard List */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
          >
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </motion.div>
        ) : entries.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <Trophy className="w-12 h-12 text-secondary/20 mx-auto mb-4" />
            <p className="text-secondary font-medium">{t('暂无排名数据', 'No ranking data yet')}</p>
            <p className="text-secondary/60 text-sm mt-1">
              {t('成为第一个上榜的玩家吧！', 'Be the first player on the board!')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {entries.map((entry, index) => {
              const rank = index + 1;
              return (
                <motion.div
                  key={`${entry.username}-${rank}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${getRankBg(rank)}`}
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    {getRankIcon(rank)}
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-on-surface">{entry.username}</p>
                    <p className="text-xs text-secondary">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-nunito text-xl font-bold text-primary">
                      {entry.score.toLocaleString()}
                    </p>
                    <p className="text-xs text-secondary">{t('分', 'pts')}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
