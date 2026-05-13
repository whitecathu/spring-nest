import { Mail, MessageSquare, ExternalLink, ShieldCheck, Github, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import SEO from '../components/SEO';
import { useUser } from '../contexts/UserContext';

const FEEDBACK_EMAIL = 'hello@springnest.com';
const FEEDBACK_URL = import.meta.env.VITE_FEEDBACK_URL as string | undefined;

export default function Feedback() {
  const { t } = useUser();
  const mailSubject = encodeURIComponent(t('Spring Nest 反馈建议', 'Spring Nest feedback'));
  const mailBody = encodeURIComponent(t(
    '请在这里写下你的反馈。不要发送密码、身份证号、银行卡号或其他敏感信息。',
    'Please write your feedback here. Do not send passwords, government IDs, card numbers, or other sensitive information.',
  ));
  const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${mailSubject}&body=${mailBody}`;

  return (
    <motion.main
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-[900px] px-6 py-16"
    >
      <SEO
        title={t('反馈建议 - Spring Nest 春日小筑', 'Feedback - Spring Nest')}
        description={t(
          '通过邮件或配置的反馈入口联系 Spring Nest。本站不提供假提交表单，也不会在页面内收集反馈正文。',
          'Contact Spring Nest by email or a configured feedback link. This site does not provide a fake submit form or collect feedback text in-page.',
        )}
        canonical="/feedback"
      />

      <header className="mb-10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-container/30 text-primary">
          <MessageSquare className="h-10 w-10" />
        </div>
        <h1 className="mb-4 text-4xl font-black text-on-surface">
          {t('反馈建议', 'Feedback')}
        </h1>
        <p className="mx-auto max-w-2xl text-on-surface-variant">
          {t(
            '当前没有后端反馈系统，因此这里不会显示“提交成功”的假表单。你可以通过邮件客户端或配置的公开反馈链接发送建议。',
            'There is no backend feedback system right now, so this page avoids a fake “submitted” form. You can send feedback through your email client or a configured public feedback link.',
          )}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <a
          href={mailto}
          className="rounded-2xl border border-surface-variant/30 bg-white p-6 transition-colors hover:border-primary/40 hover:bg-primary-container/10 dark:bg-surface-container-high"
        >
          <Mail className="mb-4 h-7 w-7 text-primary" />
          <h2 className="mb-2 text-xl font-bold text-on-surface">
            {t('发送邮件', 'Send email')}
          </h2>
          <p className="text-sm leading-relaxed text-secondary">
            {t('会打开你的邮件客户端。邮件内容只会由你主动发送，不会先保存在本站。', 'This opens your email client. The message is sent only when you choose to send it, and is not stored by this site first.')}
          </p>
        </a>

        {FEEDBACK_URL ? (
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-surface-variant/30 bg-white p-6 transition-colors hover:border-primary/40 hover:bg-primary-container/10 dark:bg-surface-container-high"
          >
            <Github className="mb-4 h-7 w-7 text-primary" />
            <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-on-surface">
              {t('公开反馈入口', 'Public feedback link')}
              <ExternalLink className="h-4 w-4" />
            </h2>
            <p className="text-sm leading-relaxed text-secondary">
              {t('打开配置的反馈页面，例如 GitHub Issues。请先确认页面说明再提交。', 'Opens the configured feedback page, such as GitHub Issues. Review that page before submitting.')}
            </p>
          </a>
        ) : (
          <div className="rounded-2xl border border-dashed border-surface-variant/60 bg-surface-container-low p-6">
            <Lightbulb className="mb-4 h-7 w-7 text-primary" />
            <h2 className="mb-2 text-xl font-bold text-on-surface">
              {t('可配置反馈链接', 'Configurable feedback link')}
            </h2>
            <p className="text-sm leading-relaxed text-secondary">
              {t('如需使用 GitHub Issues 或其他公开反馈入口，可通过 VITE_FEEDBACK_URL 配置。', 'To use GitHub Issues or another public feedback destination, set VITE_FEEDBACK_URL.')}
            </p>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-surface-variant/30 bg-white p-6 dark:bg-surface-container-high">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-on-surface">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {t('隐私提醒', 'Privacy note')}
        </h2>
        <ul className="space-y-2 text-sm leading-relaxed text-secondary">
          <li>{t('不要发送密码、验证码、证件号码、银行卡号或工具输入正文。', 'Do not send passwords, verification codes, IDs, card numbers, or tool input text.')}</li>
          <li>{t('邮件会交给你的邮件服务商处理，不由本站收集。', 'Email is handled by your email provider, not collected by this site.')}</li>
          <li>{t('如果某个工具需要联网，页面会按功能说明告知。', 'If a tool requires network access, its page should say so in the feature notes.')}</li>
        </ul>
      </section>
    </motion.main>
  );
}

