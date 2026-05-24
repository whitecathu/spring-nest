import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import type { BackgroundProfile } from '../../lib/backgroundProfiles';
import { softEase } from '../../lib/animations';

type Palette = BackgroundProfile['light'];

type BackgroundSceneProps = {
  profile: BackgroundProfile;
  palette: Palette;
  compact: boolean;
};

function seededNumber(seed: string) {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index)) % 9973;
  }
  return value;
}

function makeParticles(profile: BackgroundProfile, compact: boolean) {
  const count = Math.min(profile.particles, compact ? 12 : 30);
  const seed = seededNumber(profile.key);
  return Array.from({ length: count }, (_, index) => {
    const spread = (seed + index * 47) % 100;
    return {
      x: (spread + index * 19) % 100,
      y: (seed + index * 29) % 100,
      size: 2 + ((seed + index) % 4),
      delay: (index % 8) * 0.24,
      travel: 14 + ((seed + index * 5) % 18),
      drift: -10 + ((seed + index * 11) % 20),
    };
  });
}

function makeLeaves(profile: BackgroundProfile, compact: boolean) {
  const count = Math.min(profile.leaves, compact ? 4 : 10);
  const seed = seededNumber(`${profile.key}-leaves`);
  return Array.from({ length: count }, (_, index) => ({
    x: (seed + index * 17) % 100,
    delay: (index % 7) * 0.7,
    duration: 16 + ((seed + index * 3) % 9),
    size: 10 + ((seed + index) % 7),
    drift: -24 + ((seed + index * 13) % 48),
  }));
}

function makeLines(profile: BackgroundProfile) {
  const seed = seededNumber(`${profile.key}-lines`);
  return Array.from({ length: profile.lineCount }, (_, index) => {
    const y = 16 + ((seed + index * 13) % 68);
    const bend = 10 + ((seed + index * 17) % 26);
    const lift = index % 2 === 0 ? -bend : bend;
    return `M -8 ${y} C 22 ${y + lift}, 42 ${y - lift}, 108 ${y + lift * 0.35}`;
  });
}

function AbstractSymbol({ value, color, size }: { value: string; color: string; size: number }) {
  const variant = seededNumber(value) % 6;
  const baseSize = Math.max(14, size);

  if (variant === 0) {
    return (
      <span
        className="block"
        style={{
          width: baseSize * 0.74,
          height: baseSize,
          borderRadius: '72% 10% 72% 12%',
          background: color,
          opacity: 0.7,
          transform: 'rotate(-18deg)',
        }}
      />
    );
  }

  if (variant === 1) {
    return (
      <span
        className="block rounded-full border"
        style={{
          width: baseSize,
          height: baseSize,
          borderColor: color,
        }}
      />
    );
  }

  if (variant === 2) {
    return (
      <span
        className="relative block rounded-sm border"
        style={{
          width: baseSize * 0.76,
          height: baseSize,
          borderColor: color,
        }}
      >
        <span
          className="absolute left-[18%] right-[18%] top-[32%] h-px"
          style={{ background: color }}
          aria-hidden="true"
        />
        <span
          className="absolute left-[18%] right-[34%] top-[56%] h-px"
          style={{ background: color }}
          aria-hidden="true"
        />
      </span>
    );
  }

  if (variant === 3) {
    return (
      <span
        className="relative block"
        style={{
          width: baseSize,
          height: baseSize,
        }}
      >
        <span
          className="absolute left-1/2 top-0 h-full w-px origin-center"
          style={{ background: color, transform: 'rotate(42deg)' }}
          aria-hidden="true"
        />
        <span
          className="absolute left-0 top-1/2 h-px w-full origin-center"
          style={{ background: color, transform: 'rotate(42deg)' }}
          aria-hidden="true"
        />
      </span>
    );
  }

  if (variant === 4) {
    return (
      <span
        className="grid"
        style={{
          width: baseSize,
          height: baseSize,
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: baseSize * 0.18,
        }}
      >
        {[0, 1, 2, 3].map((dot) => (
          <span
            key={dot}
            className="rounded-full"
            style={{ background: color }}
            aria-hidden="true"
          />
        ))}
      </span>
    );
  }

  return (
    <span
      className="relative block rounded-sm border"
      style={{
        width: baseSize,
        height: baseSize,
        border: `1px solid ${color}`,
      }}
    >
      <span
        className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ border: `1px solid ${color}` }}
        aria-hidden="true"
      />
    </span>
  );
}

