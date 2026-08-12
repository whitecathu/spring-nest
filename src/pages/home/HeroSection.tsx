import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import gsap from 'gsap';
import { Gamepad2, Wrench, Search } from 'lucide-react';
import { trackSearch } from '../../lib/analytics';
import { MagneticButton } from '../../components/GsapSurface';
import { heroItemVariants, heroStageVariants } from '../../lib/animations';
import GlassSurface from '../../components/animations/GlassSurface';
import HomeHeroStage from '../../components/animations/HomeHeroStage';
import ShinyText from '../../components/animations/ShinyText';

type Translator = (zh: string, en: string) => string;

type HeroSectionProps = {
  t: Translator;
  toolsCount: number;
  gamesCount: number;
  reducedMotion: boolean;
};

export default function HeroSection({
  t,
  toolsCount,
  gamesCount,
  reducedMotion,
}: HeroSectionProps) {
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState('');

  const handleHeroSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = heroQuery.trim();
    if (!query) return;
    trackSearch(query);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="relative flex min-h-[520px] w-full flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-20 text-center sm:min-h-[560px] sm:pb-24 sm:pt-32 lg:min-h-[620px]">
      <HomeHeroStage toolsCount={toolsCount} gamesCount={gamesCount} />

      <div className="relative z-10 flex flex-col items-center">
        <p className="font-nunito text-base font-bold text-primary mb-3 tracking-wide">
          <ShinyText
            text="Spring Nest"
            speed={4}
            shineColor="var(--color-primary-container)"
            color="var(--color-primary)"
          />
        </p>
        <h1 className="font-sans font-extrabold text-3xl sm:text-4xl lg:text-5xl text-primary mb-4 tracking-tight max-w-4xl">
          {t('免费在线实用工具与休闲小游戏合集', 'Free Online Tools and Casual Games')}
        </h1>
        <p className="font-nunito text-lg text-secondary/80 max-w-2xl mx-auto mb-8">
          {t(
            '免费、轻量、无需登录、即开即用。搜索工具、小游戏、描述或标签，快速打开你需要的内容。',
            'Free, lightweight, no sign-in required, ready on open. Search tools, games, descriptions, or tags and jump straight in.',
          )}
        </p>

        <form onSubmit={handleHeroSearch} className="w-full max-w-2xl mb-8" role="search">
          <label htmlFor="home-search" className="sr-only">
            {t('搜索工具和小游戏', 'Search tools and games')}
          </label>
          <GlassSurface
            borderRadius={16}
            brightness={60}
            opacity={0.95}
            blur={14}
            className="w-full"
          >
            <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-white/90 dark:bg-surface-container-high/90 p-2 shadow-[0_12px_36px_rgba(63,103,81,0.12)]">
              <Search className="ml-3 h-5 w-5 shrink-0 text-primary" />
              <input
                id="home-search"
                type="search"
                value={heroQuery}
                onChange={(event) => setHeroQuery(event.target.value)}
                placeholder={t(
                  '搜索计算器、2048、JSON、随机...',
                  'Search calculator, 2048, JSON, random...',
                )}
                className="min-h-[48px] flex-1 bg-transparent px-2 text-base text-on-surface outline-none placeholder:text-secondary/60"
              />
              <button
                type="submit"
                className="min-h-[48px] rounded-xl bg-primary px-5 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={!heroQuery.trim()}
              >
                {t('搜索', 'Search')}
              </button>
            </div>
          </GlassSurface>
        </form>

        <div className="flex flex-col sm:flex-row gap-4">
          <MagneticButton
            onClick={() => navigate('/tools')}
            className="bg-primary text-on-primary font-bold text-base py-3.5 px-8 rounded-2xl shadow-[0_6px_16px_rgba(63,103,81,0.3)] hover:shadow-[0_10px_24px_rgba(63,103,81,0.45)] transition-all duration-300 flex items-center justify-center gap-2.5"
          >
            <Wrench className="w-5 h-5" />
            {t('开始使用工具', 'Explore Tools')}
          </MagneticButton>
          <MagneticButton
            onClick={() => navigate('/games')}
            className="bg-white text-primary font-bold text-base py-3.5 px-8 rounded-2xl shadow-[0_6px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_24px_rgba(184,228,201,0.4)] dark:bg-surface-container dark:hover:shadow-[0_10px_24px_rgba(47,67,55,0.4)] transition-all duration-300 flex items-center justify-center gap-2.5 border border-primary-container/30"
          >
            <Gamepad2 className="w-5 h-5" />
            {t('玩个小游戏', 'Play a Game')}
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
