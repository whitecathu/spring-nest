import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  User,
  Settings,
  Shield,
  Bell,
  Key,
  LogOut,
  Check,
  ChevronRight,
  Smartphone,
  Globe,
  Moon,
  Sun,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';

type Tab = 'profile' | 'notifications' | 'security' | 'settings';

export default function Profile() {
  const {
    user,
    updateProfile,
    logout,
    language,
    setLanguage,
    syncStatus,
    lastSyncError,
    retrySync,
    t,
  } = useUser();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    updates: false,
    promotions: false,
  });

  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [devices, setDevices] = useState([
    {
      id: '1',
      name: 'iPhone 14 Pro',
      status: 'Online · Just now',
      statusZh: '在线 · 刚刚',
      current: true,
      icon: 'smartphone',
    },
    {
      id: '2',
      name: 'MacBook Pro',
      status: 'Offline · 2 hours ago',
      statusZh: '离线 · 2小时前',
      current: false,
      icon: 'globe',
    },
  ]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isEn = language === 'en';

  const [feedback, setFeedback] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = useCallback(async () => {
    setIsSavingProfile(true);
    const result = await updateProfile({
      username: editUsername,
      bio: editBio,
      email: editEmail,
    });
    setIsSavingProfile(false);
    if (!result.success) {
      setFeedback(result.error || t('个人信息保存失败', 'Failed to save profile'));
    } else if (result.emailConfirmationPending) {
      setFeedback(
        t(
          '个人信息已保存，请前往邮箱确认新地址',
          'Profile saved. Check your inbox to confirm the new email.',
        ),
      );
    } else {
      setFeedback(t('个人信息已保存', 'Profile saved'));
    }
    window.setTimeout(() => setFeedback(''), 5000);
  }, [updateProfile, editUsername, editBio, editEmail, t]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteAccount = () => {
    logout();
    navigate('/');
  };

  const handleLanguageChange = useCallback(
    (lang: 'zh' | 'en') => {
      setLanguage(lang);
    },
    [setLanguage],
  );

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t('请填写所有字段', 'Please fill all fields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('新密码不匹配', 'New passwords do not match'));
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordError(t('新密码长度需为 8–128 位', 'New password must be 8–128 characters'));
      return;
    }
    setFeedback(t('密码修改成功！', 'Password changed!'));
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleRemoveDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
    setFeedback(t('已移除该设备', 'Device removed'));
    setTimeout(() => setFeedback(''), 3000);
  };

  const tabContent = useMemo(
    () => ({
      profile: (
        <div key="profile" className="flex flex-col gap-8">
          <div className="bg-white dark:bg-surface-container-high rounded-3xl p-8 shadow-sm border border-surface-variant/30">
            <h3 className="text-xl font-bold text-on-surface mb-6">
              {t('基本信息', 'Basic Info')}
            </h3>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="profile-username"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  {t('昵称', 'Nickname')}
                </label>
                <input
                  id="profile-username"
                  type="text"
                  minLength={2}
                  maxLength={50}
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full md:w-2/3 bg-surface-container-low dark:bg-surface-container border border-surface-variant/50 rounded-xl py-3 px-4 text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  {t('邮箱', 'Email')}
                </label>
                <input
                  id="profile-email"
                  type="email"
                  maxLength={254}
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full md:w-2/3 bg-surface-container-low dark:bg-surface-container border border-surface-variant/50 rounded-xl py-3 px-4 text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-bio"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  {t('个人简介', 'Bio')}
                </label>
                <textarea
                  id="profile-bio"
                  rows={4}
                  maxLength={500}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder={t('写点什么介绍一下自己吧...', 'Write something about yourself...')}
                  className="w-full bg-surface-container-low dark:bg-surface-container border border-surface-variant/50 rounded-xl py-3 px-4 text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                ></textarea>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="px-8 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-[0_4px_12px_rgba(63,103,81,0.2)] hover:shadow-[0_8px_16px_rgba(63,103,81,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  {isSavingProfile ? t('保存中…', 'Saving…') : t('保存修改', 'Save Changes')}
                </button>
              </div>

              <div
                className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-4 text-sm"
                aria-live="polite"
              >
                <p className="font-semibold text-on-surface">
                  {syncStatus === 'syncing'
                    ? t('云同步中…', 'Syncing…')
                    : syncStatus === 'synced'
                      ? t('云同步已完成', 'Cloud sync complete')
                      : syncStatus === 'error'
                        ? t('云同步失败，本地数据已保留', 'Cloud sync failed; local data is safe')
                        : t('本地优先存储', 'Local-first storage')}
                </p>
                {syncStatus === 'error' && lastSyncError && (
                  <p className="mt-1 text-red-600">{lastSyncError}</p>
                )}
                {syncStatus === 'error' && (
                  <button
                    type="button"
                    onClick={() => void retrySync()}
                    className="mt-3 rounded-xl border border-primary/30 px-4 py-2 font-semibold text-primary hover:bg-primary-container/20"
                  >
                    {t('重试同步', 'Retry sync')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
      notifications: (
        <div key="notifications" className="flex flex-col gap-8">
          <div className="bg-white dark:bg-surface-container-high rounded-3xl p-8 shadow-sm border border-surface-variant/30">
            <h3 className="text-xl font-bold text-on-surface mb-6">
              {t('消息通知', 'Notifications')}
            </h3>
            <p className="text-secondary mb-8">
              {t(
                '选择你希望接收的通知类型，随时把握最新动态。',
                'Choose the types of notifications you want to receive.',
              )}
            </p>

            <div className="space-y-6">
              {[
                {
                  key: 'email' as const,
                  title: t('系统通知', 'System Notifications'),
                  desc: t('安全警报、账号状态等重要信息', 'Security alerts, account status, etc.'),
                },
                {
                  key: 'updates' as const,
                  title: t('更新提醒', 'Update Alerts'),
                  desc: t('应用更新、新功能发布等', 'App updates, new features, etc.'),
                },
                {
                  key: 'promotions' as const,
                  title: t('活动与促销', 'Promotions'),
                  desc: t('春日特惠、限时活动等信息', 'Spring offers, limited-time events, etc.'),
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-4 border-b border-surface-variant/30"
                >
                  <div>
                    <h4 className="font-bold text-on-surface">{item.title}</h4>
                    <p className="text-sm text-secondary">{item.desc}</p>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${notifications[item.key] ? 'bg-primary' : 'bg-surface-variant'}`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notifications[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`}
                    ></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      security: (
        <div key="security" className="flex flex-col gap-8">
          <div className="bg-white dark:bg-surface-container-high rounded-3xl p-8 shadow-sm border border-surface-variant/30">
            <h3 className="text-xl font-bold text-on-surface mb-6">{t('账号安全', 'Security')}</h3>

            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="flex w-full items-center justify-between py-4 border-b border-surface-variant/30 group hover:bg-surface-container/30 rounded-xl px-2 -mx-2 transition-colors text-left"
            >
              <span className="flex gap-4 items-center">
                <span className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                  <Key className="w-5 h-5" />
                </span>
                <span>
                  <span className="block font-bold text-on-surface group-hover:text-primary transition-colors">
                    {t('修改密码', 'Change Password')}
                  </span>
                  <span className="block text-sm text-secondary">
                    {t(
                      '定期更换密码可提高账号安全性',
                      'Regularly changing password improves security',
                    )}
                  </span>
                </span>
              </span>
              <ChevronRight className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => setShowDeviceModal(true)}
              className="flex w-full items-center justify-between py-4 border-b border-surface-variant/30 group hover:bg-surface-container/30 rounded-xl px-2 -mx-2 transition-colors text-left"
            >
              <span className="flex gap-4 items-center">
                <span className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                  <Smartphone className="w-5 h-5" />
                </span>
                <span>
                  <span className="block font-bold text-on-surface group-hover:text-primary transition-colors">
                    {t('设备管理', 'Device Management')}
                  </span>
                  <span className="block text-sm text-secondary">
                    {t(
                      '查看并管理已登录账号的设备',
                      'View and manage devices logged into your account',
                    )}
                  </span>
                </span>
              </span>
              <ChevronRight className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
            </button>
          </div>

          <div className="bg-white dark:bg-surface-container-high rounded-3xl p-8 shadow-sm border border-surface-variant/30">
            <h3 className="text-xl font-bold text-on-surface mb-6 text-red-500">
              {t('危险操作', 'Danger Zone')}
            </h3>
            <p className="text-sm text-secondary mb-6">
              {t(
                '这些操作将永久影响您的帐户，请谨慎操作。',
                'These actions will permanently affect your account, please proceed with caution.',
              )}
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold transition-colors"
            >
              {t('注销账号', 'Delete Account')}
            </button>
          </div>
        </div>
      ),
      settings: (
        <div key="settings" className="flex flex-col gap-8">
          <div className="bg-white dark:bg-surface-container-high rounded-3xl p-8 shadow-sm border border-surface-variant/30">
            <h3 className="text-xl font-bold text-on-surface mb-6">
              {t('外观与语言', 'Appearance & Language')}
            </h3>

            <div className="space-y-8">
              <div>
                <h4 className="font-bold text-on-surface mb-4">{t('主题外观', 'Theme')}</h4>
                <div className="flex gap-4">
                  <button
                    onClick={() => setMode('light')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${mode === 'light' ? 'border-primary bg-primary-container/20 text-primary' : 'border-surface-variant/30 hover:border-primary/50 text-secondary'}`}
                  >
                    <Sun className="w-8 h-8" />
                    <span className="font-semibold text-sm">{t('浅色模式', 'Light')}</span>
                  </button>
                  <button
                    onClick={() => setMode('dark')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${mode === 'dark' ? 'border-primary bg-primary-container/20 text-primary' : 'border-surface-variant/30 hover:border-primary/50 text-secondary'}`}
                  >
                    <Moon className="w-8 h-8" />
                    <span className="font-semibold text-sm">{t('深色模式', 'Dark')}</span>
                  </button>
                  <button
                    onClick={() => setMode('system')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${mode === 'system' ? 'border-primary bg-primary-container/20 text-primary' : 'border-surface-variant/30 hover:border-primary/50 text-secondary'}`}
                  >
                    <Settings className="w-8 h-8" />
                    <span className="font-semibold text-sm">{t('跟随系统', 'System')}</span>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-on-surface mb-4">{t('语言设置', 'Language')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleLanguageChange('zh')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${!isEn ? 'border-primary bg-primary-container/20 text-primary' : 'border-surface-variant/30 hover:border-primary/50 text-secondary hover:text-primary'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5" />
                      <span className="font-semibold text-sm">简体中文</span>
                    </div>
                    {!isEn && <Check className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${isEn ? 'border-primary bg-primary-container/20 text-primary' : 'border-surface-variant/30 hover:border-primary/50 text-secondary hover:text-primary'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5" />
                      <span className="font-semibold text-sm">English</span>
                    </div>
                    {isEn && <Check className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    }),
    [
      editUsername,
      editBio,
      editEmail,
      t,
      handleSaveProfile,
      notifications,
      mode,
      isEn,
      handleLanguageChange,
      setMode,
      isSavingProfile,
      syncStatus,
      lastSyncError,
      retrySync,
    ],
  );

  if (!user) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20 px-6">
        <div className="forest-empty-panel flex max-w-md flex-col items-center px-8 py-12 text-center">
          <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-secondary/30" />
          </div>
          <h1 className="font-nunito text-2xl font-bold forest-page-title mb-2">
            {t('未登录', 'Not Logged In')}
          </h1>
          <p className="forest-page-subtitle text-sm mb-6">
            {t('请先登录以查看个人中心', 'Please log in to view your profile')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold text-sm hover:shadow-lg transition-all"
          >
            {t('返回首页', 'Back to Home')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full max-w-[1000px] mx-auto px-6 py-10 relative">
      {feedback && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-6 py-3 rounded-full shadow-lg font-semibold text-sm">
          {feedback}
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-6">
          <div className="bg-white dark:bg-surface-container-high rounded-3xl p-6 shadow-sm border border-surface-variant/30 flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-primary-container text-primary flex items-center justify-center text-4xl font-bold shadow-inner relative overflow-hidden">
              <span className="relative z-10">{user.username.charAt(0).toUpperCase()}</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
            </div>
            <div className="text-center">
              <h1 className="font-bold text-xl text-on-surface">{user.username}</h1>
              <p className="text-sm text-secondary">{user.email}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-container-high rounded-3xl p-4 shadow-sm border border-surface-variant/30 flex flex-col gap-2">
            {[
              { tab: 'profile' as Tab, icon: User, label: t('个人信息', 'Profile') },
              { tab: 'notifications' as Tab, icon: Bell, label: t('消息通知', 'Notifications') },
              { tab: 'security' as Tab, icon: Shield, label: t('隐私与安全', 'Security') },
              { tab: 'settings' as Tab, icon: Settings, label: t('通用设置', 'Settings') },
            ].map((item) => (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${activeTab === item.tab ? 'bg-primary-container/30 text-primary' : 'hover:bg-surface-container-low text-secondary hover:text-on-surface'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
            <div className="h-px bg-surface-variant/40 my-2"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 font-semibold transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {t('退出账号', 'Log Out')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow">{tabContent[activeTab]}</div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('关闭修改密码弹窗', 'Close change password dialog')}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          />
          <div className="bg-white dark:bg-surface-container-high rounded-3xl p-8 max-w-md w-full relative z-10">
            <button
              onClick={() => setShowPasswordModal(false)}
              aria-label={t('关闭修改密码弹窗', 'Close change password dialog')}
              className="absolute top-4 right-4 text-secondary hover:text-primary"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4">{t('修改密码', 'Change Password')}</h3>
            <div className="space-y-4">
              <input
                aria-label={t('原密码', 'Current Password')}
                type="password"
                minLength={8}
                maxLength={128}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('原密码', 'Current Password')}
                className="w-full bg-surface-container-low dark:bg-surface-container border border-surface-variant/50 rounded-xl py-3 px-4 outline-none focus:border-primary/50"
              />
              <input
                aria-label={t('新密码', 'New Password')}
                type="password"
                minLength={8}
                maxLength={128}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('新密码', 'New Password')}
                className="w-full bg-surface-container-low dark:bg-surface-container border border-surface-variant/50 rounded-xl py-3 px-4 outline-none focus:border-primary/50"
              />
              <input
                aria-label={t('确认新密码', 'Confirm New Password')}
                type="password"
                minLength={8}
                maxLength={128}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('确认新密码', 'Confirm New Password')}
                className="w-full bg-surface-container-low dark:bg-surface-container border border-surface-variant/50 rounded-xl py-3 px-4 outline-none focus:border-primary/50"
              />
              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            </div>
            <button
              onClick={handleChangePassword}
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold mt-6 hover:bg-primary/90 transition-colors"
            >
              {t('确认修改', 'Confirm')}
            </button>
          </div>
        </div>
      )}

      {/* Device Management Modal */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('关闭设备管理弹窗', 'Close device management dialog')}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowDeviceModal(false)}
          />
          <div className="bg-white dark:bg-surface-container-high rounded-3xl p-8 max-w-md w-full relative z-10">
            <button
              onClick={() => setShowDeviceModal(false)}
              aria-label={t('关闭设备管理弹窗', 'Close device management dialog')}
              className="absolute top-4 right-4 text-secondary hover:text-primary"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4">{t('设备管理', 'Device Management')}</h3>
            <div className="space-y-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={`flex items-center justify-between p-4 border border-surface-variant/30 rounded-xl ${device.current ? 'bg-surface-container-lowest dark:bg-surface-container-low' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {device.icon === 'smartphone' ? (
                      <Smartphone
                        className={`w-6 h-6 ${device.current ? 'text-primary' : 'text-secondary'}`}
                      />
                    ) : (
                      <Globe
                        className={`w-6 h-6 ${device.current ? 'text-primary' : 'text-secondary'}`}
                      />
                    )}
                    <div>
                      <h4 className="font-bold text-sm">{device.name}</h4>
                      <p className="text-xs text-secondary">{t(device.statusZh, device.status)}</p>
                    </div>
                  </div>
                  {device.current ? (
                    <span className="text-xs bg-primary-container text-primary px-2 py-1 rounded-md">
                      {t('当前设备', 'Current')}
                    </span>
                  ) : (
                    <button
                      className="text-xs text-red-500 hover:underline"
                      onClick={() => handleRemoveDevice(device.id)}
                    >
                      {t('移除', 'Remove')}
                    </button>
                  )}
                </div>
              ))}
              {devices.length === 0 && (
                <p className="text-center text-secondary text-sm">
                  {t('无其他设备', 'No other devices')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('关闭注销账号弹窗', 'Close delete account dialog')}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="bg-white dark:bg-surface-container-high rounded-3xl p-8 max-w-md w-full relative z-10">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('确认注销账号？', 'Delete Account?')}</h3>
            <p className="text-secondary text-sm mb-6">
              {t(
                '账号注销后，您将无法再访问任何个人数据、收藏和设置。此操作不可撤销，请三思。',
                'If you delete your account, you will lose access to all your personal data, favorites, and settings. This cannot be undone.',
              )}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-surface-container dark:bg-surface-container-high border border-surface-variant rounded-xl font-bold text-on-surface hover:bg-surface-variant transition-colors"
              >
                {t('取消', 'Cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                {t('确认注销', 'Confirm Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