function PatternLayer({ profile, palette }: { profile: BackgroundProfile; palette: Palette }) {
  if (!['grid', 'tech', 'json-scan', 'qr-dots', 'mines-grid'].includes(profile.animation)) {
    return null;
  }

  const gridSize = profile.animation === 'grid' ? 52 : 38;
  const dotSize = profile.animation === 'tech' ? 22 : 28;

  return (
    <motion.div
      className="absolute -inset-[12%] opacity-60"
      style={{
        backgroundImage:
          profile.key === 'qr-dots'
            ? `radial-gradient(circle, ${palette.line} 1px, transparent 1.6px)`
            : `linear-gradient(${palette.line} 1px, transparent 1px), linear-gradient(90deg, ${palette.line} 1px, transparent 1px), radial-gradient(circle, ${palette.line} 1px, transparent 1.5px)`,
        backgroundSize:
          profile.key === 'qr-dots'
            ? `${dotSize}px ${dotSize}px`
            : `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, ${dotSize}px ${dotSize}px`,
        maskImage: 'radial-gradient(circle at 50% 35%, black, transparent 72%)',
        willChange: 'transform, opacity',
      }}
      animate={{ x: [0, -18, 0], y: [0, 12, 0], opacity: [0.28, 0.54, 0.28] }}
      transition={{ duration: 18, repeat: Infinity, ease: softEase }}
      aria-hidden="true"
    />
  );
}

function RingLayer({ profile, palette }: { profile: BackgroundProfile; palette: Palette }) {
  if (profile.animation !== 'clock') return null;

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="absolute left-1/2 top-[34%] rounded-full border"
          style={{
            width: 190 + index * 82,
            height: 190 + index * 82,
            marginLeft: -(190 + index * 82) / 2,
            marginTop: -(190 + index * 82) / 2,
            borderColor: palette.line,
            willChange: 'transform, opacity',
          }}
          animate={{ scale: [0.94, 1.06, 0.94], opacity: [0.08, 0.26, 0.08] }}
          transition={{
            duration: 8 + index * 2,
            repeat: Infinity,
            delay: index * 0.6,
            ease: softEase,
          }}
        />
      ))}
    </div>
  );
}

function DocumentLayer({ profile, palette }: { profile: BackgroundProfile; palette: Palette }) {
  if (profile.animation !== 'document' && profile.animation !== 'cards') return null;

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <motion.span
          key={index}
          className="absolute rounded-md border"
          style={{
            width: profile.animation === 'cards' ? 44 : 58,
            height: profile.animation === 'cards' ? 62 : 76,
            left: `${18 + index * 18}%`,
            top: `${18 + ((index * 19) % 52)}%`,
            borderColor: palette.line,
            background: palette.halo[index % palette.halo.length],
            willChange: 'transform, opacity',
          }}
          animate={{
            y: [0, -12 - index * 2, 0],
            rotate: [index * 5 - 8, index * 5 + 4, index * 5 - 8],
            opacity: [0.08, 0.2, 0.08],
          }}
          transition={{
            duration: 12 + index * 1.2,
            repeat: Infinity,
            delay: index * 0.5,
            ease: softEase,
          }}
        />
      ))}
    </div>
  );
}

function BubbleLayer({ profile, palette }: { profile: BackgroundProfile; palette: Palette }) {
  if (profile.animation !== 'bubble') return null;

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <motion.span
          key={index}
          className="absolute rounded-full border"
          style={{
            width: 18 + (index % 4) * 10,
            height: 18 + (index % 4) * 10,
            left: `${12 + index * 11}%`,
            bottom: '-8%',
            borderColor: palette.particle,
            background: palette.halo[index % palette.halo.length],
            willChange: 'transform, opacity',
          }}
          animate={{
            y: ['0vh', '-108vh'],
            x: [0, index % 2 ? 22 : -22, 0],
            opacity: [0, 0.28, 0],
            scale: [0.7, 1, 0.9],
          }}
          transition={{
            duration: 15 + index,
            repeat: Infinity,
            delay: index * 0.8,
            ease: softEase,
          }}
        />
      ))}
    </div>
  );
}

function FlowLines({ profile, palette }: { profile: BackgroundProfile; palette: Palette }) {
  const lines = useMemo(() => makeLines(profile), [profile]);
  const strokeDasharray =
    profile.animation === 'path' || profile.animation === 'nature' ? '8 16' : '2 14';

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {lines.map((path, index) => (
        <motion.path
          key={`${path}-${index}`}
          d={path}
          fill="none"
          stroke={palette.line}
          strokeWidth={profile.animation === 'tech' || profile.animation === 'grid' ? 0.16 : 0.22}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ pathLength: 0.35, opacity: 0.08 }}
          animate={{ pathLength: [0.35, 1, 0.35], opacity: [0.08, 0.26, 0.08] }}
          transition={{
            duration: 12 + index * 1.3,
            repeat: Infinity,
            delay: index * 0.5,
            ease: softEase,
          }}
        />
      ))}
    </svg>
  );
}

