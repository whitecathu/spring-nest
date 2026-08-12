import { useState, type FormEvent } from 'react';
import { CheckCircle2, CloudOff, Mail, MessageSquare, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import SEO from '../components/SEO';
import { useUser } from '../contexts/UserContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { submitFeedbackTicket, type FeedbackCategory } from '../services/feedbackService';

const FEEDBACK_EMAIL = 'hello@springnest.com';
const categories: { value: FeedbackCategory; label: string; labelEn: string }[] = [
  { value: 'general', label: '一般反馈', labelEn: 'General' },
  { value: 'bug', label: '问题反馈', labelEn: 'Bug' },
  { value: 'feature', label: '功能建议', labelEn: 'Feature' },
  { value: 'account', label: '账号与同步', labelEn: 'Account' },
  { value: 'content', label: '工具/游戏内容', labelEn: 'Content' },
];

export default function Feedback() {
  const { t, user } = useUser();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent'>('idle');
  const [error, setError] = useState('');
  const configured = isSupabaseConfigured();

  const mailSubject = encodeURIComponent(t('Spring Nest 反馈建议', 'Spring Nest feedback'));
  const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${mailSubject}`;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setError(t('请先登录后再提交反馈。', 'Please sign in before submitting feedback.'));
      return;
    }
    if (subject.trim().length < 2 || message.trim().length < 5) {
      setError(t('请填写标题和至少 5 个字符的内容。', 'Add a subject and at least 5 characters.'));
      return;
    }

    setStatus('submitting');
    setError('');
    const result = await submitFeedbackTicket({
      userId: user.id,
      subject,
      message,
      category,
    });
    setStatus(result.success ? 'sent' : 'idle');
    if (result.success) {
      setSubject('');
      setMessage('');
      setCategory('general');
    } else {
      setError(result.error || t('提交失败，请稍后重试。', 'Submit failed. Try again later.'));
    }
  };

  return (
    <main className="mx-auto w-full max-w-[900px] px-6 py-16">
      <SEO
        title={t('反馈建议 - Spring Nest 春日小筑', 'Feedback - Spring Nest')}
        description={t(
          '登录后向 Spring Nest 提交反馈工单，管理员可在独立管理台处理。',
          'Submit Spring Nest feedback tickets after signing in. Admins handle them in the independent console.',
        )}
        canonical="/feedback"
      />

      <header className="mb-10 text-center forest-readable-hero py-6">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-container/50 text-primary shadow-sm">
          <MessageSquare className="h-10 w-10" />
        </div>
        <h1 className="mb-4 text-4xl font-black forest-page-title">{t('反馈建议', 'Feedback')}</h1>
        <p className="mx-auto max-w-2xl forest-page-subtitle">
          {t(
            '登录后提交的反馈会进入共享 Supabase 后端，管理员可在独立管理台跟进处理。',
            'Signed-in feedback goes to the shared Supabase backend for admin triage.',
          )}
        </p>
      </header>

      {!configured ? (
        <section className="rounded-2xl border border-surface-variant/30 bg-white p-6 dark:bg-surface-container-high">
          <CloudOff className="mb-4 h-7 w-7 text-primary" />
          <h2 className="mb-2 text-xl font-bold text-on-surface">
            {t('云反馈未启用', 'Cloud feedback is off')}
          </h2>
          <p className="text-sm leading-relaxed text-secondary">
            {t(
              '配置 Supabase 后会显示站内反馈表单。当前可通过邮件发送建议。',
              'Configure Supabase to enable the in-app ticket form. You can send email for now.',
            )}
          </p>
          <a
            href={mailto}
            className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-on-primary"
          >
            <Mail className="h-4 w-4" />
            {t('发送邮件', 'Send email')}
          </a>
        </section>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-surface-variant/30 bg-white p-6 shadow-sm dark:bg-surface-container-high"
        >
          {!user && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              {t(
                '反馈提交需要登录。你仍可浏览和使用基础功能。',
                'Feedback requires sign-in. Core browsing and tools still work.',
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <label className="grid gap-2 text-sm font-semibold text-on-surface">
              {t('标题', 'Subject')}
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={120}
                className="min-h-[48px] rounded-2xl border border-surface-variant/50 bg-surface-container-low px-4 text-on-surface outline-none focus:border-primary"
                placeholder={t('简短描述你的反馈', 'Short feedback summary')}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-on-surface">
              {t('类型', 'Category')}
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
                className="min-h-[48px] rounded-2xl border border-surface-variant/50 bg-surface-container-low px-4 text-on-surface outline-none focus:border-primary"
              >
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.label, item.labelEn)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-5 grid gap-2 text-sm font-semibold text-on-surface">
            {t('内容', 'Message')}
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={7}
              maxLength={4000}
              className="rounded-2xl border border-surface-variant/50 bg-surface-container-low px-4 py-3 text-on-surface outline-none focus:border-primary"
              placeholder={t(
                '请描述问题、建议、复现步骤或涉及的工具/游戏。',
                'Describe the issue, suggestion, steps, or related tool/game.',
              )}
            />
          </label>

          {error && <p className="mt-4 text-sm font-semibold text-red-500">{error}</p>}
          {status === 'sent' && (
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              {t('反馈已提交。', 'Feedback submitted.')}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs leading-5 text-secondary">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {t(
                '不要提交密码、验证码、证件号、银行卡号或工具输入正文。',
                'Do not submit passwords, codes, IDs, card numbers, or tool input text.',
              )}
            </p>
            <button
              type="submit"
              disabled={!user || status === 'submitting'}
              className="min-h-[48px] rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-on-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'submitting' ? t('提交中...', 'Submitting...') : t('提交反馈', 'Submit')}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
