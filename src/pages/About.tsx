import { Heart, Cloud, Sparkles, Sprout, Users, Verified, Mail, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { useUser } from '../contexts/UserContext';

export default function About() {
  const { t } = useUser();
  const [copied, setCopied] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-[1200px] mx-auto px-6 py-16 w-full"
    >
      {/* Header Section */}
      <motion.header variants={itemVariants} className="text-center mb-24 relative">
        <h1 className="text-5xl font-black text-primary mb-6 flex items-center justify-center gap-4 tracking-tight">
          {t('关于我们', 'About Us')}
          <Heart className="w-10 h-10 fill-tertiary text-tertiary animate-pulse" />
        </h1>
        <p className="font-sans font-medium text-secondary text-xl opacity-80">{t('以春日之名，做有温度的APP合集', 'In the name of spring, a heartwarming app collection')}</p>
        
        {/* Animated Background Decor */}
        <motion.div 
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -left-10 text-primary-fixed-dim/30"
        >
          <Cloud className="w-16 h-16 fill-current" />
        </motion.div>
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 -right-10 text-primary-container/40"
        >
          <Sparkles className="w-14 h-14" />
        </motion.div>
      </motion.header>

      {/* Artistic Hero Section */}
      <motion.section variants={itemVariants} className="mb-32 relative">
        <div className="w-full aspect-[21/9] rounded-[48px] overflow-hidden relative shadow-2xl group">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuACnBgaNKEFGBSzydFefsHzPdYEB3b5hkbSZpyDC5vaZ-x_XcHwQaPDJdat4fXL9AcC_6IPduGtd_AGF2UuZ3shO9BEj5xM6penHNlzc3bLOMLgZnSPX92QElXAux0_rfTrdlCgUAirE1iiKMZznNrtK2sPACDND_KGh1eXZt7cPMnAPFUO8LuwLqE56kWAM3bjIKB_2aCuPzTNoEhashJrleBsSqllX6A9a1bJvuItl5_s8n6bF6VS7aMonOVhqVauj65ZyRjbKtw" 
            alt="Spring Nest Hero" 
            loading="lazy"
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute bottom-12 left-12 glass-card p-8 rounded-3xl max-w-md hidden lg:block"
          >
            <div className="flex items-center gap-3 mb-2 text-primary font-bold">
              <Sprout className="w-5 h-5" />
              Spring Nest Story
            </div>
            <p className="text-on-surface-variant font-sans italic">{t('"像种子一样在春天发芽，在这里发现让生活更美好的工具。"', '"Sprouting in spring like a seed, discover tools that make life better."')}</p>
          </motion.div>
        </div>
      </motion.section>

      {/* Asymmetric Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-y-16 lg:gap-x-12 mb-32">
        {/* Introduction */}
        <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 bg-primary-container/40 text-on-primary-container px-6 py-2 rounded-full w-max font-semibold text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            {t('我们的旅程', 'Our Journey')}
          </div>
          <h2 className="text-4xl font-extrabold text-on-surface mb-8 leading-tight">
            {t('发现美好数字生活，', 'Discover a beautiful digital life,')}<br/><span className="text-primary">{t('从指尖的温润开始。', 'starting from the warmth of your fingertips.')}</span>
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed mb-6 font-medium">
            {t('在这个信息爆炸的时代，我们希望成为您数字生活中的一处静谧角落。春日小筑不仅仅是一个APP合集，它是一个精心布置的花园，每一款收录的应用都是我们细心栽培的种子。', 'In this era of information explosion, we hope to be a quiet corner in your digital life. Spring Nest is not just an app collection; it is a carefully arranged garden, and every included application is a seed we have carefully cultivated.')}
          </p>
        </motion.div>

        {/* Mission & Vision Cards */}
        <div className="lg:col-span-5 space-y-8 lg:mt-12">
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="glass-card p-10 rounded-[40px] border-l-8 border-primary"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
              <Verified className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-4">{t('我们的使命', 'Our Mission')}</h3>
            <p className="text-on-surface-variant leading-loose font-medium">
              {t('筛选并呈现那些具有独特设计美学、注重用户隐私、且能切实提升生活幸福感的优质数字工具。我们相信，好的应用应该像春风一样，温柔地融入您的生活。', 'Filter and present high-quality digital tools that have unique design aesthetics, focus on user privacy, and can effectively enhance happiness in life. We believe good applications should gently blend into your life like the spring breeze.')}
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-surface-container-high p-10 rounded-[40px] border-l-8 border-tertiary"
          >
            <div className="w-14 h-14 bg-tertiary/10 rounded-2xl flex items-center justify-center mb-6 text-tertiary">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-4">{t('我们的愿景', 'Our Vision')}</h3>
            <p className="text-on-surface-variant leading-loose font-medium">
              {t('构建一个充满温度的数字社区，让每一位探索者都能在这里找到属于自己的那份从容与治愈，共同分享数字生活中的点滴美好。', 'Build a heartwarming digital community where every explorer can find their own calmness and healing, and share the little beautiful things in digital life together.')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Card */}
      <motion.section variants={itemVariants} className="max-w-4xl mx-auto">
        <div className="glass-card rounded-[48px] p-16 text-center relative overflow-hidden group">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-tertiary-container/20 rounded-full blur-[100px] group-hover:bg-tertiary-container/30 transition-colors"></div>
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-primary-container/30 rounded-full blur-[80px] group-hover:bg-primary-container/40 transition-colors"></div>
          
          <div className="relative z-10">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-20 h-20 bg-white/80 rounded-3xl flex items-center justify-center shadow-xl mb-8 mx-auto text-primary"
            >
              <Mail className="w-10 h-10" />
            </motion.div>
            <h3 className="text-4xl font-bold text-on-surface mb-6 font-nunito">{t('联系我们', 'Contact Us')}</h3>
            <p className="text-xl text-on-surface-variant max-w-xl mx-auto mb-12 font-medium">
              {t('无论是想要推荐好用的应用，还是与我们分享您的使用感受，我们都期待着您的来信。', 'Whether you want to recommend a useful app or share your experience, we look forward to hearing from you.')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-10">
              <motion.a 
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="mailto:hello@springnest.com" 
                className="flex items-center gap-4 bg-white/50 backdrop-blur px-8 py-5 rounded-3xl border border-white shadow-sm hover:shadow-lg transition-all cursor-pointer"
              >
                <Mail className="text-primary w-6 h-6" />
                <span className="font-semibold text-on-surface">hello@springnest.com</span>
              </motion.a>
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  navigator.clipboard.writeText('SpringNest_App');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-4 bg-white/50 backdrop-blur px-8 py-5 rounded-3xl border border-white shadow-sm hover:shadow-lg transition-all cursor-pointer"
              >
                <MessageCircle className="text-primary w-6 h-6" />
                <span className="font-semibold text-on-surface">{copied ? t('微信号已复制！', 'WeChat copied!') : 'WeChat: SpringNest_App'}</span>
              </motion.div>
            </div>
            
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="mailto:hello@springnest.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-12 py-5 bg-primary text-on-primary rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              {t('立即发送邮件', 'Send Email Now')}
            </motion.a>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
