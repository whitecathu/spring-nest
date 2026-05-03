import { describe, it, expect } from 'vitest';

// Inline unit converter logic for testing
type UnitCategory = 'length' | 'weight' | 'temperature' | 'area';

const unitDefs: Record<UnitCategory, { units: { id: string; toBase: (v: number) => number; fromBase: (v: number) => number }[] }> = {
  length: {
    units: [
      { id: 'm', toBase: v => v, fromBase: v => v },
      { id: 'km', toBase: v => v * 1000, fromBase: v => v / 1000 },
      { id: 'cm', toBase: v => v / 100, fromBase: v => v * 100 },
      { id: 'mm', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { id: 'ft', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
      { id: 'in', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
    ],
  },
  weight: {
    units: [
      { id: 'kg', toBase: v => v, fromBase: v => v },
      { id: 'g', toBase: v => v / 1000, fromBase: v => v * 1000 },
      { id: 'lb', toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
      { id: 'oz', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 },
    ],
  },
  temperature: {
    units: [
      { id: 'c', toBase: v => v, fromBase: v => v },
      { id: 'f', toBase: v => (v - 32) * 5 / 9, fromBase: v => v * 9 / 5 + 32 },
      { id: 'k', toBase: v => v - 273.15, fromBase: v => v + 273.15 },
    ],
  },
  area: {
    units: [
      { id: 'm2', toBase: v => v, fromBase: v => v },
      { id: 'km2', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
      { id: 'ha', toBase: v => v * 10000, fromBase: v => v / 10000 },
      { id: 'ft2', toBase: v => v * 0.092903, fromBase: v => v / 0.092903 },
    ],
  },
};

function convert(category: UnitCategory, fromUnit: string, toUnit: string, value: number | string): string {
  const def = unitDefs[category];
  const from = def.units.find(u => u.id === fromUnit);
  const to = def.units.find(u => u.id === toUnit);
  if (!from || !to) return '';
  const val = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(val)) return '';
  const baseValue = from.toBase(val);
  const converted = to.fromBase(baseValue);
  return parseFloat(converted.toFixed(10)).toString();
}

describe('Unit Converter', () => {
  describe('length', () => {
    it('should convert meters to centimeters', () => {
      expect(convert('length', 'm', 'cm', '1')).toBe('100');
    });

    it('should convert kilometers to meters', () => {
      expect(convert('length', 'km', 'm', '1')).toBe('1000');
    });

    it('should convert feet to meters', () => {
      const result = parseFloat(convert('length', 'ft', 'm', '1'));
      expect(result).toBeCloseTo(0.3048, 4);
    });

    it('should convert inches to centimeters', () => {
      const result = parseFloat(convert('length', 'in', 'cm', '1'));
      expect(result).toBeCloseTo(2.54, 2);
    });

    it('should handle same unit conversion', () => {
      expect(convert('length', 'm', 'm', '5')).toBe('5');
    });

    it('should convert mm to m', () => {
      expect(convert('length', 'mm', 'm', '1000')).toBe('1');
    });
  });

  describe('weight', () => {
    it('should convert kg to g', () => {
      expect(convert('weight', 'kg', 'g', '1')).toBe('1000');
    });

    it('should convert pounds to kg', () => {
      const result = parseFloat(convert('weight', 'lb', 'kg', '1'));
      expect(result).toBeCloseTo(0.453592, 4);
    });

    it('should convert ounces to grams', () => {
      const result = parseFloat(convert('weight', 'oz', 'g', '1'));
      expect(result).toBeCloseTo(28.3495, 2);
    });
  });

  describe('temperature', () => {
    it('should convert Celsius to Fahrenheit (0°C = 32°F)', () => {
      expect(convert('temperature', 'c', 'f', '0')).toBe('32');
    });

    it('should convert Celsius to Fahrenheit (100°C = 212°F)', () => {
      expect(convert('temperature', 'c', 'f', '100')).toBe('212');
    });

    it('should convert Fahrenheit to Celsius (32°F = 0°C)', () => {
      expect(convert('temperature', 'f', 'c', '32')).toBe('0');
    });

    it('should convert Celsius to Kelvin (0°C = 273.15K)', () => {
      expect(convert('temperature', 'c', 'k', '0')).toBe('273.15');
    });

    it('should convert Kelvin to Celsius', () => {
      expect(convert('temperature', 'k', 'c', '273.15')).toBe('0');
    });
  });

  describe('area', () => {
    it('should convert square meters to hectares', () => {
      expect(convert('area', 'm2', 'ha', '10000')).toBe('1');
    });

    it('should convert square km to square meters', () => {
      expect(convert('area', 'km2', 'm2', '1')).toBe('1000000');
    });

    it('should convert square feet to square meters', () => {
      const result = parseFloat(convert('area', 'ft2', 'm2', '1'));
      expect(result).toBeCloseTo(0.092903, 4);
    });
  });
});
