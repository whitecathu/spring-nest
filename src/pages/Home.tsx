import { Leaf, Gamepad2, Wrench, Sparkles, Flower2, Cloud, Play, Camera, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { useUser } from '../contexts/UserContext';

export default function Home() {
  const { t } = useUser();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const bannerY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef}>
      {/* Banner Section */}
      <motion.section
        style={{ y: bannerY, opacity }}
        className="relative w-full py-40 px-6 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#E8F5EE] to-[#FFF9F2] dark:from-[#1a2c1f] dark:to-background"
      >
        {/* Floating Clouds & Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-[10%] opacity-40 text-primary-container"
          >
            <Cloud className="w-20 h-20 fill-primary-container" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 30, 0], x: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-40 right-[15%] opacity-30"
          >
            <Cloud className="w-24 h-24 fill-primary-container text-primary-container" />
          </motion.div>
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-[30%] left-[25%] opacity-60 text-tertiary-container"
          >
            <Flower2 className="w-10 h-10 fill-tertiary-container" />
          </motion.div>
          <motion.div
            animate={{ rotate: -360, scale: [1, 1.2, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[20%] right-[25%] opacity-50 text-tertiary-container"
          >
            <Flower2 className="w-12 h-12 fill-tertiary-container" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] right-[30%] opacity-40 text-tertiary-container"
          >
            <Flower2 className="w-8 h-8 fill-tertiary-container" />
          </motion.div>
        </div>

        {/* Text Content */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-sans font-extrabold text-5xl text-primary mb-4 tracking-tight"
          >
            Spring Nest
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="font-nunito text-3xl font-bold text-secondary mb-6"
          >
            {t('春日小筑', 'Spring Nest')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-nunito text-xl text-secondary max-w-2xl mx-auto mb-12"
          >
            {t('藏尽春日好物，聚齐实用与欢喜', 'A haven of spring delights, gathering utility and joy')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-6"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/games')}
              className="bg-primary text-on-primary font-bold text-lg py-4 px-10 rounded-2xl shadow-[0_8px_20px_rgba(63,103,81,0.3)] hover:shadow-[0_12px_30px_rgba(63,103,81,0.5)] transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Gamepad2 className="w-6 h-6 fill-on-primary" />
              {t('进入游戏天堂', 'Enter Games Paradise')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/tools')}
              className="bg-white text-primary font-bold text-lg py-4 px-10 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_25px_rgba(184,228,201,0.4)] dark:bg-surface-container dark:hover:shadow-[0_12px_25px_rgba(47,67,55,0.4)] transition-all duration-300 flex items-center justify-center gap-3 border border-primary-container/30"
            >
              <Wrench className="w-6 h-6" />
              {t('探索实用小筑', 'Explore Tools Cabin')}
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Entrance Cards */}
      <section className="max-w-[1200px] w-full mx-auto px-6 py-10 mb-20 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
            onClick={() => navigate('/games')}
            className="group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#FFE5D9] to-[#FFF0E6] dark:from-[#3a2018] dark:to-[#2a1812] p-10 md:h-[380px] flex flex-col justify-between shadow-[0_10px_30px_rgba(255,219,205,0.3)] hover-glow transition-all duration-500 cursor-pointer"
          >
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/40 rounded-full blur-3xl group-hover:bg-white/60 transition-colors duration-500"></div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-110 transform">
              <Gamepad2 className="w-40 h-40 text-tertiary" />
            </div>

            <div className="relative z-10 flex justify-between items-start w-full">
              <span className="inline-flex items-center px-4 py-2 bg-white/70 backdrop-blur-md text-tertiary rounded-full font-bold text-sm shadow-sm group-hover:-translate-y-1 transition-transform">
                <Play className="w-4 h-4 mr-1" /> {t('游玩与放松', 'Play & Relax')}
              </span>
              <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Gamepad2 className="w-8 h-8 text-tertiary" />
              </div>
            </div>

            <div className="relative z-10 mt-auto transform group-hover:translate-x-2 transition-transform duration-300">
              <h3 className="font-nunito font-bold text-4xl text-tertiary mb-3">{t('游戏天堂', 'Game Paradise')}</h3>
              <p className="font-sans text-lg text-tertiary/80 font-medium">{t('治愈心灵的休闲游戏区', 'Healing causal games')}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3, delay: 0.1 }}
            onClick={() => navigate('/tools')}
            className="group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#E6F4EA] to-[#F0F9F4] dark:from-[#1a2a1f] dark:to-[#152218] p-10 md:h-[380px] flex flex-col justify-between shadow-[0_10px_30px_rgba(184,228,201,0.3)] hover-glow transition-all duration-500 cursor-pointer"
          >
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/40 rounded-full blur-3xl group-hover:bg-white/60 transition-colors duration-500"></div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-110 transform">
              <Wrench className="w-40 h-40 text-primary" />
            </div>

            <div className="relative z-10 flex justify-between items-start w-full">
              <span className="inline-flex items-center px-4 py-2 bg-white/70 backdrop-blur-md text-primary rounded-full font-bold text-sm shadow-sm group-hover:-translate-y-1 transition-transform">
                <Wrench className="w-4 h-4 mr-1" /> {t('工具与效率', 'Utility & Tools')}
              </span>
              <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Wrench className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="relative z-10 mt-auto transform group-hover:translate-x-2 transition-transform duration-300">
              <h3 className="font-nunito font-bold text-4xl text-primary mb-3">{t('实用小筑', 'Practical Tools')}</h3>
              <p className="font-sans text-lg text-primary/80 font-medium">{t('发现生活与工作的魔法', 'Discover magic for work & life')}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* New Apps Preview */}
      <section className="max-w-[1200px] mx-auto px-6 py-10 mb-40 relative w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-4 mb-12 relative z-10"
        >
          <Sparkles className="text-primary-container w-10 h-10 animate-pulse fill-primary-container" />
          <h2 className="font-nunito font-bold text-3xl text-secondary">{t('新品APP即将上架', 'New Apps Coming Soon')}</h2>
          <Flower2 className="text-tertiary-container w-10 h-10 animate-pulse fill-tertiary-container" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {[
            { delay: 0.1, icon: <Play className="w-10 h-10 text-primary fill-primary relative z-10" />, bg: "bg-[#FFF9F2] bg-[radial-gradient(at_40%_20%,hsla(28,100%,74%,0.1)_0px,transparent_50%),radial-gradient(at_80%_0%,hsla(189,100%,56%,0.1)_0px,transparent_50%)] dark:bg-surface-container" },
            { delay: 0.2, icon: <Camera className="w-10 h-10 text-blue-400 fill-blue-400 relative z-10" />, bg: "bg-gradient-to-br from-[#E8F5EE] to-[#FFF9F2] dark:from-[#1a2c1f] dark:to-surface-container" },
            { delay: 0.3, icon: <Radio className="w-10 h-10 text-orange-400 fill-orange-400 relative z-10" />, bg: "bg-gradient-to-br from-[#FFE5D9] to-[#FFF9F2] dark:from-[#3a2018] dark:to-surface-container" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: item.delay }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-white dark:bg-surface-container-high rounded-[24px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_15px_40px_rgba(184,228,201,0.2)] transition-all duration-300 flex flex-col gap-5 border border-surface-variant/30 cursor-pointer group"
            >
              <div className={`w-20 h-20 rounded-2xl ${item.bg} flex items-center justify-center overflow-hidden shadow-inner relative group-hover:scale-105 transition-transform duration-300`}>
                {item.icon}
              </div>
              <div>
                <div className={`h-6 ${i === 0 ? 'w-28' : i === 1 ? 'w-32' : 'w-24'} bg-surface-variant/60 rounded-full mb-3`}></div>
                <div className="h-4 w-full bg-surface-variant/30 rounded-full mb-2"></div>
                <div className={`h-4 ${i === 0 ? 'w-2/3' : i === 1 ? 'w-3/4' : 'w-1/2'} bg-surface-variant/30 rounded-full`}></div>
              </div>
              <div className="mt-auto pt-4 flex gap-3">
                <span className={`w-14 h-8 rounded-full ${i === 2 ? 'bg-primary-container/30' : 'bg-tertiary-container/30'}`}></span>
                {i !== 1 && <span className={`w-14 h-8 rounded-full ${i === 0 ? 'bg-primary-container/30' : 'bg-surface-variant/40'}`}></span>}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
