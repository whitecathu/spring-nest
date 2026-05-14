import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  RefreshCw,
  Droplets,
  Wind,
  Eye,
  Thermometer,
  Search,
  MapPin,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface WeatherData {
  location: string;
  country: string;
  tempC: number;
  tempF: number;
  feelsLikeC: number;
  feelsLikeF: number;
  condition: string;
  conditionIcon: string;
  humidity: number;
  windKph: number;
  windDir: string;
  visibility: number;
  uvIndex: number;
  forecast: ForecastDay[];
}

interface ForecastDay {
  date: string;
  dayName: string;
  maxTempC: number;
  minTempC: number;
  maxTempF: number;
  minTempF: number;
  condition: string;
  conditionIcon: string;
}

type TempUnit = 'C' | 'F';

function getWeatherEmoji(code: string): string {
  const c = parseInt(code, 10);
  if (c === 1000) return '☀️';
  if (c === 1003) return '⛅';
  if (c === 1006 || c === 1009) return '☁️';
  if (c >= 1030 && c <= 1039) return '🌫️';
  if ((c >= 1063 && c <= 1069) || (c >= 1150 && c <= 1207)) return '🌧️';
  if (c >= 1087 && c <= 1117) return '⛈️';
  if (c >= 1114 && c <= 1117) return '🌨️';
  if (c >= 1210 && c <= 1237) return '❄️';
  if (c >= 1240 && c <= 1246) return '🌧️';
  if (c >= 1249 && c <= 1264) return '🌨️';
  if (c >= 1273 && c <= 1282) return '⛈️';
  return '🌤️';
}

