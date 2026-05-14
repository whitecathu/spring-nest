import {
  FileText,
  Users,
  Shield,
  AlertTriangle,
  Scale,
  Clock,
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

export default function Terms() {
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
        title={t('服务条款 - Spring Nest 春日小筑', 'Terms of Service - Spring Nest')}
        description={t(
          '阅读春日小筑在线工具与休闲小游戏的使用规则、责任限制、隐私入口和反馈方式。',
          'Read the usage rules, limitations, privacy entry, and feedback options for Spring Nest tools and games.',
        )}
        canonical="/terms"
      />
      {/* Header */}
      <motion.header variants={itemVariants} className="text-center mb-16">
        <div className="w-20 h-20 bg-primary-container/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
          <FileText className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-on-surface mb-4">
          {t('服务条款', 'Terms of Service')}
        </h1>
        <p className="text-secondary text-lg">
          {t('最后更新: 2025年5月', 'Last updated: May 2025')}
        </p>
        <p className="text-on-surface-variant mt-4 max-w-2xl mx-auto">
          {t(
            '欢迎使用春日小筑。在使用我们的服务之前，请仔细阅读以下服务条款。使用我们的服务即表示您同意遵守这些条款。',
            'Welcome to Spring Nest. Before using our services, please read the following terms of service carefully. By using our services, you agree to comply with these terms.',
          )}
        </p>
      </motion.header>

      {/* Sections */}
      <div className="space-y-4">
        <motion.div variants={itemVariants}>
          <Section
            icon={<FileText className="w-5 h-5" />}
            title={t('服务描述', 'Service Description')}
            defaultOpen={true}
          >
            <p>
              {t(
                '春日小筑是一个汇集实用工具与休闲小游戏的 PWA Web 应用。我们提供的服务包括:',
                'Spring Nest is a PWA web application that brings together practical tools and casual games. Our services include:',
              )}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                {t(
                  '5 个实用工具: 计算器、番茄钟、单位换算、密码生成器、二维码生成器',
                  '5 practical tools: Calculator, Pomodoro Timer, Unit Converter, Password Generator, QR Code Generator',
                )}
              </li>
              <li>
                {t(
                  '3 个休闲游戏: 2048、记忆翻牌、打地鼠',
                  '3 casual games: 2048, Memory Game, Whack-a-Mole',
                )}
              </li>
              <li>
                {t(
                  '用户账户系统: 注册、登录、个人资料管理',
                  'User account system: registration, login, profile management',
                )}
              </li>
              <li>
                {t(
                  '本地数据存储: 收藏、分数和设置均保存在您的设备上',
                  'Local data storage: favorites, scores, and settings are stored on your device',
                )}
              </li>
              <li>
                {t(
                  '个性化设置: 主题切换、语言选择',
                  'Personalization: theme switching, language selection',
                )}
              </li>
            </ul>
            <p className="text-sm text-secondary mt-4">
              {t(
                '我们保留随时修改、暂停或终止任何服务的权利。',
                'We reserve the right to modify, suspend, or terminate any service at any time.',
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<Users className="w-5 h-5" />}
            title={t('用户责任', 'User Responsibilities')}
          >
            <p>{t('使用我们的服务时，您同意:', 'When using our services, you agree to:')}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                {t(
                  '提供真实、准确的注册信息',
                  'Provide truthful and accurate registration information',
                )}
              </li>
              <li>
                {t(
                  '妥善保管您的账户密码，不与他人共享',
                  'Safeguard your account password and not share it with others',
                )}
              </li>
              <li>
                {t(
                  '不利用我们的服务从事任何违法或有害活动',
                  'Not use our services for any illegal or harmful activities',
                )}
              </li>
              <li>
                {t(
                  '不尝试攻击、破坏或干扰我们的服务',
                  'Not attempt to attack, damage, or interfere with our services',
                )}
              </li>
              <li>
                {t(
                  '不使用自动化工具大量访问或滥用我们的服务',
                  'Not use automated tools to access or abuse our services in bulk',
                )}
              </li>
              <li>
                {t(
                  '不侵犯其他用户的权利和隐私',
                  'Not infringe on the rights and privacy of other users',
                )}
              </li>
            </ul>
            <p className="text-sm text-secondary mt-4">
              {t(
                '如发现违规行为，我们有权暂停或终止您的账户。',
                'If violations are found, we reserve the right to suspend or terminate your account.',
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<Shield className="w-5 h-5" />}
            title={t('知识产权', 'Intellectual Property')}
          >
            <p>
              {t(
                '春日小筑的所有内容，包括但不限于软件代码、设计、图标、文字、图片等，均受知识产权法律保护。',
                'All content of Spring Nest, including but not limited to software code, design, icons, text, images, etc., is protected by intellectual property laws.',
              )}
            </p>
            <p>{t('您可以:', 'You may:')}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t('个人使用我们的服务', 'Use our services for personal purposes')}</li>
              <li>{t('分享应用链接到社交媒体', 'Share application links on social media')}</li>
            </ul>
            <p>{t('您不可以:', 'You may not:')}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                {t(
                  '复制、修改或分发我们的代码或内容',
                  'Copy, modify, or distribute our code or content',
                )}
              </li>
              <li>
                {t(
                  '反向工程、反编译或反汇编我们的软件',
                  'Reverse engineer, decompile, or disassemble our software',
                )}
              </li>
              <li>
                {t('移除或修改任何版权声明或标识', 'Remove or modify any copyright notices or标识')}
              </li>
              <li>
                {t(
                  '将我们的服务用于商业目的（未经授权）',
                  'Use our services for commercial purposes (without authorization)',
                )}
              </li>
            </ul>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section icon={<AlertTriangle className="w-5 h-5" />} title={t('免责声明', 'Disclaimer')}>
            <p>
              {t(
                '我们的服务按"现状"和"可用"基础提供。在法律允许的最大范围内，我们不作任何明示或暗示的保证，包括但不限于:',
                'Our services are provided on an "as is" and "as available" basis. To the maximum extent permitted by law, we make no warranties, express or implied, including but not limited to:',
              )}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                {t(
                  '服务的准确性、可靠性或完整性',
                  'The accuracy, reliability, or completeness of the service',
                )}
              </li>
              <li>
                {t('服务不会中断或无错误', 'That the service will be uninterrupted or error-free')}
              </li>
              <li>
                {t(
                  '通过服务获得的结果的准确性',
                  'The accuracy of results obtained through the service',
                )}
              </li>
            </ul>
            <p className="text-sm text-secondary mt-4">
              {t(
                '我们不对因使用或无法使用服务而导致的任何直接、间接、偶然、特殊或后果性损害承担责任。',
                'We shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use or inability to use the service.',
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<Scale className="w-5 h-5" />}
            title={t('责任限制', 'Limitation of Liability')}
          >
            <p>
              {t(
                '在法律允许的最大范围内，春日小筑及其团队成员对以下情况不承担责任:',
                'To the maximum extent permitted by law, Spring Nest and its team members are not liable for:',
              )}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                {t('因不可抗力导致的服务中断', 'Service interruptions caused by force majeure')}
              </li>
              <li>
                {t('因用户设备故障导致的数据丢失', 'Data loss caused by user device failures')}
              </li>
              <li>
                {t('因用户浏览器或设备导致的问题', "Issues caused by user's browser or device")}
              </li>
              <li>
                {t(
                  '因用户操作不当导致的账户安全问题',
                  'Account security issues caused by improper user operations',
                )}
              </li>
            </ul>
            <p className="text-sm text-secondary mt-4">
              {t(
                '我们的总赔偿责任不超过您在过去 12 个月内为使用服务所支付的金额（如有）。',
                'Our total liability shall not exceed the amount you have paid for using the service in the past 12 months (if any).',
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<Clock className="w-5 h-5" />}
            title={t('账户终止', 'Account Termination')}
          >
            <p>{t('您可以随时:', 'You may at any time:')}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t('停止使用我们的服务', 'Stop using our services')}</li>
              <li>
                {t(
                  '清除浏览器数据以删除您的账户信息和所有本地存储的数据',
                  'Clear your browser data to delete your account information and all locally stored data',
                )}
              </li>
            </ul>
            <p>
              {t(
                '我们有权在以下情况下暂停或终止您的账户:',
                'We reserve the right to suspend or terminate your account in the following cases:',
              )}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t('违反本服务条款', 'Violation of these terms of service')}</li>
              <li>{t('从事违法或有害活动', 'Engaging in illegal or harmful activities')}</li>
              <li>
                {t(
                  '长期不活跃（超过 2 年未登录）',
                  'Long-term inactivity (not logged in for over 2 years)',
                )}
              </li>
            </ul>
            <p className="text-sm text-secondary mt-4">
              {t(
                '账户终止后，您的数据将被删除，且无法恢复。',
                'After account termination, your data will be deleted and cannot be recovered.',
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section icon={<Scale className="w-5 h-5" />} title={t('适用法律', 'Governing Law')}>
            <p>
              {t(
                '本服务条款受中华人民共和国法律管辖并按其解释。因本条款引起的任何争议，应首先通过友好协商解决。协商不成的，任何一方均可向有管辖权的人民法院提起诉讼。',
                "These terms of service are governed by and construed in accordance with the laws of the People's Republic of China. Any disputes arising from these terms shall first be resolved through friendly negotiation. If negotiation fails, either party may file a lawsuit with a people's court with jurisdiction.",
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section
            icon={<FileText className="w-5 h-5" />}
            title={t('条款修改', 'Changes to Terms')}
          >
            <p>
              {t(
                '我们保留随时修改本服务条款的权利。修改后的条款将在本页面发布，并注明最新更新日期。重大变更时，我们会通过应用内通知的方式告知您。继续使用我们的服务即表示您接受修改后的条款。',
                'We reserve the right to modify these terms of service at any time. The modified terms will be published on this page with the latest update date. For significant changes, we will notify you through in-app notifications. Continued use of our services constitutes acceptance of the modified terms.',
              )}
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section icon={<Mail className="w-5 h-5" />} title={t('联系我们', 'Contact Us')}>
            <p>
              {t(
                '如果您对本服务条款有任何疑问，请通过以下方式联系我们:',
                'If you have any questions about these terms of service, please contact us through:',
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
            '本服务条款自发布之日起生效。',
            'These terms of service are effective from the date of publication.',
          )}
        </p>
      </motion.footer>
    </motion.div>
  );
}
