import { Wrench, Heart, Play, BookOpen } from 'lucide-react';
import { useState, useMemo, lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import { useFavorites } from '../hooks/useFavorites';
import { tools } from '../data/tools';

const Calculator = lazy(() => import('./tools/Calculator'));
const Pomodoro = lazy(() => import('./tools/Pomodoro'));
const UnitConverter = lazy(() => import('./tools/UnitConverter'));
const PasswordGenerator = lazy(() => import('./tools/PasswordGenerator'));
const QRCodeGenerator = lazy(() => import('./tools/QRCodeGenerator'));

const toolComponents: Record<string, LazyExoticComponent<ComponentType<{ onBack: () => void }>>> = {
  'tool-1': Calculator,
  'tool-2': Pomodoro,
  'tool-3': UnitConverter,
  'tool-4': PasswordGenerator,
  'tool-5': QRCodeGenerator,
};

export default function Tools() {
  const { t } = useUser();
  const { favoriteIds, toggle } = useFavorites();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [activeCategory, setActiveCategory] = useState('all');

  const activeToolBySlug = useMemo(() => {
    if (!slug) return null;
    return tools.find(t => t.route.endsWith(`/${slug}`)) || null;
  }, [slug]);

  const [internalToolId, setInternalToolId] = useState<string | null>(null);

  const activeToolId = activeToolBySlug?.id || internalToolId;

  useEffect(() => {
    if (slug && activeToolBySlug) {
      setInternalToolId(activeToolBySlug.id);
    } else if (!slug) {
      setInternalToolId(null);
    }
  }, [slug, activeToolBySlug]);

  const categories = useMemo(() => {
    const cats = [...new Set(tools.map(t => t.category))];
    return [{ id: 'all', label: t('全部工具', 'All Tools') }, ...cats.map(c => ({ id: c, label: c }))];
  }, [t]);

  const filteredTools = useMemo(
    () => activeCategory === 'all' ? tools : tools.filter(t => t.category === activeCategory),
    [activeCategory]
  );

  const activeTool = useMemo(
    () => tools.find(t => t.id === activeToolId) || null,
    [activeToolId]
  );

  const handleOpen = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (tool) {
      const toolSlug = tool.route.split('/').pop();
      navigate(`/tools/${toolSlug}`);
    }
  };

  const handleBack = () => {
    navigate('/tools');
  };

  if (activeTool && toolComponents[activeTool.id]) {
    const ToolComponent = toolComponents[activeTool.id];
    return (
      <Suspense fallback={<div className="flex-grow flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <ToolComponent onBack={handleBack} />
      </Suspense>
    );
  }

  if (activeTool) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <p className="text-xl text-secondary mb-4">{t('此工具正在开发中，敬请期待', 'This tool is under development. Stay tuned.')}</p>
        <button onClick={handleBack} className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold">
          {t('返回工具列表', 'Back to Tools')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 py-10 relative">
      <motion.header
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-20 relative pt-16 pb-8"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary-container/20 to-transparent -z-10 rounded-3xl blur-2xl"></div>
        <div className="absolute top-0 left-[10%] w-24 h-24 bg-tertiary-container/40 rounded-full blur-2xl animate-float pointer-events-none"></div>
        <div className="absolute top-10 right-[15%] w-32 h-32 bg-primary-container/30 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>

        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
          <Wrench className="absolute top-4 right-[25%] text-primary/20 w-10 h-10 pointer-events-none" />
        </motion.div>
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}>
          <BookOpen className="absolute bottom-8 left-[20%] text-tertiary/20 w-8 h-8 pointer-events-none" />
        </motion.div>

        <h1 className="font-nunito font-extrabold text-5xl text-[#274e3a] dark:text-primary mb-6 flex items-center justify-center gap-4">
          {t('实用小筑', 'Practical Tools')} <span className="text-5xl animate-float inline-block">🛠️</span>
        </h1>
        <p className="font-sans text-lg font-medium text-on-surface-variant max-w-2xl mx-auto">
          {t('实用小工具，便捷你的每一天', 'Practical small utilities designed to make your day easier.')}
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap justify-center gap-4 mb-16"
      >
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            aria-pressed={activeCategory === cat.id}
            className={`px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 hover:scale-105 ${
              activeCategory === cat.id
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'glass-pill text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </motion.div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        <AnimatePresence>
          {filteredTools.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-20 text-secondary"
            >
              <Wrench className="w-16 h-16 text-secondary/30 mb-4" />
              <p className="font-medium text-lg">{t('暂无工具', 'No tools found')}</p>
            </motion.div>
          )}
          {filteredTools.map((tool, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -30 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
              key={tool.id}
              className="glass-card rounded-3xl p-8 transition-all duration-500 hover-glow group"
            >
              <div className="flex flex-col items-center text-center gap-6 mb-6">
                <div className={`w-24 h-24 rounded-2xl overflow-hidden shrink-0 ${tool.iconBg || 'bg-surface-container'} flex items-center justify-center shadow-inner group-hover:-translate-y-3 group-hover:rotate-6 group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] transition-all duration-500 relative text-4xl`}>
                  {tool.image ? (
                    <>
                      <img src={tool.image} alt={tool.title} loading="lazy" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"></div>
                    </>
                  ) : (
                    <span>{tool.icon}</span>
                  )}
                </div>
                <div>
                  <h2 className="font-nunito font-bold text-2xl text-on-background mb-3 group-hover:text-primary transition-colors">{t(tool.title, tool.titleEn)}</h2>
                  <span className="inline-block px-3 py-1.5 rounded-full font-semibold text-[13px] backdrop-blur-sm bg-primary-container/30 text-on-primary-container">
                    {tool.category}
                  </span>
                </div>
              </div>
              <p className="font-sans text-base text-on-surface-variant mb-8 line-clamp-3 text-center">
                {t(tool.description, tool.descriptionEn)}
              </p>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => toggle(tool.id)}
                  className={`p-2 rounded-full transition-all ${
                    favoriteIds.includes(tool.id)
                      ? 'text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100'
                      : 'text-secondary/40 hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/10'
                  }`}
                  aria-label={favoriteIds.includes(tool.id) ? t('取消收藏', 'Remove favorite') : t('收藏', 'Add favorite')}
                >
                  <Heart className={`w-5 h-5 ${favoriteIds.includes(tool.id) ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => handleOpen(tool.id)}
                  className="py-4 px-8 rounded-xl btn-gradient text-on-primary font-semibold text-sm shadow-md flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4" />
                  {t('打开工具', 'Open Tool')}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
