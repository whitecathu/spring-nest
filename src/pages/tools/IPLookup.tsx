import { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Copy,
  Check,
  Globe,
  MapPin,
  Wifi,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface IPInfo {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  timezone: string;
  org: string;
  latitude: number;
  longitude: number;
}

export default function IPLookup({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const fetchIP = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      if (data.error) throw new Error(data.reason || 'Unknown error');
      setIpInfo(data);
    } catch {
      setError(
        t('获取 IP 信息失败，请稍后重试', 'Failed to fetch IP info. Please try again later.'),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchIP();
  }, [fetchIP]);

  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    }
  }, []);

  const InfoRow = ({
    icon,
    label,
    value,
    field,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    field: string;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-surface-variant/20 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-primary-container/30 flex items-center justify-center shrink-0 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-secondary">{label}</p>
          <p className="text-sm font-semibold text-on-surface truncate">{value || '-'}</p>
        </div>
      </div>
      {value && (
        <button
          onClick={() => handleCopy(value, field)}
          aria-label={t(`复制${label}`, `Copy ${label}`)}
          className={`p-2 rounded-lg shrink-0 transition-all ${
            copiedField === field
              ? 'bg-green-100 text-green-600'
              : 'text-secondary/40 hover:text-primary hover:bg-primary-container/20'
          }`}
        >
          {copiedField === field ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex-grow max-w-2xl mx-auto w-full px-4 py-8">
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
          {t('IP 查询', 'IP Address Lookup')}
        </h2>
        <p className="text-sm text-secondary text-center mb-6">
          {t(
            '查看您的公网 IP 地址和地理位置信息',
            'View your public IP address and geolocation info',
          )}
        </p>

        {/* Refresh Button */}
        <button
          onClick={fetchIP}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mb-6 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('查询中...', 'Looking up...')}
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              {t('刷新查询', 'Refresh Lookup')}
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Loading skeleton */}
        {loading && !ipInfo && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high" />
                <div className="flex-1">
                  <div className="h-3 w-16 bg-surface-container-high rounded mb-1" />
                  <div className="h-4 w-32 bg-surface-container-high rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* IP Info */}
        {ipInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={ipInfo.ip}
          >
            {/* Big IP display */}
            <div className="text-center mb-6 p-6 rounded-2xl bg-gradient-to-br from-primary-container/30 to-tertiary-container/20">
              <p className="text-xs text-secondary mb-2">
                {t('您的公网 IP 地址', 'Your Public IP Address')}
              </p>
              <p className="text-3xl sm:text-4xl font-mono font-bold text-primary break-all">
                {ipInfo.ip}
              </p>
              <button
                onClick={() => handleCopy(ipInfo.ip, 'ip-main')}
                className={`mt-3 py-1.5 px-4 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                  copiedField === 'ip-main'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-white/60 text-secondary hover:bg-white'
                }`}
              >
                {copiedField === 'ip-main' ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copiedField === 'ip-main' ? t('已复制!', 'Copied!') : t('复制 IP', 'Copy IP')}
              </button>
            </div>

            {/* Detail info */}
            <div className="rounded-2xl bg-surface-container-low/50 p-4">
              <InfoRow
                icon={<Globe className="w-4 h-4" />}
                label={t('运营商', 'ISP / Organization')}
                value={ipInfo.org}
                field="org"
              />
              <InfoRow
                icon={<MapPin className="w-4 h-4" />}
                label={t('城市', 'City')}
                value={ipInfo.city}
                field="city"
              />
              <InfoRow
                icon={<MapPin className="w-4 h-4" />}
                label={t('地区', 'Region')}
                value={ipInfo.region}
                field="region"
              />
              <InfoRow
                icon={<Globe className="w-4 h-4" />}
                label={t('国家', 'Country')}
                value={`${ipInfo.country_name} (${ipInfo.country_code})`}
                field="country"
              />
              <InfoRow
                icon={<Wifi className="w-4 h-4" />}
                label={t('时区', 'Timezone')}
                value={ipInfo.timezone}
                field="timezone"
              />
              <InfoRow
                icon={<MapPin className="w-4 h-4" />}
                label={t('经纬度', 'Coordinates')}
                value={`${ipInfo.latitude}, ${ipInfo.longitude}`}
                field="coords"
              />
            </div>

            {/* Map link */}
            <div className="mt-4 text-center">
              <a
                href={`https://www.openstreetmap.org/?mlat=${ipInfo.latitude}&mlon=${ipInfo.longitude}#map=10/${ipInfo.latitude}/${ipInfo.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline font-medium"
              >
                {t('在地图上查看', 'View on Map')} &rarr;
              </a>
            </div>
          </motion.div>
        )}

        {/* Empty state when error and no data */}
        {error && !ipInfo && !loading && (
          <div className="text-center py-8 text-secondary/50">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t('无法获取 IP 信息', 'Unable to fetch IP information')}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
