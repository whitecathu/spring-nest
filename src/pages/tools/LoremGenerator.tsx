import { useState, useCallback } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Copy, Check, RefreshCw } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const LOREM_WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
  'vitae',
  'elementum',
  'curabitur',
  'blandit',
  'tempus',
  'porttitor',
  'auctor',
  'neque',
  'sapien',
  'faucibus',
  'ornare',
  'suspendisse',
  'interdum',
  'varius',
  'natoque',
  'penatibus',
  'magnis',
  'dis',
  'parturient',
  'montes',
  'nascetur',
  'ridiculus',
  'mus',
  'mauris',
  'pellentesque',
  'pulvinar',
  'etiam',
  'risus',
  'feugiat',
  'scelerisque',
  'viverra',
  'nam',
  'libero',
  'justo',
  'laoreet',
  'mattis',
  'aliquam',
  'fringilla',
  'ultrices',
  'posuere',
  'cubilia',
  'curae',
  'donec',
  'velit',
  'pharetra',
  'vel',
  'turpis',
  'nunc',
  'eget',
  'aliquet',
  'nibh',
  'praesent',
  'tristique',
  'senectus',
  'netus',
  'malesuada',
  'fames',
  'ac',
  'congue',
  'quisque',
  'egestas',
  'diam',
  'arcu',
  'pretium',
  'vulputate',
  'sagittis',
  'accumsan',
];

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function generateSentence(minWords: number, maxWords: number): string {
  const len = minWords + Math.floor(Math.random() * (maxWords - minWords + 1));
  const words: string[] = [];
  for (let i = 0; i < len; i++) {
    words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
  }
  words[0] = capitalize(words[0]);
  return words.join(' ') + '.';
}

function generateParagraph(sentencesPerParagraph: number): string {
  const sentences: string[] = [];
  for (let i = 0; i < sentencesPerParagraph; i++) {
    sentences.push(generateSentence(6, 15));
  }
  return sentences.join(' ');
}

function generateLorem(paragraphs: number, sentencesPerParagraph: number): string {
  const result: string[] = [];
  for (let i = 0; i < paragraphs; i++) {
    result.push(generateParagraph(sentencesPerParagraph));
  }
  return result.join('\n\n');
}

export default function LoremGenerator({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [paragraphs, setParagraphs] = useState(3);
  const [sentencesPerParagraph, setSentencesPerParagraph] = useState(5);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [startWithLorem, setStartWithLorem] = useState(true);

  const handleGenerate = useCallback(() => {
    let text = generateLorem(paragraphs, sentencesPerParagraph);
    if (startWithLorem && text.length > 0) {
      // Replace the first sentence with the classic Lorem Ipsum opening
      const firstParagraphEnd = text.indexOf('\n\n');
      const firstParagraph = firstParagraphEnd === -1 ? text : text.substring(0, firstParagraphEnd);
      const rest = firstParagraphEnd === -1 ? '' : text.substring(firstParagraphEnd);
      const firstSentenceEnd = firstParagraph.indexOf('. ');
      const restOfFirst =
        firstSentenceEnd === -1 ? '' : firstParagraph.substring(firstSentenceEnd + 2);
      text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + restOfFirst + rest;
    }
    setOutput(text);
  }, [paragraphs, sentencesPerParagraph, startWithLorem]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  const wordCount = output ? output.split(/\s+/).filter(Boolean).length : 0;
  const charCount = output.length;

  return (
    <div className="flex-grow max-w-2xl mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <div
        className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30"
      >
        <h2 className="text-2xl font-bold text-on-surface text-center mb-2">
          {t('随机文本生成', 'Lorem Ipsum Generator')}
        </h2>
        <p className="text-sm text-secondary text-center mb-6">
          {t(
            '快速生成占位文本，用于设计和排版预览',
            'Generate placeholder text for design and layout preview',
          )}
        </p>

        {/* Settings */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-on-surface mb-2 block">
                {t('段落数', 'Paragraphs')}:{' '}
                <span className="text-primary font-bold">{paragraphs}</span>
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={paragraphs}
                onChange={(e) => setParagraphs(parseInt(e.target.value))}
                className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-secondary/50 mt-1">
                <span>1</span>
                <span>20</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-on-surface mb-2 block">
                {t('每段句数', 'Sentences per paragraph')}:{' '}
                <span className="text-primary font-bold">{sentencesPerParagraph}</span>
              </label>
              <input
                type="range"
                min={1}
                max={15}
                value={sentencesPerParagraph}
                onChange={(e) => setSentencesPerParagraph(parseInt(e.target.value))}
                className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-secondary/50 mt-1">
                <span>1</span>
                <span>15</span>
              </div>
            </div>
          </div>

          <label className="relative flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-1">
            <input
              type="checkbox"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
              className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <span
              aria-hidden="true"
              className="grid h-5 w-5 place-items-center rounded-md border border-surface-variant/50 bg-white peer-checked:border-primary peer-checked:bg-primary after:hidden after:text-xs after:font-bold after:text-white after:content-['✓'] peer-checked:after:block"
            />
            <span className="text-sm text-on-surface">
              {t('以 "Lorem ipsum..." 开头', 'Start with "Lorem ipsum..."')}
            </span>
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          className="w-full py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <RefreshCw className="w-4 h-4" />
          {t('生成文本', 'Generate Text')}
        </button>

        {/* Output */}
        {output && (
          <div>
            {/* Stats bar */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-3">
                <span className="text-xs text-secondary">
                  {t('字数', 'Words')}: <strong className="text-on-surface">{wordCount}</strong>
                </span>
                <span className="text-xs text-secondary">
                  {t('字符', 'Characters')}:{' '}
                  <strong className="text-on-surface">{charCount}</strong>
                </span>
                <span className="text-xs text-secondary">
                  {t('段落', 'Paragraphs')}:{' '}
                  <strong className="text-on-surface">{paragraphs}</strong>
                </span>
              </div>
              <button
                onClick={handleCopy}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  copied
                    ? 'bg-green-100 text-green-600'
                    : 'bg-surface-container-high text-secondary hover:bg-surface-variant'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('已复制!', 'Copied!') : t('复制', 'Copy')}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/30 text-on-surface text-sm leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
              {output}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!output && (
          <div className="text-center py-12 text-secondary/50">
            <p className="text-lg">
              {t('点击上方按钮生成随机文本', 'Click the button above to generate random text')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
