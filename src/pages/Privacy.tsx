import { Shield, Eye, Database, Globe, Cookie, UserCheck, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { useUser } from '../contexts/UserContext';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
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
          <div className="text-on-surface-variant leading-relaxed space-y-4">
            {children}
          </div>
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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-[900px] mx-auto px-6 py-16 w-full"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="text-center mb-16">
        <div className="w-20 h-20 bg-primary-container/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-on-surface mb-4">
          {t('隐私政策', 'Privacy Policy')}
        </h1>
        <p className="text-secondary text-lg">
          {t('最后更新: 2025年1月', 'Last updated: January 2025')}
        </p>
        <p className="text-on-surface-variant mt-4 max-w-2xl mx-auto">
          {t(
            '春日小筑（以下简称"我们"）深知个人信息对您的重要性，我们将按照法律法规要求，采取相应安全保护措施来保护您的个人信息。',
            'Spring Nest (hereinafter "we") understands the importance of your personal information and will take appropriate security measures to protect it in accordance with laws and regulations.'
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
                {t('当您注册时，我们会收集您的邮箱地址和用户名。', 'When you register, we collect your email address and username.')}
              </li>
              <li>
                <strong>{t('使用数据:', 'Usage Data:')}</strong>
                {t('我们会记录您使用工具和游戏的偏好、分数和收藏内容。', 'We record your tool and game preferences, scores, and favorites.')}
              </li>
              <li>
                <strong>{t('设备信息:', 'Device Information:')}</strong>
                {t('我们可能会收集您的设备类型、浏览器版本和操作系统信息，以优化用户体验。', 'We may collect your device type, browser version, and operating system information to optimize user experience.')}
              </li>
            </ul>
            <p className="text-sm text-secondary mt-4">
              {t('我们不会收集您的真实姓名、电话号码、地址等敏感个人信息。', 'We do not collect sensitive personal information such as your real name, phone number, or address.')}
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
              <li>{t('提供、维护和改进我们的服务', 'Provide, maintain, and improve our services')}</li>
              <li>{t('创建和管理您的账户', 'Create and manage your account')}</li>
              <li>{t('保存您的偏好设置（如主题、语言）', 'Save your preferences (such as theme, language)')}</li>
              <li>{t('记录您的游戏分数和成就', 'Record your game scores and achievements')}</li>
              <li>{t('同步您的数据到云端，实现跨设备访问', 'Sync your data to the cloud for cross-device access')}</li>
              <li>{t('分析使用情况以改进产品功能', 'Analyze usage to improve product features')}</li>
            </ul>
            <p className="text-sm text-secondary mt-4">
              {t('我们不会将您的个人信息用于广告推送或出售给第三方。', 'We will not use your personal information for advertising or sell it to third parties.')}
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
                '您的数据存储在 Supabase 提供的云端数据库中，Supabase 使用 Amazon Web Services (AWS) 基础设施，数据中心位于美国。',
                'Your data is stored in a cloud database provided by Supabase, which uses Amazon Web Services (AWS) infrastructure with data centers located in the United States.'
              )}
            </p>
            <p>{t('我们采取以下安全措施:', 'We take the following security measures:')}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t('所有数据传输使用 HTTPS 加密', 'All data transmission uses HTTPS encryption')}</li>
              <li>{t('数据库启用行级安全策略 (RLS)，确保用户只能访问自己的数据', 'Database enables Row Level Security (RLS) to ensure users can only access their own data')}</li>
              <li>{t('密码使用 bcrypt 算法加密存储', 'Passwords are encrypted and stored using bcrypt algorithm')}</li>
              <li>{t('定期进行安全审计和漏洞扫描', 'Regular security audits and vulnerability scanning')}</li>
            </ul>
            <p className="text-sm text-secondary mt-4">
              {t('同时，您的部分数据也会保存在浏览器的 localStorage 中，作为离线缓存使用。', 'Meanwhile, some of your data is also saved in the browser\'s localStorage as offline cache.')}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<Globe className="w-5 h-5" />}
            title={t('第三方服务', 'Third-Party Services')}
          >
            <p>{t('我们使用以下第三方服务:', 'We use the following third-party services:')}</p>
            <div className="bg-surface-container-low dark:bg-surface-container rounded-2xl p-4 mt-2">
              <h4 className="font-bold text-on-surface mb-2">Supabase</h4>
              <p className="text-sm">
                {t(
                  '用于用户认证、数据库存储和实时数据同步。Supabase 的隐私政策请参阅: ',
                  'Used for user authentication, database storage, and real-time data sync. Supabase\'s privacy policy: '
                )}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  supabase.com/privacy
                </a>
              </p>
            </div>
            <div className="bg-surface-container-low dark:bg-surface-container rounded-2xl p-4 mt-2">
              <h4 className="font-bold text-on-surface mb-2">Vercel / Netlify</h4>
              <p className="text-sm">
                {t(
                  '用于网站托管和部署。这些服务可能会收集基本的访问日志信息。',
                  'Used for website hosting and deployment. These services may collect basic access log information.'
                )}
              </p>
            </div>
            <p className="text-sm text-secondary mt-4">
              {t('我们不会与第三方共享您的个人身份信息。', 'We do not share your personally identifiable information with third parties.')}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<Cookie className="w-5 h-5" />}
            title={t('Cookie 与本地存储', 'Cookies & Local Storage')}
          >
            <p>
              {t(
                '我们不使用传统的 Cookie 追踪技术。我们使用浏览器的 localStorage 来存储您的偏好设置和应用数据，包括:',
                'We do not use traditional cookie tracking technologies. We use the browser\'s localStorage to store your preferences and application data, including:'
              )}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t('登录状态和用户信息', 'Login status and user information')}</li>
              <li>{t('主题和语言偏好', 'Theme and language preferences')}</li>
              <li>{t('收藏列表', 'Favorites list')}</li>
              <li>{t('游戏分数和进度', 'Game scores and progress')}</li>
            </ul>
            <p className="text-sm text-secondary mt-4">
              {t('您可以随时通过清除浏览器数据来删除这些信息。', 'You can delete this information at any time by clearing your browser data.')}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<UserCheck className="w-5 h-5" />}
            title={t('您的权利', 'Your Rights')}
          >
            <p>{t('您享有以下权利:', 'You have the following rights:')}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>{t('访问权:', 'Right of Access:')}</strong>
                {t('您可以随时查看您的个人信息和使用数据。', 'You can view your personal information and usage data at any time.')}
              </li>
              <li>
                <strong>{t('更正权:', 'Right of Rectification:')}</strong>
                {t('您可以在个人中心修改您的用户名、邮箱等信息。', 'You can modify your username, email, and other information in your profile.')}
              </li>
              <li>
                <strong>{t('删除权:', 'Right of Deletion:')}</strong>
                {t('您可以联系我们删除您的账户和所有相关数据。', 'You can contact us to delete your account and all related data.')}
              </li>
              <li>
                <strong>{t('数据导出权:', 'Right of Data Portability:')}</strong>
                {t('您可以请求导出您的所有数据。', 'You can request to export all your data.')}
              </li>
              <li>
                <strong>{t('撤回同意权:', 'Right to Withdraw Consent:')}</strong>
                {t('您可以随时停止使用我们的服务并删除本地数据。', 'You can stop using our services and delete local data at any time.')}
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
                'Our services are available to users of all ages. If you are a minor under 18, please read this policy with your guardian and use our services with their consent.'
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<Shield className="w-5 h-5" />}
            title={t('政策更新', 'Policy Updates')}
          >
            <p>
              {t(
                '我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，并注明最新更新日期。重大变更时，我们会通过应用内通知的方式告知您。',
                'We may update this privacy policy from time to time. The updated policy will be published on this page with the latest update date. For significant changes, we will notify you through in-app notifications.'
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<Mail className="w-5 h-5" />}
            title={t('联系我们', 'Contact Us')}
          >
            <p>
              {t(
                '如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们:',
                'If you have any questions, comments, or suggestions about this privacy policy, please contact us through:'
              )}
            </p>
            <div className="bg-surface-container-low dark:bg-surface-container rounded-2xl p-4 mt-2">
              <p className="font-medium text-on-surface">{t('邮箱:', 'Email:')} hello@springnest.com</p>
            </div>
          </Section>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer variants={itemVariants} className="text-center mt-16 text-secondary text-sm">
        <p>{t('本隐私政策自发布之日起生效。', 'This privacy policy is effective from the date of publication.')}</p>
      </motion.footer>
    </motion.div>
  );
}
