import { useEffect, useMemo, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Pause, Play, RotateCcw, Square, Volume2 } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { toolPageEnter } from '../../lib/animations';

const sampleText = '春日小筑会在本地调用浏览器语音引擎朗读这段文字。';

function speechSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  );
}

export default function TextToSpeech({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [text, setText] = useState(sampleText);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [status, setStatus] = useState<'idle' | 'speaking' | 'paused'>('idle');
  const supported = speechSupported();

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => {
      const nextVoices = window.speechSynthesis.getVoices();
      setVoices(nextVoices);
      setVoiceURI((current) => current || nextVoices[0]?.voiceURI || '');
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [supported]);

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.voiceURI === voiceURI) ?? voices[0],
    [voiceURI, voices],
  );

  const speak = () => {
    const content = text.trim();
    if (!supported || !content) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onend = () => setStatus('idle');
    utterance.onerror = () => setStatus('idle');
    window.speechSynthesis.speak(utterance);
    setStatus('speaking');
  };

  const pauseOrResume = () => {
    if (!supported) return;
    if (status === 'speaking') {
      window.speechSynthesis.pause();
      setStatus('paused');
      return;
    }
    window.speechSynthesis.resume();
    setStatus('speaking');
  };

  const stop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setStatus('idle');
  };

  return (
    <div className="flex-grow mx-auto w-full max-w-3xl px-4 py-8">
      <button
        onClick={onBack}
        className="mb-4 flex min-h-[48px] items-center gap-2 px-2 -ml-2 text-sm font-semibold text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-5 w-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <div {...toolPageEnter} className="space-y-5">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black text-on-surface">
            <Volume2 className="h-8 w-8 text-primary" />
            {t('文字朗读', 'Text to Speech')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            {t(
              '输入文字，使用浏览器本地语音引擎朗读，可调节声音、语速和音调。',
              'Enter text and read it aloud with the browser speech engine.',
            )}
          </p>
        </div>

        {!supported && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-700">
            {t(
              '当前浏览器不支持语音合成，请使用最新版 Chrome、Edge 或 Safari。',
              'This browser does not support speech synthesis. Try the latest Chrome, Edge, or Safari.',
            )}
          </div>
        )}

        <section className="grid gap-5 rounded-3xl border border-surface-variant/30 bg-white/85 p-5 shadow-lg dark:bg-surface-container-high/80 lg:grid-cols-[1.25fr_0.75fr]">
          <label className="grid gap-2 text-sm font-bold text-on-surface">
            {t('朗读内容', 'Text')}
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={11}
              className="min-h-[240px] resize-y rounded-2xl border border-surface-variant/40 bg-surface-container-low p-4 text-base leading-7 text-on-surface outline-none focus:border-primary"
              placeholder={t('输入要朗读的文字', 'Enter text to read aloud')}
            />
          </label>

          <div className="space-y-4">
            <label className="grid gap-2 text-sm font-bold text-on-surface">
              {t('声音', 'Voice')}
              <select
                value={voiceURI}
                onChange={(event) => setVoiceURI(event.target.value)}
                disabled={!voices.length}
                className="min-h-[48px] rounded-xl border border-surface-variant/40 bg-surface-container-low px-3 text-on-surface outline-none focus:border-primary"
              >
                {voices.length ? (
                  voices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))
                ) : (
                  <option>{t('使用默认声音', 'Default voice')}</option>
                )}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold text-on-surface">
              {t(`语速 ${rate.toFixed(1)}x`, `Rate ${rate.toFixed(1)}x`)}
              <input
                type="range"
                min="0.6"
                max="1.8"
                step="0.1"
                value={rate}
                onChange={(event) => setRate(Number(event.target.value))}
                className="accent-primary"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-on-surface">
              {t(`音调 ${pitch.toFixed(1)}`, `Pitch ${pitch.toFixed(1)}`)}
              <input
                type="range"
                min="0.6"
                max="1.6"
                step="0.1"
                value={pitch}
                onChange={(event) => setPitch(Number(event.target.value))}
                className="accent-primary"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={speak}
                disabled={!supported || !text.trim()}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary shadow-md transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {t('开始朗读', 'Speak')}
              </button>
              <button
                type="button"
                onClick={pauseOrResume}
                disabled={!supported || status === 'idle'}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pause className="h-4 w-4" />
                {status === 'paused' ? t('继续', 'Resume') : t('暂停', 'Pause')}
              </button>
              <button
                type="button"
                onClick={stop}
                disabled={!supported || status === 'idle'}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Square className="h-4 w-4" />
                {t('停止', 'Stop')}
              </button>
              <button
                type="button"
                onClick={() => setText(sampleText)}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant"
              >
                <RotateCcw className="h-4 w-4" />
                {t('示例文本', 'Sample')}
              </button>
            </div>

            <p className="rounded-2xl bg-primary-container/25 p-3 text-xs leading-6 text-on-primary-container">
              {t(
                '语音由浏览器提供，不上传文字。不同系统可用声音会有所不同。',
                'Speech is provided by your browser. Text is not uploaded. Available voices vary by system.',
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
