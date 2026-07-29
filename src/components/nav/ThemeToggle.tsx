import { Moon, Monitor, Sun } from 'lucide-react';
import { MotionButton } from '../GsapSurface';

interface ThemeToggleProps {
  mode: 'light' | 'dark' | 'system';
  resolved: 'light' | 'dark';
  onCycleTheme: () => void;
  iconButtonClass: string;
  t: (zh: string, en: string) => string;
}

export default function ThemeToggle({
  mode,
  resolved,
  onCycleTheme,
  iconButtonClass,
  t,
}: ThemeToggleProps) {
  return (
    <MotionButton
      type="button"
      tone="icon"
      onClick={onCycleTheme}
      className={iconButtonClass}
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
    </MotionButton>
  );
}
