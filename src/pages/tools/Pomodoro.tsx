import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

type Mode = 'focus' | 'break';

function loadStats() {
  try {
    const d = localStorage.getItem('spring_nest_pomodoro');
    return d ? JSON.parse(d) : { sessions: 0, totalMinutes: 0 };
  } catch { return { sessions: 0, totalMinutes: 0 }; }
}

function saveStats(stats: { sessions: number; totalMinutes: number }) {
  localStorage.setItem('spring_nest_pomodoro', JSON.stringify(stats));
}

export default function Pomodoro({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [mode, setMode] = useState<Mode>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState(loadStats);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Timer complete
          if (mode === 'focus') {
            setStats(s => ({ sessions: s.sessions + 1, totalMinutes: s.totalMinutes + 25 }));
            setMode('break');
            return BREAK_TIME;
          } else {
            setMode('focus');
            return FOCUS_TIME;
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
    setTimeLeft(FOCUS_TIME);
  }, [pauseTimer]);

  const switchMode = (m: Mode) => {
    pauseTimer();
    setMode(m);
    setTimeLeft(m === 'focus' ? FOCUS_TIME : BREAK_TIME);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalTime = mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
  const progress = 1 - timeLeft / totalTime;

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm">
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-lg border border-surface-variant/30 text-center">
        {/* Mode Switch */}
        <div className="flex justify-center mb-8">
          <div className="bg-surface-container-high rounded-full p-1 flex gap-1">
            <button
              onClick={() => switchMode('focus')}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${mode === 'focus' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
            >{t('专注', 'Focus')} (25{mode === 'focus' ? '' : 'm'})</button>
            <button
              onClick={() => switchMode('break')}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${mode === 'break' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
            >{t('休息', 'Break')} (5{mode === 'break' ? '' : 'm'})</button>
          </div>
        </div>

        {/* Timer Circle */}
        <div className="relative w-56 h-56 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#e2e3df" strokeWidth="8" />
            <circle
              cx="100" cy="100" r="90"
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
        <div className="flex justify-center gap-4 mb-8">
          {!isRunning ? (
            <button onClick={startTimer} className="px-8 py-4 bg-primary text-on-primary rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
              <Play className="w-5 h-5 fill-on-primary" />
              {t('开始', 'Start')}
            </button>
          ) : (
            <button onClick={pauseTimer} className="px-8 py-4 bg-surface-container-high text-on-surface rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
              <Pause className="w-5 h-5" />
              {t('暂停', 'Pause')}
            </button>
          )}
          <button onClick={resetTimer} className="px-6 py-4 bg-surface-container-low text-secondary rounded-full font-semibold hover:bg-surface-container-high transition-all flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            {t('重置', 'Reset')}
          </button>
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
      </motion.div>
    </div>
  );
}