function getDayName(dateStr: string, lang: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return lang === 'zh' ? '今天' : 'Today';
  if (diff === 1) return lang === 'zh' ? '明天' : 'Tomorrow';
  if (diff === 2) return lang === 'zh' ? '后天' : 'Day after';
  const days =
    lang === 'zh'
      ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

async function fetchWeather(query: string): Promise<WeatherData> {
  const url = `https://wttr.in/${encodeURIComponent(query)}?format=j1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const current = data.current_condition?.[0];
  const nearest = data.nearest_area?.[0];
  if (!current || !nearest) throw new Error('Invalid data');

  const forecast: ForecastDay[] = (data.weather || [])
    .slice(0, 3)
    .map((day: Record<string, unknown>) => {
      const hourly = day.hourly as Record<string, unknown>[] | undefined;
      const weatherDesc = hourly?.[4]?.weatherDesc as Record<string, string>[] | undefined;
      return {
        date: day.date as string,
        dayName: '',
        maxTempC: parseInt(day.maxtempC as string, 10),
        minTempC: parseInt(day.mintempC as string, 10),
        maxTempF: parseInt(day.maxtempF as string, 10),
        minTempF: parseInt(day.mintempF as string, 10),
        condition: weatherDesc?.[0]?.value || '',
        conditionIcon:
          ((day.hourly as Record<string, unknown>[])?.[4]?.weatherCode as string) || '1000',
      };
    });

  const currentDesc = (current.weatherDesc as Record<string, string>[])?.[0]?.value || '';

  return {
    location: nearest.areaName?.[0]?.value || query,
    country: nearest.country?.[0]?.value || '',
    tempC: parseInt(current.temp_C, 10),
    tempF: parseInt(current.temp_F, 10),
    feelsLikeC: parseInt(current.FeelsLikeC, 10),
    feelsLikeF: parseInt(current.FeelsLikeF, 10),
    condition: currentDesc,
    conditionIcon: current.weatherCode || '1000',
    humidity: parseInt(current.humidity, 10),
    windKph: parseInt(current.windspeedKmph, 10),
    windDir: current.winddir16Point || '',
    visibility: parseInt(current.visibility, 10),
    uvIndex: parseInt(current.uvIndex, 10),
    forecast,
  };
}

export default function Weather({ onBack }: { onBack: () => void }) {
  const { t, language } = useUser();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationNotice, setLocationNotice] = useState('');
  const [locating, setLocating] = useState(false);
  const [unit, setUnit] = useState<TempUnit>('C');
  const [searchInput, setSearchInput] = useState('');
  const [city, setCity] = useState('');

  const loadWeather = useCallback(
    async (query: string, options?: { silent?: boolean }) => {
      setLoading(true);
      if (!options?.silent) setError('');
      try {
        const data = await fetchWeather(query);
        data.forecast.forEach((f) => {
          f.dayName = getDayName(f.date, language);
        });
        setWeather(data);
      } catch {
        if (!options?.silent || !weather) {
          setError(
            t(
              '天气数据获取失败，请检查网络或稍后重试',
              'Failed to fetch weather data. Check your network and try again.',
            ),
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [t, language, weather],
  );

  const loadCurrentLocationWeather = useCallback(() => {
    setLocationNotice('');

    if (!window.isSecureContext) {
      setLocationNotice(
        t(
          '浏览器要求在 HTTPS 或 localhost 环境下使用当前位置。你可以手动搜索城市。',
          'Location access requires HTTPS or localhost. You can search for a city manually.',
        ),
      );
      return;
    }

    if (!navigator.geolocation) {
      setLocationNotice(
        t(
          '当前浏览器不支持定位。你可以手动搜索城市。',
          'This browser does not support geolocation. You can search for a city manually.',
        ),
      );
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // wttr.in accepts comma-separated latitude and longitude, so no extra geocoding API key is needed.
        const coords = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
        setCity(coords);
        setLocationNotice(
          t('已使用当前位置更新天气。', 'Weather updated from your current location.'),
        );
        void loadWeather(coords, { silent: true }).finally(() => setLocating(false));
      },
      (geoError) => {
        const denied = geoError.code === geoError.PERMISSION_DENIED;
        setLocationNotice(
          denied
            ? t(
                '你拒绝了定位权限。可继续手动搜索城市。',
                'Location permission was denied. You can still search for a city manually.',
              )
            : t(
                '当前位置获取失败。可继续手动搜索城市。',
                'Could not get your current location. You can still search for a city manually.',
              ),
        );
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  }, [loadWeather, t]);

  useEffect(() => {
    void loadWeather('');
    loadCurrentLocationWeather();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    setCity(q);
    setLocationNotice('');
    loadWeather(q);
    setSearchInput('');
  };

  const handleRefresh = () => {
    loadWeather(city || '');
  };

  const temp = (c: number, f: number) => (unit === 'C' ? `${c}°C` : `${f}°F`);
  const feelsLike = (c: number, f: number) => (unit === 'C' ? `${c}°C` : `${f}°F`);

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
        className="bg-surface-container-high rounded-3xl p-6 shadow-lg border border-surface-variant/30"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-on-surface">{t('微风天气', 'Breeze Weather')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
              className="px-3 py-1.5 rounded-full bg-surface-container-high text-sm font-semibold text-on-surface hover:bg-surface-variant transition-colors"
            >
              °{unit === 'C' ? 'F' : 'C'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-full bg-surface-container-high text-secondary hover:bg-surface-variant transition-colors disabled:opacity-50"
              aria-label={t('刷新', 'Refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('搜索城市...', 'Search city...')}
              className="w-full bg-surface-container-low border border-surface-variant/30 rounded-xl py-2.5 pl-9 pr-4 text-on-surface outline-none focus:border-primary/50 transition-all text-sm font-medium"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            {t('搜索', 'Search')}
          </button>
        </div>

        <button
          type="button"
          onClick={loadCurrentLocationWeather}
          disabled={locating}
          className="mb-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-variant disabled:opacity-60"
        >
          <MapPin className="h-4 w-4 text-primary" />
          {locating
            ? t('正在定位...', 'Locating...')
            : t('获取当前位置天气', 'Use current location')}
        </button>

        {locationNotice && (
          <p className="mb-4 rounded-xl bg-primary-container/20 px-4 py-3 text-sm leading-relaxed text-on-surface-variant">
            {locationNotice}
          </p>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-secondary font-medium">
              {t('正在获取天气...', 'Fetching weather...')}
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-2 bg-primary text-on-primary rounded-full font-semibold text-sm"
            >
              {t('重试', 'Retry')}
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {weather && !loading && (
            <motion.div
              key={weather.location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-center gap-2 mb-6">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-secondary font-medium">
                  {weather.location}
                  {weather.country ? `, ${weather.country}` : ''}
                </span>
              </div>

              <div className="text-center mb-8">
                <div className="text-7xl mb-2">{getWeatherEmoji(weather.conditionIcon)}</div>
                <div className="text-6xl font-bold text-on-surface tabular-nums tracking-tight mb-1">
                  {temp(weather.tempC, weather.tempF)}
                </div>
                <div className="text-lg text-secondary font-medium mb-1">{weather.condition}</div>
                <div className="text-sm text-secondary/70">
                  {t('体感', 'Feels like')} {feelsLike(weather.feelsLikeC, weather.feelsLikeF)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-3">
                  <Droplets className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <div className="text-xs text-secondary">{t('湿度', 'Humidity')}</div>
                    <div className="text-base font-bold text-on-surface">{weather.humidity}%</div>
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-3">
                  <Wind className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <div className="text-xs text-secondary">{t('风速', 'Wind')}</div>
                    <div className="text-base font-bold text-on-surface">
                      {weather.windKph} km/h {weather.windDir}
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-3">
                  <Eye className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <div className="text-xs text-secondary">{t('能见度', 'Visibility')}</div>
                    <div className="text-base font-bold text-on-surface">
                      {weather.visibility} km
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-3">
                  <Thermometer className="w-5 h-5 text-orange-400 shrink-0" />
                  <div>
                    <div className="text-xs text-secondary">{t('紫外线', 'UV Index')}</div>
                    <div className="text-base font-bold text-on-surface">{weather.uvIndex}</div>
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-bold text-secondary mb-3">
                {t('未来三天预报', '3-Day Forecast')}
              </h3>
              <div className="space-y-2">
                {weather.forecast.map((day) => (
                  <div
                    key={day.date}
                    className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{getWeatherEmoji(day.conditionIcon)}</span>
                      <div>
                        <div className="font-semibold text-on-surface text-sm">{day.dayName}</div>
                        <div className="text-xs text-secondary">{day.condition}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-on-surface tabular-nums">
                        {unit === 'C' ? `${day.maxTempC}°` : `${day.maxTempF}°`}
                      </span>
                      <span className="text-secondary ml-1 tabular-nums">
                        {unit === 'C' ? `${day.minTempC}°` : `${day.minTempF}°`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
