import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Bug, Lightbulb, Star, Sparkles, Download, Send, Inbox } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import {
  submitFeedback,
  getAllFeedbacks,
  exportFeedbacksAsJson,
  type FeedbackItem,
} from '../services/feedbackService';

const feedbackTypes = [
  { key: 'bug' as const, icon: Bug, zh: '问题反馈', en: 'Bug Report' },
  { key: 'suggestion' as const, icon: Lightbulb, zh: '建议', en: 'Suggestion' },
  { key: 'experience' as const, icon: Star, zh: '使用体验', en: 'Experience' },
  { key: 'feature' as const, icon: Sparkles, zh: '功能需求', en: 'Feature Request' },
];

export default function Feedback() {
  const { t } = useUser();
  const [type, setType] = useState<'bug' | 'suggestion' | 'experience' | 'feature'>('bug');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [toastMessage, setToastMessage] = useState('');

  const loadFeedbacks = useCallback(() => {
    setFeedbacks(getAllFeedbacks().slice(0, 10));
  }, []);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 10) return;

    submitFeedback({ type, content: content.trim(), contact: contact.trim() || undefined });
    setContent('');
    setContact('');
    loadFeedbacks();
    showToast(t('感谢您的反馈！', 'Thank you for your feedback!'));
  };

  const typeLabel = (item: FeedbackItem) => {
    const found = feedbackTypes.find((ft) => ft.key === item.type);
    return found ? t(found.zh, found.en) : item.type;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-[900px] mx-auto px-6 py-16 w-full"
    >
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] font-sans text-sm font-medium border border-surface-variant flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-primary" />
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header variants={itemVariants} className="text-center mb-16">
        <div className="w-20 h-20 bg-primary-container/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
          <MessageSquare className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-on-surface mb-4">
          {t('意见反馈', 'Feedback')}
        </h1>
        <p className="text-on-surface-variant mt-4 max-w-2xl mx-auto">
          {t(
            '您的每一条反馈都是我们前进的动力。无论是问题报告、功能建议还是使用体验，我们都认真倾听。',
            'Every piece of feedback drives us forward. Whether it\'s a bug report, feature suggestion, or experience sharing, we listen carefully.'
          )}
        </p>
      </motion.header>

      {/* Form */}
      <motion.section variants={itemVariants} className="mb-16">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-container-high rounded-3xl shadow-sm border border-surface-variant/30 p-6 space-y-6">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-bold text-on-surface mb-3">
              {t('反馈类型', 'Feedback Type')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {feedbackTypes.map((ft) => {
                const Icon = ft.icon;
                const selected = type === ft.key;
                return (
                  <button
                    key={ft.key}
                    type="button"
                    onClick={() => setType(ft.key)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      selected
                        ? 'border-primary bg-primary-container/20 text-primary shadow-sm'
                        : 'border-surface-variant/30 text-secondary hover:border-primary/40 hover:bg-surface-container-low/50'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-semibold">{t(ft.zh, ft.en)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              {t('反馈内容', 'Feedback Content')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('请详细描述您的反馈（至少10个字符）...', 'Please describe your feedback in detail (at least 10 characters)...')}
              rows={5}
              className="w-full px-4 py-3 rounded-2xl border border-surface-variant/30 bg-surface-container-low dark:bg-surface-container text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
            />
            <p className="text-xs text-secondary mt-1">
              {content.length} / 10 {t('最少字符', 'min chars')}
            </p>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              {t('联系方式（可选）', 'Contact (optional)')}
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t('邮箱或其他联系方式', 'Email or other contact info')}
              className="w-full px-4 py-3 rounded-2xl border border-surface-variant/30 bg-surface-container-low dark:bg-surface-container text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={content.trim().length < 10}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-2xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Send className="w-5 h-5" />
            {t('提交反馈', 'Submit Feedback')}
          </button>
        </form>
      </motion.section>

      {/* Recent feedbacks */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-3">
            <Inbox className="w-6 h-6 text-primary" />
            {t('最近反馈', 'Recent Feedbacks')}
          </h2>
          {feedbacks.length > 0 && (
            <button
              onClick={exportFeedbacksAsJson}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary bg-primary-container/20 hover:bg-primary-container/40 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('导出 JSON', 'Export JSON')}
            </button>
          )}
        </div>

        {feedbacks.length === 0 ? (
          <div className="bg-white dark:bg-surface-container-high rounded-3xl shadow-sm border border-surface-variant/30 p-12 text-center">
            <Inbox className="w-16 h-16 text-secondary/30 mx-auto mb-4" />
            <p className="text-secondary text-lg font-medium">
              {t('暂无反馈记录', 'No feedbacks yet')}
            </p>
            <p className="text-secondary/60 text-sm mt-2">
              {t('提交第一条反馈吧！', 'Be the first to share your feedback!')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-surface-container-high rounded-2xl shadow-sm border border-surface-variant/30 p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-primary-container/30 text-primary">
                    {typeLabel(item)}
                  </span>
                  <time className="text-xs text-secondary shrink-0">
                    {new Date(item.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="text-on-surface leading-relaxed whitespace-pre-wrap">{item.content}</p>
                {item.contact && (
                  <p className="text-xs text-secondary mt-2">
                    {t('联系方式:', 'Contact:')} {item.contact}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Footer */}
      <motion.footer variants={itemVariants} className="text-center mt-16 text-secondary text-sm">
        <p>{t('所有反馈均保存在本地浏览器中。', 'All feedbacks are stored locally in your browser.')}</p>
      </motion.footer>
    </motion.div>
  );
}
