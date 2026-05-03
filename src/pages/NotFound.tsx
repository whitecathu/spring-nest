import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Search, ArrowLeft, Leaf, Cloud, Flower2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

export default function NotFound() {
  const { t } = useUser();
  const navigate = useNavigate();

  return (
    <div className="flex-grow flex items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] opacity-20 text-primary-container"
        >
          <Cloud className="w-24 h-24 fill-primary-container" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 right-[15%] opacity-15 text-tertiary-container"
        >
          <Cloud className="w-32 h-32 fill-tertiary-container" />
        </motion.div>
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[30%] right-[20%] opacity-20 text-tertiary-container"
        >
          <Flower2 className="w-12 h-12 fill-tertiary-container" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg relative z-10"
      >
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative mb-8"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-9xl font-black text-primary/10 select-none"
          >
            404
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3, type: "spring", bounce: 0.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <Leaf className="w-20 h-20 text-primary/30 fill-primary/30" />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl font-bold text-on-surface mb-3"
        >
          {t('页面未找到', 'Page Not Found')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-secondary mb-10 text-lg"
        >
          {t('你访问的页面不存在，可能已被移除或地址输入有误。', 'The page you are looking for does not exist or has been moved.')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-4 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-container-high dark:bg-surface-container text-on-surface rounded-full font-semibold hover:shadow-md transition-all border border-surface-variant/30"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('返回上一页', 'Go Back')}
          </motion.button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-semibold hover:shadow-lg transition-all"
          >
            <Home className="w-4 h-4" />
            {t('返回首页', 'Back to Home')}
          </Link>
        </motion.div>

        {/* Search suggestion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 pt-8 border-t border-surface-variant/30"
        >
          <p className="text-sm text-secondary mb-4">
            {t('或者试试搜索：', 'Or try searching:')}
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-surface-container-high rounded-full text-sm font-medium text-primary hover:bg-primary-container/20 transition-colors border border-primary/20"
          >
            <Search className="w-4 h-4" />
            {t('搜索游戏和工具', 'Search games & tools')}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
