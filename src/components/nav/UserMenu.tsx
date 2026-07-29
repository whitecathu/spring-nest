import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { MotionButton } from '../GsapSurface';
import type { UserProfile } from '../../contexts/UserContext';

interface UserMenuProps {
  user: UserProfile | null;
  showUserMenu: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
  onOpenLogin: () => void;
  iconButtonClass: string;
  t: (zh: string, en: string) => string;
}

export default function UserMenu({
  user,
  showUserMenu,
  onToggle,
  onClose,
  onLogout,
  onOpenLogin,
  iconButtonClass,
  t,
}: UserMenuProps) {
  if (!user) {
    return (
      <MotionButton
        type="button"
        tone="icon"
        onClick={onOpenLogin}
        className={iconButtonClass}
        aria-label={t('登录', 'Log in')}
      >
        <User className="w-5 h-5" />
      </MotionButton>
    );
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onClose();
        }
      }}
    >
      <MotionButton
        type="button"
        tone="icon"
        onClick={onToggle}
        className={`${iconButtonClass} border border-primary/10 shadow-sm`}
        aria-label={t('用户菜单', 'User menu')}
        aria-expanded={showUserMenu}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
          {user.username.charAt(0).toUpperCase()}
        </div>
      </MotionButton>

      <div
        className={`absolute right-0 top-full mt-2 w-48 bg-white/95 dark:bg-surface-container-high/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-surface-variant/40 transition-all duration-200 transform origin-top-right flex flex-col p-2 z-50 ${
          showUserMenu
            ? 'opacity-100 visible translate-y-0'
            : 'opacity-0 invisible -translate-y-1'
        }`}
      >
        <Link
          to="/profile"
          onClick={onClose}
          className="text-left px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors"
        >
          {t('个人中心', 'Profile')}
        </Link>
        <Link
          to="/favorites"
          onClick={onClose}
          className="text-left px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors"
        >
          {t('我的收藏', 'Favorites')}
        </Link>
        <Link
          to="/feedback"
          onClick={onClose}
          className="text-left px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors flex items-center gap-2"
        >
          {t('反馈建议', 'Feedback')}
        </Link>
        <div className="h-px bg-surface-variant/40 my-1 mx-2"></div>
        <button
          onClick={onLogout}
          className="text-left px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
        >
          {t('退出登录', 'Log Out')}
        </button>
      </div>
    </div>
  );
}