function ParticleLayer({
  profile,
  palette,
  compact,
}: {
  profile: BackgroundProfile;
  palette: Palette;
  compact: boolean;
}) {
  const particles = useMemo(() => makeParticles(profile, compact), [compact, profile]);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {particles.map((particle, index) => (
        <motion.span
          key={`${profile.key}-${index}`}
          className="absolute rounded-full"
          style={{
            width: profile.animation === 'bubble' ? particle.size + 5 : particle.size,
            height: profile.animation === 'bubble' ? particle.size + 5 : particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            border: profile.animation === 'bubble' ? `1px solid ${palette.particle}` : undefined,
            background: profile.animation === 'bubble' ? 'transparent' : palette.particle,
            willChange: 'transform, opacity',
          }}
          animate={{
            x: [0, particle.drift, 0],
            y:
              profile.animation === 'playful'
                ? [0, -particle.travel, particle.travel * 0.4, 0]
                : [0, -particle.travel, 0],
            opacity: [0, 0.55, 0],
            scale: [0.72, 1, 0.72],
          }}
          transition={{
            duration: profile.intensity === 'lively' ? 7 : 11,
            repeat: Infinity,
            delay: particle.delay,
            ease: softEase,
          }}
        />
      ))}
    </div>
  );
}

function LeafLayer({
  profile,
  palette,
  compact,
}: {
  profile: BackgroundProfile;
  palette: Palette;
  compact: boolean;
}) {
  const leaves = useMemo(() => makeLeaves(profile, compact), [compact, profile]);
  if (leaves.length === 0) return null;

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {leaves.map((leaf, index) => (
        <motion.span
          key={`${profile.key}-leaf-${index}`}
          className="absolute"
          style={{
            left: `${leaf.x}%`,
            top: '-12%',
            width: leaf.size,
            height: leaf.size * 1.55,
            borderRadius: '72% 8% 72% 12%',
            background: palette.particle,
            opacity: 0.22,
            transformOrigin: '50% 80%',
            willChange: 'transform, opacity',
          }}
          animate={{
            y: ['0vh', '118vh'],
            x: [0, leaf.drift, -leaf.drift * 0.45],
            rotate: [0, 120, 260],
            opacity: [0, 0.28, 0],
          }}
          transition={{
            duration: leaf.duration,
            repeat: Infinity,
            delay: leaf.delay,
            ease: softEase,
          }}
        />
      ))}
    </div>
  );
}

function SymbolLayer({ profile, palette }: { profile: BackgroundProfile; palette: Palette }) {
  if (profile.symbols.length === 0) return null;

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {profile.symbols.map((symbol, index) => (
        <motion.span
          key={`${symbol.value}-${index}`}
          className="absolute select-none"
          style={{
            left: `${symbol.x}%`,
            top: `${symbol.y}%`,
            opacity: symbol.opacity ?? 0.12,
            willChange: 'transform, opacity',
          }}
          animate={{
            y: [0, -symbol.drift, 0],
            x: [0, symbol.drift * 0.28, 0],
            rotate: [-2, 2, -2],
            opacity: [symbol.opacity ?? 0.1, (symbol.opacity ?? 0.1) + 0.06, symbol.opacity ?? 0.1],
          }}
          transition={{
            duration: 12 + index,
            repeat: Infinity,
            delay: symbol.delay,
            ease: softEase,
          }}
        >
          <AbstractSymbol value={symbol.value} color={palette.symbol} size={symbol.size} />
        </motion.span>
      ))}
    </div>
  );
}

function BackgroundScene({ profile, palette, compact }: BackgroundSceneProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <PatternLayer profile={profile} palette={palette} />
      <RingLayer profile={profile} palette={palette} />
      <DocumentLayer profile={profile} palette={palette} />
      <BubbleLayer profile={profile} palette={palette} />
      <FlowLines profile={profile} palette={palette} />
      <ParticleLayer profile={profile} palette={palette} compact={compact} />
      <LeafLayer profile={profile} palette={palette} compact={compact} />
      <SymbolLayer profile={profile} palette={palette} />
    </div>
  );
}

export default memo(BackgroundScene);
