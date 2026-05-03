import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Search } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

export default function NotFound() {
  const { t } = useUser();

  return (
    <div className="flex-grow flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl mb-6 font-black text-primary/20">404</div>
        <h1 className="text-2xl font-bold text-on-surface mb-2">
          {t('页面未找到', 'Page Not Found')}
        </h1>
        <p className="text-secondary mb-8">
          {t('你访问的页面不存在，可能已被移除或地址输入有误。', 'The page you are looking for does not exist or has been moved.')}
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-semibold hover:shadow-lg transition-all"
          >
            <Home className="w-4 h-4" />
            {t('返回首页', 'Back to Home')}
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-high dark:bg-surface-container/30 text-on-surface rounded-full font-semibold hover:shadow-md transition-all"
          >
            <Search className="w-4 h-4" />
            {t('搜索', 'Search')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
