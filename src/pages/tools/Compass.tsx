import { useState, useEffect, useRef, useCallback, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Compass as CompassIcon, Smartphone } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const CARDINAL_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

function getCardinalDirection(deg: number): string {
  const idx = Math.round(deg / 45) % 8;
  return CARDINAL_DIRECTIONS[idx];
}

function getDirectionLabel(dir: string, t: (zh: string, en: string) => string): string {
  const labels: Record<string, [string, string]> = {
    N: ['北', 'North'],
    NE: ['东北', 'Northeast'],
    E: ['东', 'East'],
    SE: ['东南', 'Southeast'],
    S: ['南', 'South'],
    SW: ['西南', 'Southwest'],
    W: ['西', 'West'],
    NW: ['西北', 'Northwest'],
  };
  const pair = labels[dir];
  return pair ? t(pair[0], pair[1]) : dir;
}

export default function Compass({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [heading, setHeading] = useState(0);
  const [hasOrientation, setHasOrientation] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartAngle = useRef(0);
  const headingAtDragStart = useRef(0);

  // Device orientation (mobile)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading is iOS-specific and gives magnetic north
      const h = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      if (h !== undefined && h !== null) {
        setHeading(h);
        setHasOrientation(true);
      } else if (e.alpha !== null) {
        // alpha is the compass heading on Android (0-360, but relative to device)
        setHeading(360 - e.alpha);
        setHasOrientation(true);
      }
    };

    const requestPermission = async () => {
      // iOS 13+ requires explicit permission
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        'requestPermission' in DeviceOrientationEvent
      ) {
        try {
          const permission = await (
            DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
          ).requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          } else {
            setPermissionDenied(true);
          }
        } catch {
          setPermissionDenied(true);
        }
      } else if (typeof DeviceOrientationEvent !== 'undefined') {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Mouse/touch drag for desktop fallback
  const getAngleFromEvent = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }, []);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (hasOrientation) return;
      setIsDragging(true);
      dragStartAngle.current = getAngleFromEvent(e.clientX, e.clientY);
      headingAtDragStart.current = heading;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [hasOrientation, heading, getAngleFromEvent]
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!isDragging || hasOrientation) return;
      const currentAngle = getAngleFromEvent(e.clientX, e.clientY);
      let delta = currentAngle - dragStartAngle.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      const newHeading = (headingAtDragStart.current - delta + 360) % 360;
      setHeading(newHeading);
    },
    [isDragging, hasOrientation, getAngleFromEvent]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const requestOrientationPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      'requestPermission' in DeviceOrientationEvent
    ) {
      try {
        const permission = await (
          DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission();
        if (permission === 'granted') {
          setPermissionDenied(false);
          window.addEventListener('deviceorientation', (e: DeviceOrientationEvent) => {
            const h = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
              .webkitCompassHeading;
            if (h !== undefined && h !== null) {
              setHeading(h);
              setHasOrientation(true);
            } else if (e.alpha !== null) {
              setHeading(360 - e.alpha);
              setHasOrientation(true);
            }
          });
        }
      } catch {
        // Permission still denied
      }
    }
  };

  const cardinal = getCardinalDirection(heading);
  const directionLabel = getDirectionLabel(cardinal, t);
  const displayDeg = Math.round(heading) % 360;

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30"
      >
        <h2 className="text-2xl font-bold text-on-surface text-center mb-2">
          {t('春日指南针', 'Spring Compass')}
        </h2>
        <p className="text-sm text-secondary text-center mb-6">
          {hasOrientation
            ? t('正在使用设备传感器', 'Using device sensor')
            : t('拖动罗盘来改变方向', 'Drag the compass to change direction')}
        </p>

        {/* Compass Display */}
        <div
          ref={containerRef}
          className="relative w-72 h-72 mx-auto mb-6 select-none touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ cursor: hasOrientation ? 'default' : 'grab' }}
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 bg-gradient-to-br from-primary-container/30 to-tertiary-container/20" />

          {/* Degree ticks */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 300">
            {Array.from({ length: 72 }).map((_, i) => {
              const angle = i * 5;
              const isMajor = angle % 30 === 0;
              const r1 = isMajor ? 120 : 128;
              const r2 = 138;
              const rad = (angle * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={150 + r1 * Math.sin(rad)}
                  y1={150 - r1 * Math.cos(rad)}
                  x2={150 + r2 * Math.sin(rad)}
                  y2={150 - r2 * Math.cos(rad)}
                  stroke={isMajor ? '#3f6751' : '#a8b5a0'}
                  strokeWidth={isMajor ? 2.5 : 1}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Rotating compass rose */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: -heading }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          >
            <svg className="w-full h-full" viewBox="0 0 300 300">
              {/* Compass rose petals */}
              <defs>
                <linearGradient id="northGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e74c3c" />
                  <stop offset="100%" stopColor="#c0392b" />
                </linearGradient>
                <linearGradient id="southGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3f6751" />
                  <stop offset="100%" stopColor="#2d4a3c" />
                </linearGradient>
              </defs>

              {/* North pointer */}
              <polygon points="150,55 140,140 150,130 160,140" fill="url(#northGrad)" />
              {/* South pointer */}
              <polygon points="150,245 140,160 150,170 160,160" fill="url(#southGrad)" />
              {/* East pointer */}
              <polygon points="245,150 160,140 170,150 160,160" fill="#3f6751" opacity="0.7" />
              {/* West pointer */}
              <polygon points="55,150 140,140 130,150 140,160" fill="#3f6751" opacity="0.7" />

              {/* Center circle */}
              <circle cx="150" cy="150" r="12" fill="white" stroke="#3f6751" strokeWidth="2" />
              <circle cx="150" cy="150" r="5" fill="#3f6751" />

              {/* Cardinal labels */}
              <text x="150" y="38" textAnchor="middle" fill="#e74c3c" fontSize="18" fontWeight="bold" fontFamily="Nunito, sans-serif">
                N
              </text>
              <text x="150" y="272" textAnchor="middle" fill="#3f6751" fontSize="16" fontWeight="bold" fontFamily="Nunito, sans-serif">
                S
              </text>
              <text x="272" y="156" textAnchor="middle" fill="#3f6751" fontSize="16" fontWeight="bold" fontFamily="Nunito, sans-serif">
                E
              </text>
              <text x="28" y="156" textAnchor="middle" fill="#3f6751" fontSize="16" fontWeight="bold" fontFamily="Nunito, sans-serif">
                W
              </text>

              {/* Intercardinal labels */}
              <text x="232" y="78" textAnchor="middle" fill="#795648" fontSize="11" fontWeight="600" fontFamily="Nunito, sans-serif">
                NE
              </text>
              <text x="232" y="232" textAnchor="middle" fill="#795648" fontSize="11" fontWeight="600" fontFamily="Nunito, sans-serif">
                SE
              </text>
              <text x="68" y="232" textAnchor="middle" fill="#795648" fontSize="11" fontWeight="600" fontFamily="Nunito, sans-serif">
                SW
              </text>
              <text x="68" y="78" textAnchor="middle" fill="#795648" fontSize="11" fontWeight="600" fontFamily="Nunito, sans-serif">
                NW
              </text>
            </svg>
          </motion.div>

          {/* Fixed heading indicator (top triangle) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-red-500 drop-shadow-md" />
          </div>
        </div>

        {/* Heading Display */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <CompassIcon className="w-6 h-6 text-primary" />
            <span className="text-5xl font-bold text-on-surface tabular-nums tracking-tight">
              {displayDeg}°
            </span>
          </div>
          <span className="text-xl font-semibold text-primary">{directionLabel}</span>
          <span className="text-secondary ml-2">({cardinal})</span>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-surface-container-low rounded-xl p-3 text-center">
            <div className="text-xs text-secondary font-medium mb-1">
              {t('方位角', 'Azimuth')}
            </div>
            <div className="text-lg font-bold text-on-surface tabular-nums">{displayDeg}°</div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-3 text-center">
            <div className="text-xs text-secondary font-medium mb-1">
              {t('方向', 'Direction')}
            </div>
            <div className="text-lg font-bold text-on-surface">{cardinal}</div>
          </div>
        </div>

        {/* Permission / mode info */}
        {!hasOrientation && !permissionDenied && (
          <div className="bg-primary-container/30 rounded-xl p-3 flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-on-surface-variant">
              {t(
                '在移动设备上打开可使用电子罗盘，桌面端请拖动罗盘。',
                'Open on a mobile device for the electronic compass. On desktop, drag the compass.'
              )}
            </p>
          </div>
        )}

        {permissionDenied && (
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-sm text-red-600 mb-2">
              {t('罗盘权限被拒绝', 'Compass permission denied')}
            </p>
            <button
              onClick={requestOrientationPermission}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {t('重新请求权限', 'Request permission again')}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
