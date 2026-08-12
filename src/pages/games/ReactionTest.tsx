import { useState, useEffect, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, RotateCcw, Trophy, Timer, Zap } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { loadGameValue, saveGameValue } from '../../lib/gameScore';

type Phase = 'idle' | 'waiting' | 'ready' | 'result' | 'early';

const BEST_KEY = 'spring_nest_reaction_best';
const HISTORY_KEY = 'spring_nest_reaction_history';

function loadHistory(): number[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}
function saveHistory(history: number[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function getRating(ms: number): { text: string; emoji: string; color: string } {
  if (ms < 200) return { text: '闪电反应!', emoji: '⚡', color: 'text-yellow-500' };
  if (ms < 300) return { text: '反应很快!', emoji: '🚀', color: 'text-green-500' };
  if (ms < 500) return { text: '还不错', emoji: '👍', color: 'text-blue-500' };
  return { text: '需要练习', emoji: '😅', color: 'text-orange-500' };
}
function getRatingEn(ms: number): { text: string; emoji: string; color: string } {
  if (ms < 200) return { text: 'Lightning fast!', emoji: '⚡', color: 'text-yellow-500' };
  if (ms < 300) return { text: 'Very quick!', emoji: '🚀', color: 'text-green-500' };
  if (ms < 500) return { text: 'Not bad!', emoji: '👍', color: 'text-blue-500' };
  return { text: 'Keep practicing', emoji: '😅', color: 'text-orange-500' };
}

// Particle burst for results
interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

export default function ReactionTest({ onBack }: { onBack: () => void }) {
  const { t, language } = useUser();
  const [phase, setPhase] = useState<Phase>('idle');
  const [reactionTime, setReactionTime] = useState(0);
  const [bestTime, setBestTime] = useState(() => loadGameValue(BEST_KEY));
  const [history, setHistory] = useState<number[]>(loadHistory);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [screenFlash, setScreenFlash] = useState<'green' | 'red' | null>(null);

  const readyTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const particleIdRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const spawnParticles = useCallback((count: number, type: 'success' | 'fail') => {
    const emojis = type === 'success' ? ['⚡', '✨', '💫', '🌟', '⭐'] : ['💥', '😤', '❌'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 60,
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  }, []);

  const startRound = useCallback(() => {
    clearTimer();
    setPhase('waiting');
    setReactionTime(0);
    setParticles([]);
    setScreenFlash(null);

    const delay = 2000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      readyTimeRef.current = performance.now();
      setPhase('ready');
      setScreenFlash('green');
      setTimeout(() => setScreenFlash(null), 150);
    }, delay);
  }, [clearTimer]);

  const handleClick = useCallback(() => {
    if (phase === 'idle') {
      startRound();
      return;
    }

    if (phase === 'waiting') {
      clearTimer();
      setPhase('early');
      setScreenFlash('red');
      spawnParticles(6, 'fail');
      setTimeout(() => setScreenFlash(null), 200);
      return;
    }

    if (phase === 'early') {
      startRound();
      return;
    }

    if (phase === 'ready') {
      const now = performance.now();
      const ms = Math.round(now - readyTimeRef.current);
      setReactionTime(ms);
      setPhase('result');

      if (bestTime === 0 || ms < bestTime) {
        setBestTime(ms);
        saveGameValue(BEST_KEY, ms);
      }

      const newHistory = [ms, ...history].slice(0, 5);
      setHistory(newHistory);
      saveHistory(newHistory);

      // Success particles
      const particleCount = ms < 200 ? 15 : ms < 300 ? 10 : 6;
      spawnParticles(particleCount, 'success');
      return;
    }

    if (phase === 'result') {
      startRound();
    }
  }, [phase, startRound, clearTimer, bestTime, history, spawnParticles]);

  const getBgColor = () => {
    switch (phase) {
      case 'idle':
        return 'bg-surface-container-high';
      case 'waiting':
        return 'bg-red-400 dark:bg-red-500';
      case 'ready':
        return 'bg-green-400 dark:bg-green-500';
      case 'early':
        return 'bg-orange-400 dark:bg-orange-500';
      case 'result':
        return 'bg-surface-container-high';
    }
  };

  const rating = language === 'en' ? getRatingEn(reactionTime) : getRating(reactionTime);

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[44px] px-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-on-surface">
              {t('反应速度测试', 'Reaction Test')}
            </h1>
            <p className="text-sm text-secondary">
              {t('测试你的反应速度！', 'Test your reaction speed!')}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-high rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-secondary font-medium flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {t('最佳', 'Best')}
              </div>
              <div className="text-xl font-bold text-tertiary tabular-nums">
                {bestTime > 0 ? `${bestTime}ms` : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Click Area */}
        <button
          onClick={handleClick}
          className={`w-full rounded-2xl min-h-[260px] flex flex-col items-center justify-center transition-colors duration-150 cursor-pointer select-none relative overflow-hidden ${getBgColor()} ${
            phase === 'waiting' ? 'animate-pulse' : ''
          }`}
        >
          {/* Screen flash overlay */}
          {screenFlash && (
            <div
              className={`absolute inset-0 rounded-2xl ${
                screenFlash === 'green' ? 'bg-green-300/40' : 'bg-red-300/40'
              }`}
            />
          )}

          {/* Particles */}
          {particles.map((p) => (
            <span key={p.id} className="absolute text-2xl pointer-events-none">
              {p.emoji}
            </span>
          ))}

          {phase === 'idle' && (
            <div key="idle" className="text-center px-4">
              <div className="text-6xl mb-4">⚡</div>
              <p className="text-2xl font-bold text-on-surface mb-2">
                {t('点击开始', 'Tap to Start')}
              </p>
              <p className="text-sm text-secondary">
                {t(
                  '当背景变绿时，尽快点击！',
                  'When the background turns green, tap as fast as you can!',
                )}
              </p>
            </div>
          )}

          {phase === 'waiting' && (
            <div key="waiting" className="text-center px-4">
              <p className="text-4xl font-black text-white mb-2">
                {t('等待变色...', 'Wait for green...')}
              </p>
              <p className="text-sm text-white/80">{t('不要提前点击！', "Don't click early!")}</p>
            </div>
          )}

          {phase === 'ready' && (
            <div key="ready" className="text-center px-4">
              <p className="text-6xl font-black text-white drop-shadow-lg">{t('点击！', 'TAP!')}</p>
            </div>
          )}

          {phase === 'early' && (
            <div key="early" className="text-center px-4">
              <p className="text-5xl mb-3">😤</p>
              <p className="text-3xl font-black text-white mb-2">{t('太早了！', 'Too Early!')}</p>
              <p className="text-sm text-white/80">{t('点击重新开始', 'Tap to try again')}</p>
            </div>
          )}

          {phase === 'result' && (
            <div key="result" className="text-center px-4">
              <p className="text-lg text-secondary mb-1">
                {t('你的反应时间', 'Your reaction time')}
              </p>
              <p className={`text-7xl font-black ${rating.color} tabular-nums drop-shadow-lg`}>
                {reactionTime}ms
              </p>
              <p className="text-2xl font-bold mt-3">
                {rating.emoji} {rating.text}
              </p>
              <p className="text-sm text-secondary mt-2">{t('点击再来一次', 'Tap to try again')}</p>
            </div>
          )}
        </button>

        {/* Controls */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={startRound}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {t('再来一次', 'Try Again')}
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6 p-4 bg-surface-container-high rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Timer className="w-4 h-4 text-secondary" />
              <span className="text-sm font-semibold text-on-surface">
                {t('最近记录', 'Recent Attempts')}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {history.map((ms, i) => {
                const r = language === 'en' ? getRatingEn(ms) : getRating(ms);
                return (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-secondary">
                      {t('第', '#')}
                      {i + 1}
                      {t('次', '')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold tabular-nums ${r.color}`}>{ms}ms</span>
                      <span className="text-sm">{r.emoji}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
