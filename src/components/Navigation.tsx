import { useState, useMemo, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Search,
  User,
  Leaf,
  X,
  Trophy,
  Shield,
  Menu,
  Gamepad2,
  Wrench,
  Heart,
  Moon,
  Monitor,
  Sun,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoginModal from './LoginModal';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { search } from '../services/searchService';
import { trackSearch } from '../lib/analytics';

export default function Navigation() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof search>>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, language, t } = useUser();
  const { mode, setMode, resolved } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isEn = language === 'en';

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  // Offline status monitoring
  useEffect(() => {
    const handleOffline = () => {
      setToastMessage(
        t('网络已断开，请检查网络连接', 'You are offline. Please check your network connection.'),
      );
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setShowSearch(false);
      setShowMobileMenu(false);
      setShowUserMenu(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(value), 300);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    trackSearch(query);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleResultClick = (result: ReturnType<typeof search>[0]) => {
    const slug = result.item.route.split('/').pop();
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    navigate(result.item.type === 'game' ? `/games/${slug}` : `/tools/${slug}`);
  };

  const navItems = useMemo(
    () => [
      { id: 'home', path: '/', label: '首页', enLabel: 'Home' },
      { id: 'games', path: '/games', label: '游戏天堂', enLabel: 'Games' },
      { id: 'tools', path: '/tools', label: '实用小筑', enLabel: 'Tools' },
      { id: 'leaderboard', path: '/leaderboard', label: '排行榜', enLabel: 'Leaderboard' },
      { id: 'about', path: '/about', label: '关于我们', enLabel: 'About' },
    ],
    [],
  );

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
            <div
              role="status"
              aria-live="polite"
              className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] font-sans text-sm font-medium border border-surface-variant flex items-center gap-3"
            >
              <Search className="w-4 h-4 text-primary" />
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 w-full z-50 bg-[#FFF9F2]/70 dark:bg-surface/70 backdrop-blur-xl border-b border-white/50 dark:border-white/10 shadow-[0_4px_30px_rgba(184,228,201,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)] transition-all duration-300">
        <div className="flex justify-between items-center w-full px-3 py-4 sm:px-6 max-w-7xl mx-auto relative">
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
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                        setSearchResults([]);
                        setHasSearched(false);
                      }}
                      className="text-secondary/50 hover:text-primary p-2.5 shrink-0 transition-colors bg-surface-container-low dark:bg-surface-container rounded-full ml-3"
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
                            <span
                              className={`w-10 h-10 rounded-lg ${result.item.iconBg || 'bg-surface-container'} flex items-center justify-center text-xl shrink-0`}
                            >
                              {result.item.icon || (result.item.type === 'game' ? '🎮' : '🛠️')}
                            </span>
                            <div>
                              <p className="font-semibold text-on-surface text-sm">
                                {t(result.item.title, result.item.titleEn)}
                              </p>
                              <p className="text-xs text-secondary">
                                {result.item.category} ·{' '}
                                {result.item.type === 'game'
                                  ? t('游戏', 'Game')
                                  : t('工具', 'Tool')}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-8 text-secondary text-sm">
                          <p className="font-medium">{t('未找到相关结果', 'No results found')}</p>
                          <p className="text-xs mt-1">
                            {t('试试其他关键词', 'Try different keywords')}
                          </p>
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
            className="text-sm font-extrabold text-primary flex items-center gap-1 font-sans tracking-tight cursor-pointer transition-transform sm:gap-3 sm:text-2xl"
          >
            <Link
              to="/"
              className="flex min-h-11 items-center gap-1 sm:gap-3"
              aria-label="Spring Nest"
            >
              <Leaf className="h-6 w-6 fill-primary sm:h-8 sm:w-8" />
              <span className="whitespace-nowrap">Spring Nest</span>
            </Link>
          </motion.div>

          <nav
            className="hidden md:flex gap-10 items-center"
            aria-label={t('主导航', 'Main navigation')}
          >
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`relative inline-flex min-h-11 min-w-11 items-center justify-center font-nunito text-base tracking-wide transition-all duration-300 hover:scale-105 ${
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
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-4 text-primary relative">
            {/* Mobile menu button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="min-h-11 min-w-11 p-2.5 bg-white/50 dark:bg-white/10 rounded-full hover:bg-primary-container/30 transition-colors md:hidden"
              aria-label={t('菜单', 'Menu')}
              aria-expanded={showMobileMenu}
              aria-controls="mobile-navigation"
            >
              <Menu className="w-5 h-5" />
            </motion.button>

            {/* Theme toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={cycleTheme}
              className="min-h-11 min-w-11 p-2.5 bg-white/50 dark:bg-white/10 rounded-full hover:bg-primary-container/30 transition-colors"
              aria-label={t('切换主题', 'Toggle theme')}
              title={
                mode === 'light'
                  ? t('浅色主题', 'Light theme')
                  : mode === 'dark'
                    ? t('深色主题', 'Dark theme')
                    : t('跟随系统', 'System theme')
              }
            >
              {mode === 'system' ? (
                <Monitor className="h-5 w-5" />
              ) : resolved === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSearch(!showSearch)}
              className="min-h-11 min-w-11 p-2.5 bg-white/50 dark:bg-white/10 rounded-full hover:bg-primary-container/30 transition-colors"
              aria-label={t('搜索', 'Search')}
            >
              <Search className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/favorites')}
              className="hidden sm:inline-flex p-2.5 bg-white/50 dark:bg-white/10 rounded-full hover:bg-primary-container/30 relative transition-colors"
              aria-label={t('收藏', 'Favorites')}
            >
              <Bell className="w-5 h-5" />
            </motion.button>

            {user ? (
              <div
                className="relative"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setShowUserMenu(false);
                  }
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu((open) => !open)}
                  className="flex min-h-11 min-w-11 items-center justify-center gap-2 px-1.5 py-1 bg-white/50 dark:bg-white/10 rounded-full hover:bg-primary-container/30 border border-primary/10 shadow-sm transition-colors sm:px-2"
                  aria-label={t('用户菜单', 'User menu')}
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </motion.button>

                <div
                  className={`absolute right-0 top-full mt-2 w-48 bg-white/95 dark:bg-surface-container-high/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-surface-variant/40 transition-all duration-200 transform origin-top-right flex flex-col p-2 z-50 ${
                    showUserMenu
                      ? 'opacity-100 visible translate-y-0'
                      : 'opacity-0 invisible -translate-y-1'
                  }`}
                >
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="text-left px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                  >
                    {t('个人中心', 'Profile')}
                  </Link>
                  <Link
                    to="/favorites"
                    onClick={() => setShowUserMenu(false)}
                    className="text-left px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                  >
                    {t('我的收藏', 'Favorites')}
                  </Link>
                  <Link
                    to="/admin"
                    onClick={() => setShowUserMenu(false)}
                    className="text-left px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    {t('管理后台', 'Admin')}
                  </Link>
                  <div className="h-px bg-surface-variant/40 my-1 mx-2"></div>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      setToastMessage(t('已退出登录', 'Logged out successfully'));
                      setTimeout(() => setToastMessage(''), 3000);
                    }}
                    className="text-left px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    {t('退出登录', 'Log Out')}
                  </button>
                </div>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowLoginModal(true)}
                className="inline-flex min-h-11 min-w-11 p-2.5 bg-white/50 dark:bg-white/10 rounded-full hover:bg-primary-container/30 transition-colors"
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
          <>
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[72px] left-0 right-0 z-40 bg-[#FFF9F2]/95 dark:bg-surface/95 backdrop-blur-xl border-b border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.1)] md:hidden"
            >
              <nav
                id="mobile-navigation"
                className="flex flex-col p-4 gap-2"
                aria-label={t('移动端导航', 'Mobile navigation')}
              >
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ x: 4 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-nunito text-base font-semibold transition-all min-h-[48px] ${
                        isActive(item.path)
                          ? 'bg-primary-container/30 text-primary border-l-[3px] border-primary'
                          : 'text-secondary hover:bg-surface-container-low dark:hover:bg-surface-container border-l-[3px] border-transparent'
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
                <div className="mt-2 grid gap-2 border-t border-surface-variant/40 pt-3">
                  <Link
                    to="/favorites"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 font-nunito text-base font-semibold text-secondary transition-all hover:bg-surface-container-low dark:hover:bg-surface-container"
                  >
                    <Bell className="h-5 w-5" />
                    {t('我的收藏', 'Favorites')}
                  </Link>
                  {user ? (
                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 font-nunito text-base font-semibold text-secondary transition-all hover:bg-surface-container-low dark:hover:bg-surface-container"
                    >
                      <User className="h-5 w-5" />
                      {t('个人中心', 'Profile')}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowLoginModal(true);
                      }}
                      className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 text-left font-nunito text-base font-semibold text-secondary transition-all hover:bg-surface-container-low dark:hover:bg-surface-container"
                    >
                      <User className="h-5 w-5" />
                      {t('登录', 'Log in')}
                    </button>
                  )}
                </div>
              </nav>
            </motion.div>
          </>
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
