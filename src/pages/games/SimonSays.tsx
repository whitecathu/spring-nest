import { useState, useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, RotateCcw, Trophy, Zap } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { springBouncy, springSnappy } from '../../lib/animations';
import { loadBestScore, saveBestScore } from '../../lib/gameScore';

const COLORS = [
  { id: 0, bg: '#ef4444', active: '#fca5a5', name: ['红', 'Red'] as [string, string] },
  { id: 1, bg: '#22c55e', active: '#86efac', name: ['绿', 'Green'] as [string, string] },
  { id: 2, bg: '#3b82f6', active: '#93c5fd', name: ['蓝', 'Blue'] as [string, string] },
  { id: 3, bg: '#eab308', active: '#fde047', name: ['黄', 'Yellow'] as [string, string] },
];

export default function SimonSays({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [gameState, setGameState] = useState<'idle' | 'showing' | 'input' | 'wrong' | 'idle_next'>(
    'idle',
  );
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => loadBestScore('simon'));
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [speed, setSpeed] = useState(600);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sequenceRef = useRef<number[]>([]);

  const [showScorePopup, setShowScorePopup] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [shakeGrid, setShakeGrid] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const prevSpeedRef = useRef(600);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearTimer();
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    },
    [clearTimer],
  );

  const playSequence = useCallback((seq: number[], spd: number) => {
    setGameState('showing');
    let i = 0;
    const show = () => {
      if (i >= seq.length) {
        setActiveColor(null);
        setGameState('input');
        setPlayerIndex(0);
        return;
      }
      setActiveColor(seq[i]);
      timeoutRef.current = setTimeout(() => {
        setActiveColor(null);
        timeoutRef.current = setTimeout(() => {
          i++;
          show();
        }, spd * 0.3);
      }, spd * 0.6);
    };
    show();
  }, []);

  const startGame = useCallback(() => {
    clearTimer();
    const first = Math.floor(Math.random() * 4);
    const seq = [first];
    sequenceRef.current = seq;
    setSequence(seq);
    setScore(0);
    setCombo(0);
    setSpeed(600);
    setPlayerIndex(0);
    setActiveColor(null);
    setIsNewRecord(false);
    setShowScorePopup(false);
    setShakeGrid(false);
    setLevelUpFlash(false);
    prevSpeedRef.current = 600;
    setGameState('idle_next');
    timeoutRef.current = setTimeout(() => playSequence(seq, 600), 500);
  }, [clearTimer, playSequence]);

  const handleColorTap = useCallback(
    (colorId: number) => {
      if (gameState !== 'input') return;

      setActiveColor(colorId);
      const t1 = setTimeout(() => setActiveColor(null), 200);
      timeoutsRef.current.push(t1);

      const expected = sequenceRef.current[playerIndex];
      if (colorId !== expected) {
        setGameState('wrong');
        setShakeGrid(true);
        const t2 = setTimeout(() => setShakeGrid(false), 500);
        timeoutsRef.current.push(t2);
        clearTimer();
        const s = score;
        const best = loadBestScore('simon');
        if (s > best) {
          saveBestScore('simon', s);
          setBestScore(s);
          setIsNewRecord(true);
        }
        return;
      }

      const nextIndex = playerIndex + 1;
      setPlayerIndex(nextIndex);

      if (nextIndex >= sequenceRef.current.length) {
        // Completed the sequence!
        const newScore = score + 1;
        setScore(newScore);
        setCombo((c) => c + 1);

        setShowScorePopup(true);
        const t3 = setTimeout(() => setShowScorePopup(false), 800);
        timeoutsRef.current.push(t3);

        const best = loadBestScore('simon');
        if (newScore > best) {
          saveBestScore('simon', newScore);
          setBestScore(newScore);
          setIsNewRecord(true);
          const t4 = setTimeout(() => setIsNewRecord(false), 2000);
          timeoutsRef.current.push(t4);
        }

        // Speed up every 3 rounds
        const newSpeed = Math.max(250, 600 - Math.floor(newScore / 3) * 40);
        if (newSpeed < prevSpeedRef.current) {
          setLevelUpFlash(true);
          const tFlash = setTimeout(() => setLevelUpFlash(false), 600);
          timeoutsRef.current.push(tFlash);
        }
        prevSpeedRef.current = newSpeed;
        setSpeed(newSpeed);

        // Add next color to sequence
        const nextColor = Math.floor(Math.random() * 4);
        const newSeq = [...sequenceRef.current, nextColor];
        sequenceRef.current = newSeq;
        setSequence(newSeq);
        setPlayerIndex(0);

        // Small delay then show next sequence
        setGameState('idle_next');
        timeoutRef.current = setTimeout(() => playSequence(newSeq, newSpeed), 800);
      }
    },
    [gameState, playerIndex, score, clearTimer, playSequence],
  );

  const formatRound = useCallback((n: number) => t(`第 ${n} 轮`, `Round ${n}`), [t]);

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-on-surface">{t('西蒙说', 'Simon Says')}</h1>
            <p className="text-sm text-secondary">
              {t('记住颜色顺序，跟随着挑战！', 'Remember the color sequence and follow along!')}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-high rounded-xl px-3 py-2 text-center relative">
              <div className="text-xs text-secondary font-medium">{t('分数', 'Score')}</div>
              <div
                key={score}
                className="text-xl font-bold text-primary tabular-nums"
              >
                {score}
              </div>
              {/* +1 floating text with particle dots */}
              {showScorePopup && (
                  <>
                    <div
                      className="absolute -top-6 left-1/2 -translate-x-1/2 text-green-500 font-bold text-lg pointer-events-none whitespace-nowrap z-20"
                    >
                      +1
                    </div>
                    {/* Particle dots flying outward */}
                    {[0, 1, 2, 3, 4, 5].map((i) => {
                      const angle = (i / 6) * Math.PI * 2;
                      const dist = 28 + Math.random() * 12;
                      return (
                        <span
                          key={`particle-${i}`}
                          className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-green-400 pointer-events-none z-20"
                        />
                      );
                    })}
                  </>
                )}
            </div>
            <div
              className={`bg-surface-container-high rounded-xl px-3 py-2 text-center relative ${isNewRecord ? 'ring-2 ring-amber-400' : ''}`}
            >
              <div className="text-xs text-secondary font-medium flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {t('最佳', 'Best')}
              </div>
              <div
                className="text-xl font-bold text-tertiary tabular-nums"
              >
                {bestScore}
              </div>
              {/* New record glow */}
              {isNewRecord && (
                <div
                  className="absolute inset-0 rounded-xl bg-amber-400/20 pointer-events-none"
                />
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-4">
          {gameState === 'showing' && (
              <p
                key="showing"
                className="text-sm font-semibold text-amber-500"
              >
                {t('👀 仔细看...', '👀 Watch carefully...')}
              </p>
            )}
            {gameState === 'input' && (
              <p
                key="input"
                className="text-sm font-semibold text-green-500"
              >
                {t('🎯 轮到你了！', '🎯 Your turn!')}
              </p>
            )}
            {gameState === 'idle_next' && (
              <p
                key="next"
                className="text-sm font-semibold text-blue-500"
              >
                {formatRound(sequence.length)}
              </p>
            )}
            {gameState === 'wrong' && (
              <p
                key="wrong"
                className="text-sm font-semibold text-red-500"
              >
                {t('💥 答错了！', '💥 Wrong!')}
              </p>
            )}
        </div>

        {/* Combo */}
        {combo >= 3 && gameState !== 'wrong' && (
            <div
              className="flex items-center justify-center gap-1 mb-3 relative"
            >
              {/* Glow pulse behind combo text */}
              <span
                className="absolute inset-0 rounded-full -mx-2 -my-1"
                style={{ boxShadow: '0 0 16px 4px rgba(245,158,11,0.35)' }}
              />
              <Zap className="w-4 h-4 text-amber-500 relative z-10" />
              <span className="text-sm font-bold text-amber-500 relative z-10">
                {combo}x {t('连击', 'Combo')}
              </span>
            </div>
          )}

        {/* Sequence length display during input */}
        {gameState === 'input' && (
          <p
            className="text-center text-xs text-secondary mb-2"
          >
            {t(`序列长度: ${sequence.length}`, `Sequence: ${sequence.length} colors`)}
          </p>
        )}

        {/* Round progress dots during input */}
        {gameState === 'input' && sequence.length > 0 && (
          <div className="flex justify-center gap-1.5 mb-3">
            {sequence.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${
                  i < playerIndex ? 'bg-green-500' : 'bg-surface-container-high'
                }`}
              />
            ))}
          </div>
        )}

        {/* Color Grid */}
        <div
          className="grid grid-cols-2 gap-4 max-w-[320px] mx-auto mb-6 relative"
        >
          {/* Red flash overlay on wrong */}
          {gameState === 'wrong' && (
              <div
                className="absolute inset-0 bg-red-500/20 rounded-2xl pointer-events-none z-10"
              />
            )}
          {/* Golden flash on level up / speed increase */}
          {levelUpFlash && (
              <div
                className="absolute -inset-1 rounded-3xl pointer-events-none z-10"
                style={{
                  boxShadow:
                    '0 0 20px 4px rgba(234,179,8,0.5), inset 0 0 20px 4px rgba(234,179,8,0.15)',
                }}
              />
            )}
          {COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => handleColorTap(color.id)}
              disabled={gameState !== 'input'}
              className={`rounded-2xl aspect-square min-h-[120px] flex items-center justify-center cursor-pointer disabled:cursor-default ${
                gameState === 'showing' ? 'opacity-50' : ''
              }`}
              style={{
                backgroundColor: activeColor === color.id ? color.active : color.bg,
                boxShadow:
                  activeColor === color.id
                    ? `0 0 30px ${color.bg}80, 0 0 60px ${color.bg}40`
                    : `0 4px 12px ${color.bg}40`,
                transition: 'background-color 0.15s ease, box-shadow 0.15s ease, opacity 0.3s ease',
              }}
            >
              <span className="text-white font-bold text-lg drop-shadow-md">
                {t(...color.name)}
              </span>
            </button>
          ))}
        </div>

        {/* Controls */}
        {(gameState === 'idle' || gameState === 'wrong') && (
            <div
              key="controls"
              className="flex justify-center"
            >
              <button
                onClick={startGame}
                className="px-8 py-3 bg-primary text-on-primary rounded-full font-semibold flex items-center gap-2 min-h-[48px]"
              >
                <RotateCcw className="w-5 h-5" />
                {gameState === 'wrong' ? t('再来一局', 'Play Again') : t('开始游戏', 'Start Game')}
              </button>
            </div>
          )}

        {/* Instructions */}
        <div className="mt-4 text-center text-xs text-secondary/50">
          {t(
            '记住颜色出现的顺序，然后按相同顺序点击',
            'Remember the color sequence, then tap in the same order',
          )}
        </div>
      </div>
    </div>
  );
}
