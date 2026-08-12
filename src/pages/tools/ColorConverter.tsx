import { useState, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

// --- Conversion helpers ---

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

const PRESETS = [
  { name: '新绿', nameEn: 'Fresh Green', hex: '#3f6751' },
  { name: '樱花粉', nameEn: 'Cherry Blossom', hex: '#FFB7C5' },
  { name: '天空蓝', nameEn: 'Sky Blue', hex: '#87CEEB' },
  { name: '暖白', nameEn: 'Warm White', hex: '#FFF9F2' },
  { name: '薄荷绿', nameEn: 'Mint', hex: '#E8F5EE' },
  { name: '阳光金', nameEn: 'Sunshine', hex: '#FFD700' },
  { name: '薰衣草', nameEn: 'Lavender', hex: '#E6E6FA' },
  { name: '珊瑚橘', nameEn: 'Coral', hex: '#FF7F50' },
];

export default function ColorConverter({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [hex, setHex] = useState('#3f6751');
  const [r, setR] = useState(63);
  const [g, setG] = useState(103);
  const [b, setB] = useState(81);
  const [h, setH] = useState(147);
  const [s, setS] = useState(24);
  const [l, setL] = useState(33);
  const [hexInput, setHexInput] = useState('#3f6751');
  const [copied, setCopied] = useState<string | null>(null);

  // Sync all from RGB
  const syncFromRgb = useCallback((nr: number, ng: number, nb: number) => {
    setR(nr);
    setG(ng);
    setB(nb);
    const newHex = rgbToHex(nr, ng, nb);
    setHex(newHex);
    setHexInput(newHex);
    const hsl = rgbToHsl(nr, ng, nb);
    setH(hsl.h);
    setS(hsl.s);
    setL(hsl.l);
  }, []);

  // Sync all from HSL
  const syncFromHsl = useCallback((nh: number, ns: number, nl: number) => {
    setH(nh);
    setS(ns);
    setL(nl);
    const rgb = hslToRgb(nh, ns, nl);
    setR(rgb.r);
    setG(rgb.g);
    setB(rgb.b);
    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setHex(newHex);
    setHexInput(newHex);
  }, []);

  // Sync all from HEX
  const syncFromHex = useCallback((newHex: string) => {
    setHex(newHex);
    setHexInput(newHex);
    const rgb = hexToRgb(newHex);
    if (!rgb) return;
    setR(rgb.r);
    setG(rgb.g);
    setB(rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    setH(hsl.h);
    setS(hsl.s);
    setL(hsl.l);
  }, []);

  // Initialize on mount
  useEffect(() => {
    syncFromRgb(63, 103, 81);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleHexChange = (val: string) => {
    setHexInput(val);
    const cleaned = val.startsWith('#') ? val : '#' + val;
    if (/^#[a-fA-F0-9]{6}$/.test(cleaned)) {
      syncFromHex(cleaned);
    }
  };

  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

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
          {t('颜色转换器', 'Color Converter')}
        </h2>

        {/* Color Preview + Picker */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-24 h-24 rounded-2xl border-2 border-surface-variant/30 shadow-inner shrink-0"
            style={{ backgroundColor: hex }}
          />
          <div className="flex-1">
            <label className="block text-xs font-medium text-secondary mb-1">
              {t('颜色拾取器', 'Color Picker')}
            </label>
            <input
              type="color"
              aria-label={t('颜色拾取器', 'Color picker')}
              value={hex}
              onChange={(e) => syncFromHex(e.target.value)}
              className="w-full h-12 rounded-xl cursor-pointer border-0 bg-transparent"
            />
          </div>
        </div>

        {/* HEX Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-secondary mb-2">HEX</label>
          <div className="flex gap-2">
            <input
              type="text"
              aria-label="HEX"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              className="flex-1 bg-surface-container-low border border-surface-variant/30 rounded-xl py-3 px-4 text-on-surface font-mono text-sm outline-none focus:border-primary/50"
              placeholder="#000000"
              maxLength={7}
            />
            <button
              onClick={() => handleCopy(hex, 'hex')}
              className="px-4 rounded-xl bg-surface-container-high text-secondary hover:text-primary transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              {copied === 'hex' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied === 'hex' ? t('已复制', 'Copied') : t('复制', 'Copy')}
            </button>
          </div>
        </div>

        {/* RGB Sliders */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-secondary">RGB</label>
            <button
              onClick={() => handleCopy(`rgb(${r}, ${g}, ${b})`, 'rgb')}
              className="px-3 py-1 rounded-lg bg-surface-container-high text-secondary hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              {copied === 'rgb' ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="font-mono">{`rgb(${r}, ${g}, ${b})`}</span>
            </button>
          </div>
          <div className="space-y-3">
            {[
              {
                label: 'R',
                value: r,
                color: 'bg-red-500',
                onChange: (v: number) => syncFromRgb(v, g, b),
              },
              {
                label: 'G',
                value: g,
                color: 'bg-green-500',
                onChange: (v: number) => syncFromRgb(r, v, b),
              },
              {
                label: 'B',
                value: b,
                color: 'bg-blue-500',
                onChange: (v: number) => syncFromRgb(r, g, v),
              },
            ].map(({ label, value, color, onChange }) => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold`}
                >
                  {label}
                </span>
                <input
                  type="range"
                  aria-label={label}
                  min={0}
                  max={255}
                  value={value}
                  onChange={(e) => onChange(Number(e.target.value))}
                  className="flex-1 h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
                />
                <span className="w-10 text-right text-sm font-mono text-on-surface">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* HSL Sliders */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-secondary">HSL</label>
            <button
              onClick={() => handleCopy(`hsl(${h}, ${s}%, ${l}%)`, 'hsl')}
              className="px-3 py-1 rounded-lg bg-surface-container-high text-secondary hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              {copied === 'hsl' ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="font-mono">{`hsl(${h}, ${s}%, ${l}%)`}</span>
            </button>
          </div>
          <div className="space-y-3">
            {[
              {
                label: 'H',
                value: h,
                max: 360,
                suffix: '°',
                color: 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500',
                onChange: (v: number) => syncFromHsl(v, s, l),
              },
              {
                label: 'S',
                value: s,
                max: 100,
                suffix: '%',
                color: 'bg-primary',
                onChange: (v: number) => syncFromHsl(h, v, l),
              },
              {
                label: 'L',
                value: l,
                max: 100,
                suffix: '%',
                color: 'bg-primary',
                onChange: (v: number) => syncFromHsl(h, s, v),
              },
            ].map(({ label, value, max, suffix, color, onChange }) => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold`}
                >
                  {label}
                </span>
                <input
                  type="range"
                  aria-label={label}
                  min={0}
                  max={max}
                  value={value}
                  onChange={(e) => onChange(Number(e.target.value))}
                  className="flex-1 h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
                />
                <span className="w-12 text-right text-sm font-mono text-on-surface">
                  {value}
                  {suffix}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Preset Colors */}
        <div>
          <h3 className="text-sm font-bold text-secondary mb-3">
            {t('春日色板', 'Spring Palette')}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.hex}
                onClick={() => syncFromHex(preset.hex)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className="w-full aspect-square rounded-xl border-2 border-surface-variant/20 group-hover:border-primary/50 transition-colors shadow-sm"
                  style={{ backgroundColor: preset.hex }}
                />
                <span className="text-xs text-secondary group-hover:text-primary transition-colors leading-tight text-center">
                  {t(preset.name, preset.nameEn)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
