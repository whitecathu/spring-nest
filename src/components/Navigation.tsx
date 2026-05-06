import { useState, useMemo, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, User, Leaf, X, Trophy, Shield, Menu, Gamepad2, Wrench, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoginModal from './LoginModal';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { search } from '../services/searchService';

export default function Navigation() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof search>>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, logout, language, t } = useUser();
  const { mode, setMode, resolved } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isEn = language === 'en';

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  // Offline status monitoring
  useEffect(() => {
    const handleOffline = () => {
      setToastMessage(t('网络已断开，请检查网络连接', 'You are offline. Please check your network connection.'));
    };
    const handleOnline = () => {
      setToastMessage(t('网络已恢复', 'Network connection restored.'));
      setTimeout(() => setToastMessage(''), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [t]);

  const handleLoginSuccess = (email: string, username: string) => {
    setToastMessage(t(`欢迎回来，${username}！`, `Welcome back, ${username}!`));
    setTimeout(() => setToastMessage(''), 3000);
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback((value: string) => {
    if (value.trim()) {
      setSearchResults(search(value));
      setHasSearched(true);
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(value), 300);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleResultClick = (result: ReturnType<typeof search>[0]) => {
    const slug = result.item.route.split('/').pop();
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    navigate(result.item.type === 'game' ? `/games/${slug}` : `/tools/${slug}`);
  };

  const navItems = useMemo(() => [
    { id: 'home', path: '/', label: '首页', enLabel: 'Home' },
    { id: 'games', path: '/games', label: '游戏天堂', enLabel: 'Games' },
    { id: 'tools', path: '/tools', label: '实用小筑', enLabel: 'Tools' },
    { id: 'leaderboard', path: '/leaderboard', label: '排行榜', enLabel: 'Leaderboard' },
    { id: 'about', path: '/about', label: '关于我们', enLabel: 'About' },
  ], []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const cycleTheme = () => {
    const order: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const idx = order.indexOf(mode);
    setMode(order[(idx + 1) % 3]);
  };

  return (
    <>
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] font-sans text-sm font-medium border border-surface-variant flex items-center gap-3">
              <Search className="w-4 h-4 text-primary" />
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 w-full z-50 bg-[#FFF9F2]/70 dark:bg-surface/70 backdrop-blur-xl border-b border-white/50 dark:border-white/10 shadow-[0_4px_30px_rgba(184,228,201,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)] transition-all duration-300">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto relative">

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="absolute inset-x-4 inset-y-0 flex items-center bg-[#FFF9F2]/90 dark:bg-surface/95 backdrop-blur-xl z-50"
              >
                <div className="flex-grow flex flex-col">
                  <form
                    onSubmit={handleSearchSubmit}
                    className="flex items-center bg-white dark:bg-surface-container-high rounded-full px-5 py-3 shadow-[0_8px_25px_rgba(184,228,201,0.4)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.3)] border border-primary/20 dark:border-primary/10"
                  >
                    <Search className="w-5 h-5 text-primary mr-3 shrink-0" />
                    <input
                      type="text"
                      placeholder={t('搜索游戏、工具...', 'Search games, tools...')}
                      aria-label={t('搜索游戏、工具', 'Search games and tools')}
                      value={searchQuery}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      className="outline-none bg-transparent text-base w-full text-on-surface font-sans"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); setHasSearched(false); }}
                      className="text-secondary/50 hover:text-primary p-2 shrink-0 transition-colors bg-surface-container-low dark:bg-surface-container rounded-full ml-3"
                      aria-label={t('关闭搜索', 'Close search')}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </form>

                  {searchQuery && hasSearched && (
                    <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-surface-container-high rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-surface-variant/40 max-h-80 overflow-y-auto z-50">
                      {searchResults.length > 0 ? (
                        searchResults.map((result) => (
                          <button
                            key={result.item.id}
                            onClick={() => handleResultClick(result)}
                            className="w-full text-left px-5 py-3 hover:bg-surface-container-low dark:hover:bg-surface-container transition-colors flex items-center gap-3 border-b border-surface-variant/20 last:border-b-0"
                          >
                            <span className={`w-10 h-10 rounded-lg ${result.item.iconBg || 'bg-surface-container'} flex items-center justify-center text-xl shrink-0`}>
                              {result.item.icon || (result.item.type === 'game' ? '🎮' : '🛠️')}
                            </span>
                            <div>
                              <p className="font-semibold text-on-surface text-sm">{t(result.item.title, result.item.titleEn)}</p>
                              <p className="text-xs text-secondary">{result.item.category} · {result.item.type === 'game' ? t('游戏', 'Game') : t('工具', 'Tool')}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-8 text-secondary text-sm">
                          <p className="font-medium">{t('未找到相关结果', 'No results found')}</p>
                          <p className="text-xs mt-1">{t('试试其他关键词', 'Try different keywords')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-2xl font-extrabold text-primary flex items-center gap-3 font-sans tracking-tight cursor-pointer transition-transform"
          >
            <Link to="/" className="flex items-center gap-3">
              <Leaf className="w-8 h-8 fill-primary" />
              Spring Nest
            </Link>
          </motion.div>

          <nav className="hidden md:flex gap-10 items-center" aria-label={t('主导航', 'Main navigation')}>
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`font-nunito text-base tracking-wide transition-all duration-300 hover:scale-105 relative ${
                  isActive(item.path)
                    ? 'font-bold text-primary pb-1'
                    : 'font-semibold text-secondary hover:text-primary'
                }`}
              >
                {isEn ? item.enLabel : item.label}
                {isActive(item.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 text-primary relative">
            {/* Mobile menu button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 bg-white/50 dark:bg-white/10 rounded-full hover:bg-primary-container/30 transition-colors md:hidden"
              aria-label={t('菜单', 'Menu')}
            >
              <Menu className="w-5 h-5" />
            </motion.button>

            {/* Theme toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={cycleTheme}
              className="p-2 bg-white/50 dark:bg-white/10 rounded-full hover:bg-primary-container/30 transition-colors"
              aria-label={t('切换主题', 'Toggle theme')}
              title={mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🖥️'}
            >
              <span className="text-sm">
                {resolved === 'dark' ? '🌙' : '☀️'}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 bg-white/50 dark:bg-white/10 rounded-full hover:bg-primary-container/30 transition-colors"
              aria-label={t('搜索', 'Search')}
            >
              <Search className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/favorites')}
              className="p-2 bg-white/50 dark:bg-white/10 rounded-full hover:bg-primary-container/30 relative transition-colors"
              aria-label={t('收藏', 'Favorites')}
            >
              <Bell className="w-5 h-5" />
            </motion.button>

            {user ? (
              <div className="group relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-2 py-1 bg-white/50 dark:bg-white/10 rounded-full hover:bg-primary-container/30 border border-primary/10 shadow-sm transition-colors"
                  aria-label={t('用户菜单', 'User menu')}
                  aria-expanded={false}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </motion.button>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white/95 dark:bg-surface-container-high/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-surface-variant/40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right flex flex-col p-2 z-50"
                >
                  <Link to="/profile" className="text-left px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors">{t('个人中心', 'Profile')}</Link>
                  <Link to="/favorites" className="text-left px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors">{t('我的收藏', 'Favorites')}</Link>
                  <Link to="/admin" className="text-left px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {t('管理后台', 'Admin')}
                  </Link>
                  <div className="h-px bg-surface-variant/40 my-1 mx-2"></div>
                  <button
                    onClick={() => {
                      logout();
                      setToastMessage(t('已退出登录', 'Logged out successfully'));
                      setTimeout(() => setToastMessage(''), 3000);
                    }}
                    className="text-left px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >{t('退出登录', 'Log Out')}</button>
                </motion.div>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowLoginModal(true)}
                className="p-2 bg-white/50 dark:bg-white/10 rounded-full hover:bg-primary-container/30 transition-colors"
                aria-label={t('登录', 'Log in')}
              >
                <User className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[72px] left-0 right-0 z-40 bg-[#FFF9F2]/95 dark:bg-surface/95 backdrop-blur-xl border-b border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.1)] md:hidden"
          >
            <nav className="flex flex-col p-4 gap-2" aria-label={t('移动端导航', 'Mobile navigation')}>
              {navItems.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-nunito text-base font-semibold transition-all ${
                      isActive(item.path)
                        ? 'bg-primary-container/30 text-primary'
                        : 'text-secondary hover:bg-surface-container-low dark:hover:bg-surface-container'
                    }`}
                  >
                    {item.id === 'home' && <Leaf className="w-5 h-5" />}
                    {item.id === 'games' && <Gamepad2 className="w-5 h-5" />}
                    {item.id === 'tools' && <Wrench className="w-5 h-5" />}
                    {item.id === 'leaderboard' && <Trophy className="w-5 h-5" />}
                    {item.id === 'about' && <Heart className="w-5 h-5" />}
                    {isEn ? item.enLabel : item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
