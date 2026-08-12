import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

type Tab = 'countdown' | 'stopwatch';

export default function TimerStopwatch({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [tab, setTab] = useState<Tab>('countdown');

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <div className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30">
        <h2 className="text-2xl font-bold text-on-surface text-center mb-6">
          {t('倒计时与秒表', 'Timer & Stopwatch')}
        </h2>

        {/* Tab Switch */}
        <div className="flex justify-center mb-6">
          <div className="bg-surface-container-high rounded-full p-1 flex gap-1">
            <button
              onClick={() => setTab('countdown')}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${tab === 'countdown' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
            >
              {t('倒计时', 'Countdown')}
            </button>
            <button
              onClick={() => setTab('stopwatch')}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${tab === 'stopwatch' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
            >
              {t('秒表', 'Stopwatch')}
            </button>
          </div>
        </div>

        {tab === 'countdown' ? <CountdownTab /> : <StopwatchTab />}
      </div>
    </div>
  );
}

/* ============ Countdown Tab ============ */

function CountdownTab() {
  const { t } = useUser();
  const [inputMinutes, setInputMinutes] = useState(5);
  const [inputSeconds, setInputSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(0);

  const clearIntervalFn = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearIntervalFn;
  }, [clearIntervalFn]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const handleStart = useCallback(() => {
    if (!started) {
      const total = inputMinutes * 60 + inputSeconds;
      if (total <= 0) return;
      setTimeLeft(total);
      timeLeftRef.current = total;
      setStarted(true);
      setFinished(false);
    }
    setIsRunning(true);
    clearIntervalFn();

    intervalRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      if (timeLeftRef.current <= 0) {
        setTimeLeft(0);
        clearIntervalFn();
        setIsRunning(false);
        setFinished(true);
        // Vibrate if available
        try {
          navigator.vibrate?.([200, 100, 200]);
        } catch {
          /* ignore */
        }
        return;
      }
      setTimeLeft(timeLeftRef.current);
    }, 1000);
  }, [started, inputMinutes, inputSeconds, clearIntervalFn]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    clearIntervalFn();
  }, [clearIntervalFn]);

  const handleReset = useCallback(() => {
    clearIntervalFn();
    setIsRunning(false);
    setStarted(false);
    setFinished(false);
    setTimeLeft(0);
  }, [clearIntervalFn]);

  const setQuickTime = (minutes: number) => {
    if (isRunning) return;
    setInputMinutes(minutes);
    setInputSeconds(0);
    setStarted(false);
    setFinished(false);
    setTimeLeft(0);
  };

  const displayMinutes = Math.floor(timeLeft / 60);
  const displaySeconds = timeLeft % 60;

  return (
    <div>
      {/* Quick Buttons */}
      <div className="flex gap-2 mb-4">
        {[1, 3, 5, 10].map((m) => (
          <button
            key={m}
            onClick={() => setQuickTime(m)}
            disabled={isRunning}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              inputMinutes === m && inputSeconds === 0 && !started
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-high text-secondary hover:bg-surface-variant'
            } disabled:opacity-40`}
          >
            {m}min
          </button>
        ))}
      </div>

      {/* Input */}
      {!started && (
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex flex-col items-center">
            <input
              type="number"
              aria-label={t('计时分钟', 'Timer minutes')}
              min={0}
              max={99}
              value={inputMinutes}
              onChange={(e) =>
                setInputMinutes(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))
              }
              className="w-20 text-center text-3xl font-bold text-on-surface bg-surface-container-low rounded-2xl p-3 border border-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="text-xs text-secondary mt-1">{t('分', 'min')}</span>
          </div>
          <span className="text-3xl font-bold text-secondary">:</span>
          <div className="flex flex-col items-center">
            <input
              type="number"
              aria-label={t('计时秒数', 'Timer seconds')}
              min={0}
              max={59}
              value={inputSeconds}
              onChange={(e) =>
                setInputSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))
              }
              className="w-20 text-center text-3xl font-bold text-on-surface bg-surface-container-low rounded-2xl p-3 border border-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="text-xs text-secondary mt-1">{t('秒', 'sec')}</span>
          </div>
        </div>
      )}

      {/* Display */}
      {started && (
        <div
          className={`text-center mb-6 py-8 rounded-2xl ${finished ? 'bg-red-50 animate-pulse' : 'bg-surface-container-low'}`}
        >
          <div
            className={`text-6xl font-bold tabular-nums ${finished ? 'text-red-500' : 'text-on-surface'}`}
          >
            {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
          </div>
          {finished && (
            <div className="text-red-500 font-semibold mt-2">{t('时间到！', "Time's up!")}</div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={started ? false : inputMinutes === 0 && inputSeconds === 0}
            className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <Play className="w-5 h-5 fill-on-primary" />
            {t('开始', 'Start')}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-8 py-3 bg-surface-container-high text-on-surface rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Pause className="w-5 h-5" />
            {t('暂停', 'Pause')}
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-6 py-3 bg-surface-container-low text-secondary rounded-full font-semibold hover:bg-surface-container-high transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          {t('重置', 'Reset')}
        </button>
      </div>
    </div>
  );
}

/* ============ Stopwatch Tab ============ */

interface Lap {
  id: number;
  lapTime: number;
  totalTime: number;
}

function StopwatchTab() {
  const { t } = useUser();
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const startTimeRef = useRef(0);
  const lapCountRef = useRef(0);

  const clearIntervalFn = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearIntervalFn;
  }, [clearIntervalFn]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
    startTimeRef.current = Date.now() - elapsedRef.current;
    clearIntervalFn();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      elapsedRef.current = now - startTimeRef.current;
      setElapsed(elapsedRef.current);
    }, 10);
  }, [clearIntervalFn]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    clearIntervalFn();
  }, [clearIntervalFn]);

  const handleReset = useCallback(() => {
    clearIntervalFn();
    setIsRunning(false);
    setElapsed(0);
    elapsedRef.current = 0;
    startTimeRef.current = 0;
    lapCountRef.current = 0;
    setLaps([]);
  }, [clearIntervalFn]);

  const handleLap = useCallback(() => {
    if (!isRunning) return;
    lapCountRef.current += 1;
    const prevLapTotal = laps.length > 0 ? laps[0].totalTime : 0;
    const newLap: Lap = {
      id: lapCountRef.current,
      lapTime: elapsedRef.current - prevLapTotal,
      totalTime: elapsedRef.current,
    };
    setLaps((prev) => [newLap, ...prev]);
  }, [isRunning, laps]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  };

  return (
    <div>
      {/* Display */}
      <div className="text-center mb-6 py-8 bg-surface-container-low rounded-2xl">
        <div className="text-5xl font-bold tabular-nums text-on-surface">{formatTime(elapsed)}</div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mb-4">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Play className="w-5 h-5 fill-on-primary" />
            {elapsed > 0 ? t('继续', 'Resume') : t('开始', 'Start')}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-8 py-3 bg-surface-container-high text-on-surface rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Pause className="w-5 h-5" />
            {t('暂停', 'Pause')}
          </button>
        )}
        <button
          onClick={handleLap}
          disabled={!isRunning}
          className="px-6 py-3 bg-primary-container/50 text-primary rounded-full font-semibold hover:bg-primary-container transition-all flex items-center gap-2 disabled:opacity-40"
        >
          <Flag className="w-5 h-5" />
          {t('计圈', 'Lap')}
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-3 bg-surface-container-low text-secondary rounded-full font-semibold hover:bg-surface-container-high transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          {t('重置', 'Reset')}
        </button>
      </div>

      {/* Laps */}
      {laps.length > 0 && (
        <div className="mt-4 bg-surface-container-low rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-bold text-secondary">{t('圈次', 'Lap')}</span>
            <span className="text-xs font-bold text-secondary">{t('分段', 'Split')}</span>
            <span className="text-xs font-bold text-secondary">{t('总时间', 'Total')}</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {laps.map((lap) => (
              <div
                key={lap.id}
                className="flex items-center justify-between bg-white rounded-xl px-3 py-2"
              >
                <span className="text-sm font-semibold text-on-surface w-12">
                  {t('第', '#')}
                  {lap.id}
                  {t('圈', '')}
                </span>
                <span className="text-sm font-mono text-secondary tabular-nums">
                  {formatTime(lap.lapTime)}
                </span>
                <span className="text-sm font-mono text-on-surface tabular-nums">
                  {formatTime(lap.totalTime)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
