import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  Users,
  Heart,
  Gamepad2,
  Settings,
  Loader2,
  CloudOff,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { getAdminStats, type AdminStats } from '../services/cloudSyncService';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Admin() {
  const { t, user } = useUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    getAdminStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [configured]);

  if (!configured) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4 mx-auto">
            <CloudOff className="w-10 h-10 text-secondary/30" />
          </div>
          <h1 className="font-nunito text-2xl font-bold text-on-surface mb-2">
            {t('管理后台', 'Admin Dashboard')}
          </h1>
          <p className="text-secondary text-sm">
            {t(
              '管理后台需要云同步功能，请配置 Supabase 环境变量',
              'Admin dashboard requires cloud sync. Please configure Supabase environment variables.',
            )}
          </p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20 px-6">
        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
          <Shield className="w-10 h-10 text-secondary/30" />
        </div>
        <h1 className="font-nunito text-2xl font-bold text-on-surface mb-2">
          {t('未登录', 'Not Logged In')}
        </h1>
        <p className="text-secondary text-sm mb-6">
          {t('请先登录以访问管理后台', 'Please log in to access the admin dashboard')}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold text-sm hover:shadow-lg transition-all"
        >
          {t('返回首页', 'Back to Home')}
        </button>
      </div>
    );
  }

  // Simple admin check: in a real app, you'd check against an admin table or user metadata
  // For now, we'll show the dashboard to all logged-in users
  // You can add an `is_admin` column to profiles table and check it here

  const statCards = stats
    ? [
        {
          icon: Users,
          label: t('总用户数', 'Total Users'),
          value: stats.totalUsers,
          color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        },
        {
          icon: Heart,
          label: t('总收藏数', 'Total Favorites'),
          value: stats.totalFavorites,
          color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
        },
        {
          icon: Gamepad2,
          label: t('总游戏分数', 'Total Scores'),
          value: stats.totalScores,
          color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        },
        {
          icon: Settings,
          label: t('同步设置数', 'Synced Settings'),
          value: stats.totalSettings,
          color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        },
      ]
    : [];

  return (
    <div className="flex-grow w-full max-w-[1000px] mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="font-nunito text-3xl font-bold text-on-surface">
            {t('管理后台', 'Admin Dashboard')}
          </h1>
        </div>
        <p className="text-secondary text-sm">
          {t('查看应用统计数据', 'View application statistics')}
        </p>
      </motion.div>

      {/* Admin Warning */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl flex items-start gap-3"
      >
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {t('管理员权限说明', 'Admin Permissions')}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            {t(
              '当前所有登录用户均可查看此页面。如需限制访问，请在 Supabase 的 profiles 表中添加 is_admin 字段。',
              'All logged-in users can view this page. To restrict access, add an is_admin field to the profiles table in Supabase.',
            )}
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="bg-white dark:bg-surface-container-high rounded-3xl p-8 shadow-sm border border-surface-variant/30"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.color}`}
                >
                  <card.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary">{card.label}</p>
                  <p className="font-nunito text-3xl font-bold text-on-surface">
                    {card.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
