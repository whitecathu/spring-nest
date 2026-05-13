import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

type UnitCategory = 'length' | 'weight' | 'temperature' | 'area';

const unitDefs: Record<UnitCategory, { name: string; nameEn: string; units: { id: string; label: string; labelEn: string; toBase: (v: number) => number; fromBase: (v: number) => number }[] }> = {
  length: {
    name: '长度', nameEn: 'Length',
    units: [
      { id: 'm', label: '米 (m)', labelEn: 'Meter (m)', toBase: v => v, fromBase: v => v },
      { id: 'km', label: '千米 (km)', labelEn: 'Kilometer (km)', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { id: 'cm', label: '厘米 (cm)', labelEn: 'Centimeter (cm)', toBase: v => v / 100, fromBase: v => v * 100 },
      { id: 'mm', label: '毫米 (mm)', labelEn: 'Millimeter (mm)', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { id: 'ft', label: '英尺 (ft)', labelEn: 'Foot (ft)', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
      { id: 'in', label: '英寸 (in)', labelEn: 'Inch (in)', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
    ],
  },
  weight: {
    name: '重量', nameEn: 'Weight',
    units: [
      { id: 'kg', label: '千克 (kg)', labelEn: 'Kilogram (kg)', toBase: v => v, fromBase: v => v },
      { id: 'g', label: '克 (g)', labelEn: 'Gram (g)', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { id: 'lb', label: '磅 (lb)', labelEn: 'Pound (lb)', toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
      { id: 'oz', label: '盎司 (oz)', labelEn: 'Ounce (oz)', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 },
    ],
  },
  temperature: {
    name: '温度', nameEn: 'Temperature',
    units: [
      { id: 'c', label: '摄氏度 (°C)', labelEn: 'Celsius (°C)', toBase: v => v, fromBase: v => v },
      { id: 'f', label: '华氏度 (°F)', labelEn: 'Fahrenheit (°F)', toBase: v => (v - 32) * 5 / 9, fromBase: v => v * 9 / 5 + 32 },
      { id: 'k', label: '开尔文 (K)', labelEn: 'Kelvin (K)', toBase: v => v - 273.15, fromBase: v => v + 273.15 },
    ],
  },
  area: {
    name: '面积', nameEn: 'Area',
    units: [
      { id: 'm2', label: '平方米 (m²)', labelEn: 'Square meter (m²)', toBase: v => v, fromBase: v => v },
      { id: 'km2', label: '平方千米 (km²)', labelEn: 'Square km (km²)', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
      { id: 'ha', label: '公顷 (ha)', labelEn: 'Hectare (ha)', toBase: v => v * 10000, fromBase: v => v / 10000 },
      { id: 'ft2', label: '平方英尺 (ft²)', labelEn: 'Square foot (ft²)', toBase: v => v * 0.092903, fromBase: v => v / 0.092903 },
    ],
  },
};

export default function UnitConverter({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [category, setCategory] = useState<UnitCategory>('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('ft');
  const [inputValue, setInputValue] = useState('1');

  const currentDef = unitDefs[category];

  const result = useMemo(() => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return '';
    const from = currentDef.units.find(u => u.id === fromUnit);
    const to = currentDef.units.find(u => u.id === toUnit);
    if (!from || !to) return '';
    const baseValue = from.toBase(val);
    const converted = to.fromBase(baseValue);
    return parseFloat(converted.toFixed(10)).toString();
  }, [inputValue, fromUnit, toUnit, currentDef]);

  const handleCategoryChange = (cat: UnitCategory) => {
    setCategory(cat);
    const def = unitDefs[cat];
    setFromUnit(def.units[0].id);
    setToUnit(def.units[1].id);
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm">
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30">
        <h2 className="text-2xl font-bold text-on-surface text-center mb-6">{t('单位换算', 'Unit Converter')}</h2>

        {/* Category Selector */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {(Object.keys(unitDefs) as UnitCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                category === cat ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-secondary hover:bg-surface-variant'
              }`}
            >
              {t(unitDefs[cat].name, unitDefs[cat].nameEn)}
            </button>
          ))}
        </div>

        {/* From */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-secondary mb-2">{t('输入', 'From')}</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-surface-container-low border border-surface-variant/30 rounded-xl py-3 px-4 text-on-surface text-lg outline-none focus:border-primary/50"
              placeholder="0"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="bg-surface-container-low border border-surface-variant/30 rounded-xl px-3 py-3 text-on-surface outline-none focus:border-primary/50 font-medium text-sm min-w-[120px]"
            >
              {currentDef.units.map(u => (
                <option key={u.id} value={u.id}>{t(u.label, u.labelEn)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap */}
        <div className="flex justify-center my-4">
          <button
            onClick={swapUnits}
            aria-label={t('交换换算单位', 'Swap conversion units')}
            className="p-3 bg-surface-container-high rounded-full hover:bg-surface-variant transition-colors text-secondary hover:text-primary"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>
        </div>

        {/* To */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">{t('结果', 'To')}</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-primary-container/20 border border-primary/10 rounded-xl py-3 px-4 text-on-surface text-lg font-bold flex items-center">
              {result || '—'}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="bg-surface-container-low border border-surface-variant/30 rounded-xl px-3 py-3 text-on-surface outline-none focus:border-primary/50 font-medium text-sm min-w-[120px]"
            >
              {currentDef.units.map(u => (
                <option key={u.id} value={u.id}>{t(u.label, u.labelEn)}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
