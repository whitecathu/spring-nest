import {
  Shield,
  Eye,
  Database,
  Globe,
  Cookie,
  UserCheck,
  Mail,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import SEO from '../components/SEO';

interface SectionProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

function Section({ icon, title, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-surface-container-high rounded-3xl shadow-sm border border-surface-variant/30 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-surface-container-low/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-container/30 flex items-center justify-center text-primary">
            {icon}
          </div>
          <h2 className="text-xl font-bold text-on-surface">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-secondary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-secondary" />
        )}
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="px-6 pb-6"
        >
          <div className="text-on-surface-variant leading-relaxed space-y-4">{children}</div>
        </motion.div>
      )}
    </div>
  );
}

export default function Privacy() {
  const { t } = useUser();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
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
      <SEO
        title={t('隐私政策 - Spring Nest 春日小筑', 'Privacy Policy - Spring Nest')}
        description={t(
          '了解春日小筑如何以本地优先方式处理收藏、最近使用、游戏分数、反馈入口和联网工具数据。',
          'Learn how Spring Nest handles favorites, recent items, game scores, feedback links, and networked tools with a local-first approach.',
        )}
        canonical="/privacy"
      />
      {/* Header */}
      <motion.header variants={itemVariants} className="text-center mb-16">
        <div className="w-20 h-20 bg-primary-container/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-on-surface mb-4">
          {t('隐私政策', 'Privacy Policy')}
        </h1>
        <p className="text-secondary text-lg">
          {t('最后更新: 2026年5月', 'Last updated: May 2026')}
        </p>
        <p className="text-on-surface-variant mt-4 max-w-2xl mx-auto">
          {t(
            '春日小筑以本地优先为原则：大多数工具和小游戏无需登录，收藏、最近使用和游戏分数主要保存在你的浏览器中。',
            'Spring Nest is local-first: most tools and games do not require sign-in, and favorites, recent items, and game scores are mainly stored in your browser.',
          )}
        </p>
      </motion.header>

      {/* Sections */}
      <div className="space-y-4">
        <motion.div variants={itemVariants}>
          <Section
            icon={<Eye className="w-5 h-5" />}
            title={t('信息收集', 'Information Collection')}
            defaultOpen={true}
          >
            <p>{t('我们收集的信息包括:', 'The information we collect includes:')}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>{t('账户信息:', 'Account Information:')}</strong>
                {t(
                  '当您注册时，我们会收集您的邮箱地址和用户名。',
                  'When you register, we collect your email address and username.',
                )}
              </li>
              <li>
                <strong>{t('使用数据:', 'Usage Data:')}</strong>
                {t(
                  '我们会记录您使用工具和游戏的偏好、分数和收藏内容。',
                  'We record your tool and game preferences, scores, and favorites.',
                )}
              </li>
            </ul>
            <p className="text-sm text-secondary mt-4">
              {t(
                '默认情况下，这些数据保存在您浏览器的 localStorage 中。若站点管理员显式配置 Supabase，同步类功能才可能把登录资料、收藏、分数或设置同步到对应服务。我们不主动要求真实姓名、电话号码、地址等敏感个人信息。',
                'By default, this data is stored in your browser localStorage. If a site owner explicitly configures Supabase, sync features may send login profile data, favorites, scores, or settings to that service. We do not proactively require sensitive personal data such as real name, phone number, or address.',
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<Database className="w-5 h-5" />}
            title={t('信息使用', 'Information Usage')}
          >
            <p>{t('我们收集的信息将用于:', 'The information we collect will be used to:')}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                {t('提供、维护和改进我们的服务', 'Provide, maintain, and improve our services')}
              </li>
              <li>{t('创建和管理您的账户', 'Create and manage your account')}</li>
              <li>
                {t(
                  '保存您的偏好设置（如主题、语言）',
                  'Save your preferences (such as theme, language)',
                )}
              </li>
              <li>{t('记录您的游戏分数和成就', 'Record your game scores and achievements')}</li>
              <li>
                {t(
                  '在您的浏览器本地提供数据存储和访问功能',
                  'Provide local data storage and access functionality in your browser',
                )}
              </li>
            </ul>
            <p className="text-sm text-secondary mt-4">
              {t(
                '所有数据仅在您的浏览器本地使用，不会用于广告推送或出售给第三方。',
                'All data is used only locally in your browser and will not be used for advertising or sold to third parties.',
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<Database className="w-5 h-5" />}
            title={t('信息存储与安全', 'Information Storage & Security')}
          >
            <p>
              {t(
                '收藏、最近使用、本地最高分和偏好设置默认存储在您浏览器的 localStorage 中。您可以通过清除浏览器数据来删除这些本地记录。',
                'Favorites, recent items, local high scores, and preferences are stored in your browser localStorage by default. You can delete these local records by clearing browser data.',
              )}
            </p>
            <p>{t('我们采取以下安全措施:', 'We take the following security measures:')}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                {t(
                  '所有数据仅存储在您的设备上，不经过任何第三方服务器',
                  'All data is stored only on your device and does not pass through any third-party servers',
                )}
              </li>
              <li>
                {t(
                  '不收集、不上传、不共享您的个人数据',
                  'We do not collect, upload, or share your personal data',
                )}
              </li>
              <li>
                {t(
                  '您可以随时通过浏览器设置清除所有本地数据',
                  'You can clear all local data at any time through your browser settings',
                )}
              </li>
            </ul>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<Globe className="w-5 h-5" />}
            title={t('第三方服务', 'Third-Party Services')}
          >
            <p>
              {t(
                '大多数功能不需要第三方处理。少数明确联网的功能会请求外部服务，且仅用于完成当前功能。',
                'Most features do not need third-party processing. A few clearly networked features request external services only to complete the current task.',
              )}
            </p>
            <div className="bg-surface-container-low dark:bg-surface-container rounded-2xl p-4 mt-2">
              <h4 className="font-bold text-on-surface mb-2">Cloudflare Pages / Static hosting</h4>
              <p className="text-sm">
                {t(
                  '仅用于网站托管和部署，不涉及任何用户数据的处理或存储。',
                  'Used only for website hosting and deployment, without any processing or storage of user data.',
                )}
              </p>
            </div>
            <div className="bg-surface-container-low dark:bg-surface-container rounded-2xl p-4 mt-2">
              <h4 className="font-bold text-on-surface mb-2">
                wttr.in / ipapi.co / Google Fonts / Supabase
              </h4>
              <p className="text-sm">
                {t(
                  '天气工具会请求 wttr.in，IP 查询会请求 ipapi.co，字体可能来自 Google Fonts。Supabase 只有在站点配置了公开环境变量时才启用。',
                  'Weather requests wttr.in, IP Lookup requests ipapi.co, and fonts may load from Google Fonts. Supabase is enabled only when public environment variables are configured.',
                )}
              </p>
            </div>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<Cookie className="w-5 h-5" />}
            title={t('Cookie 与本地存储', 'Cookies & Local Storage')}
          >
            <p>
              {t(
                '我们不使用传统的 Cookie 追踪技术。我们使用浏览器的 localStorage 来存储您的所有应用数据，包括:',
                "We do not use traditional cookie tracking technologies. We use the browser's localStorage to store all your application data, including:",
              )}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t('登录状态和用户信息', 'Login status and user information')}</li>
              <li>{t('主题和语言偏好', 'Theme and language preferences')}</li>
              <li>{t('收藏列表', 'Favorites list')}</li>
              <li>{t('游戏分数和进度', 'Game scores and progress')}</li>
              <li>{t('工具使用记录', 'Tool usage records')}</li>
              <li>{t('反馈记录', 'Feedback records')}</li>
            </ul>
            <p className="text-sm text-secondary mt-4">
              {t(
                '所有数据均保存在您的设备上，您可以随时通过清除浏览器数据来删除这些信息。',
                'All data is stored on your device. You can delete this information at any time by clearing your browser data.',
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section icon={<UserCheck className="w-5 h-5" />} title={t('您的权利', 'Your Rights')}>
            <p>{t('您享有以下权利:', 'You have the following rights:')}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>{t('访问权:', 'Right of Access:')}</strong>
                {t(
                  '您可以随时查看您的个人信息和使用数据。',
                  'You can view your personal information and usage data at any time.',
                )}
              </li>
              <li>
                <strong>{t('更正权:', 'Right of Rectification:')}</strong>
                {t(
                  '您可以在个人中心修改您的用户名、邮箱等信息。',
                  'You can modify your username, email, and other information in your profile.',
                )}
              </li>
              <li>
                <strong>{t('删除权:', 'Right of Deletion:')}</strong>
                {t(
                  '您可以清除浏览器数据来删除所有本地存储的信息。',
                  'You can clear your browser data to delete all locally stored information.',
                )}
              </li>
              <li>
                <strong>{t('数据导出权:', 'Right of Data Portability:')}</strong>
                {t('您可以请求导出您的所有数据。', 'You can request to export all your data.')}
              </li>
              <li>
                <strong>{t('撤回同意权:', 'Right to Withdraw Consent:')}</strong>
                {t(
                  '您可以随时停止使用我们的服务并删除本地数据。',
                  'You can stop using our services and delete local data at any time.',
                )}
              </li>
            </ul>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<Shield className="w-5 h-5" />}
            title={t('未成年人保护', 'Protection of Minors')}
          >
            <p>
              {t(
                '我们的服务面向所有年龄段的用户。如果您是未满 18 周岁的未成年人，请在监护人的陪同下阅读本政策，并在监护人同意后使用我们的服务。',
                'Our services are available to users of all ages. If you are a minor under 18, please read this policy with your guardian and use our services with their consent.',
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section icon={<Shield className="w-5 h-5" />} title={t('政策更新', 'Policy Updates')}>
            <p>
              {t(
                '我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，并注明最新更新日期。重大变更时，我们会通过应用内通知的方式告知您。',
                'We may update this privacy policy from time to time. The updated policy will be published on this page with the latest update date. For significant changes, we will notify you through in-app notifications.',
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section icon={<Mail className="w-5 h-5" />} title={t('联系我们', 'Contact Us')}>
            <p>
              {t(
                '如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们:',
                'If you have any questions, comments, or suggestions about this privacy policy, please contact us through:',
              )}
            </p>
            <div className="bg-surface-container-low dark:bg-surface-container rounded-2xl p-4 mt-2">
              <p className="font-medium text-on-surface">
                {t('邮箱:', 'Email:')} hello@springnest.com
              </p>
            </div>
          </Section>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer variants={itemVariants} className="text-center mt-16 text-secondary text-sm">
        <p>
          {t(
            '本隐私政策自发布之日起生效。',
            'This privacy policy is effective from the date of publication.',
          )}
        </p>
      </motion.footer>
    </motion.div>
  );
}
