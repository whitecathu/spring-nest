import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

type Mode = 'focus' | 'break';

interface PomodoroSettings {
  focusTime: number; // minutes
  breakTime: number; // minutes
  soundEnabled: boolean;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusTime: 25,
  breakTime: 5,
  soundEnabled: true,
};

const FOCUS_OPTIONS = [15, 25, 30, 45, 60];
const BREAK_OPTIONS = [5, 10, 15];

function loadStats() {
  try {
    const d = localStorage.getItem('spring_nest_pomodoro');
    return d ? JSON.parse(d) : { sessions: 0, totalMinutes: 0 };
  } catch {
    return { sessions: 0, totalMinutes: 0 };
  }
}

function saveStats(stats: { sessions: number; totalMinutes: number }) {
  localStorage.setItem('spring_nest_pomodoro', JSON.stringify(stats));
}

function loadSettings(): PomodoroSettings {
  try {
    const d = localStorage.getItem('spring_nest_pomodoro_settings');
    if (!d) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(d);
    return {
      focusTime: FOCUS_OPTIONS.includes(parsed.focusTime)
        ? parsed.focusTime
        : DEFAULT_SETTINGS.focusTime,
      breakTime: BREAK_OPTIONS.includes(parsed.breakTime)
        ? parsed.breakTime
        : DEFAULT_SETTINGS.breakTime,
      soundEnabled:
        typeof parsed.soundEnabled === 'boolean'
          ? parsed.soundEnabled
          : DEFAULT_SETTINGS.soundEnabled,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: PomodoroSettings) {
  localStorage.setItem('spring_nest_pomodoro_settings', JSON.stringify(settings));
}

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);

    oscillator.onended = () => ctx.close();
  } catch {
    // Silently fail if Web Audio API is not available
  }
}

export default function Pomodoro({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [settings, setSettings] = useState<PomodoroSettings>(loadSettings);
  const [mode, setMode] = useState<Mode>('focus');
  const [timeLeft, setTimeLeft] = useState(settings.focusTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState(loadStats);
  const [celebrating, setCelebrating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef = useRef(settings);

  // Keep ref in sync
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Save settings to localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  const clearIntervalFn = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearIntervalFn;
  }, [clearIntervalFn]);

  const startTimer = useCallback(() => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer complete
          const currentSettings = settingsRef.current;
          if (currentSettings.soundEnabled) {
            playNotificationSound();
          }
          setCelebrating(true);
          setTimeout(() => setCelebrating(false), 600);
          if (mode === 'focus') {
            setStats((s) => ({
              sessions: s.sessions + 1,
              totalMinutes: s.totalMinutes + currentSettings.focusTime,
            }));
            setMode('break');
            return currentSettings.breakTime * 60;
          } else {
            setMode('focus');
            return currentSettings.focusTime * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
  }, [mode]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    clearIntervalFn();
  }, [clearIntervalFn]);

  const resetTimer = useCallback(() => {
    pauseTimer();
    setMode('focus');
    setTimeLeft(settings.focusTime * 60);
  }, [pauseTimer, settings.focusTime]);

  const switchMode = (m: Mode) => {
    pauseTimer();
    setMode(m);
    setTimeLeft(m === 'focus' ? settings.focusTime * 60 : settings.breakTime * 60);
  };

  const updateFocusTime = (minutes: number) => {
    setSettings((s) => ({ ...s, focusTime: minutes }));
    if (mode === 'focus' && !isRunning) {
      setTimeLeft(minutes * 60);
    }
  };

  const updateBreakTime = (minutes: number) => {
    setSettings((s) => ({ ...s, breakTime: minutes }));
    if (mode === 'break' && !isRunning) {
      setTimeLeft(minutes * 60);
    }
  };

  const toggleSound = () => {
    setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }));
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalTime = (mode === 'focus' ? settings.focusTime : settings.breakTime) * 60;
  const progress = 1 - timeLeft / totalTime;

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <div className="bg-white rounded-3xl p-8 shadow-lg border border-surface-variant/30 text-center">
        {/* Mode Switch */}
        <div className="flex justify-center mb-6">
          <div className="bg-surface-container-high rounded-full p-1 flex gap-1">
            <button
              onClick={() => switchMode('focus')}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${mode === 'focus' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
            >
              {t('专注', 'Focus')} ({settings.focusTime}m)
            </button>
            <button
              onClick={() => switchMode('break')}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${mode === 'break' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
            >
              {t('休息', 'Break')} ({settings.breakTime}m)
            </button>
          </div>
        </div>

        {/* Timer Circle */}
        <div className="relative w-56 h-56 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#e2e3df" strokeWidth="8" />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={mode === 'focus' ? '#3f6751' : '#795648'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-bold text-on-surface tabular-nums tracking-tight">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-sm text-secondary font-medium mt-2">
              {mode === 'focus' ? t('专注中', 'Focusing') : t('休息中', 'Break')}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="px-8 py-4 bg-primary text-on-primary rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-on-primary" />
              {t('开始', 'Start')}
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="px-8 py-4 bg-surface-container-high text-on-surface rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Pause className="w-5 h-5" />
              {t('暂停', 'Pause')}
            </button>
          )}
          <button
            onClick={resetTimer}
            className="px-6 py-4 bg-surface-container-low text-secondary rounded-full font-semibold hover:bg-surface-container-high transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {t('重置', 'Reset')}
          </button>
        </div>

        {/* Settings Panel */}
        <div className="bg-surface-container-low rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-on-surface">{t('设置', 'Settings')}</span>
            <button
              onClick={toggleSound}
              className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
              title={settings.soundEnabled ? t('关闭提示音', 'Mute') : t('开启提示音', 'Unmute')}
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="text-xs font-medium">
                {settings.soundEnabled ? t('提示音开', 'Sound On') : t('提示音关', 'Sound Off')}
              </span>
            </button>
          </div>

          {/* Focus Time Selection */}
          <div className="mb-3">
            <div className="text-xs text-secondary font-medium mb-1.5">
              {t('专注时长', 'Focus Duration')}
            </div>
            <div className="flex gap-1.5">
              {FOCUS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateFocusTime(opt)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    settings.focusTime === opt
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-high text-secondary hover:bg-surface-container-highest'
                  }`}
                >
                  {opt}m
                </button>
              ))}
            </div>
          </div>

          {/* Break Time Selection */}
          <div>
            <div className="text-xs text-secondary font-medium mb-1.5">
              {t('休息时长', 'Break Duration')}
            </div>
            <div className="flex gap-1.5">
              {BREAK_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateBreakTime(opt)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    settings.breakTime === opt
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-high text-secondary hover:bg-surface-container-highest'
                  }`}
                >
                  {opt}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-surface-container-low rounded-2xl p-4 flex justify-around">
          <div>
            <div className="text-2xl font-bold text-primary">{stats.sessions}</div>
            <div className="text-xs text-secondary font-medium">{t('完成次数', 'Sessions')}</div>
          </div>
          <div className="w-px bg-surface-variant/50" />
          <div>
            <div className="text-2xl font-bold text-primary">{stats.totalMinutes}</div>
            <div className="text-xs text-secondary font-medium">{t('专注分钟', 'Minutes')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
