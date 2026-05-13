import { ArrowUp, Home, Leaf, Github, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

export default function Footer() {
  const { t } = useUser();
  return (
    <footer className="w-full rounded-t-[64px] mt-auto border-t border-primary-container/40 bg-gradient-to-b from-white/60 to-[#FFF9F2] backdrop-blur-xl relative overflow-hidden" aria-label={t('页脚', 'Footer')}>
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -right-32 w-96 h-96 bg-primary-container/20 rounded-full blur-[100px] pointer-events-none"
      ></motion.div>
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-32 -left-32 w-96 h-96 bg-tertiary-container/20 rounded-full blur-[100px] pointer-events-none"
      ></motion.div>

      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center gap-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-extrabold text-primary font-nunito flex items-center gap-3"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Leaf className="w-10 h-10 fill-primary" />
          </motion.div>
          {t('Spring Nest 春日小筑', 'Spring Nest')}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="font-sans text-secondary/80 max-w-md font-medium text-lg leading-relaxed"
        >
          {t('以春风之轻盈，构建治愈系数字角落。', 'Building a healing digital corner with the lightness of a spring breeze.')}<br />
          {t('发现日常小确幸，让生活更有温度。', 'Discovering daily joys, making life warmer.')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-6 text-primary/60"
        >
          <motion.a
            whileHover={{ y: -8, scale: 1.15, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
            whileTap={{ scale: 0.9 }}
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-white/50 rounded-full hover:bg-primary border border-transparent hover:border-primary-container hover:text-white transition-all duration-300 shadow-sm"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" />
          </motion.a>
          <motion.a
            whileHover={{ y: -8, scale: 1.15, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
            whileTap={{ scale: 0.9 }}
            href="mailto:hello@springnest.com"
            className="p-3 bg-white/50 rounded-full hover:bg-primary border border-transparent hover:border-primary-container hover:text-white transition-all duration-300 shadow-sm"
            aria-label="Email"
          >
            <Mail className="w-5 h-5" />
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-4 text-sm text-secondary/60"
        >
          <Link to="/" className="hover:text-primary transition-colors inline-flex items-center gap-1">
            <Home className="h-4 w-4" />
            {t('返回首页', 'Home')}
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-primary transition-colors">
            {t('隐私政策', 'Privacy Policy')}
          </Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-primary transition-colors">
            {t('用户协议', 'Terms of Service')}
          </Link>
          <span>·</span>
          <Link to="/leaderboard" className="hover:text-primary transition-colors">
            {t('排行榜', 'Leaderboard')}
          </Link>
          <span>·</span>
          <Link to="/feedback" className="hover:text-primary transition-colors">
            {t('意见反馈', 'Feedback')}
          </Link>
          <span>·</span>
          <Link to="/about" className="hover:text-primary transition-colors">
            {t('关于我们', 'About')}
          </Link>
          <span>·</span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <ArrowUp className="h-4 w-4" />
            {t('返回顶部', 'Back to top')}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="font-nunito text-xs uppercase tracking-[0.2em] text-primary/50 mt-4 font-semibold"
        >
          &copy; {new Date().getFullYear()} Spring Nest. {t('用爱与温暖滋养你的数字探索。', 'Nurturing your digital discovery with love.')}
        </motion.div>
      </div>
    </footer>
  );
}
