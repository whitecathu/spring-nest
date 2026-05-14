import { useState, type FormEvent } from 'react';
import { X, Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import {
  supabaseSignUp,
  supabaseSignIn,
  supabaseResetPassword,
  isUsingSupabase,
} from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string, username: string) => void;
}

type ModalState = 'login' | 'register' | 'forgot_password';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const { t, login, register } = useUser();
  const [modalState, setModalState] = useState<ModalState>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setUsername('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (modalState === 'forgot_password') {
      if (!email) {
        setError(t('请输入邮箱地址', 'Please enter your email address'));
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError(t('邮箱格式不正确', 'Invalid email format'));
        return;
      }

      if (isUsingSupabase()) {
        setLoading(true);
        const result = await supabaseResetPassword(email);
        setLoading(false);
        if (result.success) {
          setSuccess(
            t('密码重置邮件已发送，请查收', 'Password reset email sent. Please check your inbox.'),
          );
        } else {
          setError(result.error || t('发送失败，请稍后重试', 'Failed to send. Please try again.'));
        }
      } else {
        setError(
          t(
            '请使用注册时的邮箱和密码直接登录。本地应用暂不支持密码重置。',
            'Please login directly with your email and password. Password reset is not available in local mode.',
          ),
        );
      }
      return;
    }

    if (!email || !password) {
      setError(t('请填写邮箱和密码', 'Please fill in email and password'));
      return;
    }

    if (isUsingSupabase()) {
      setLoading(true);
      if (modalState === 'register') {
        const result = await supabaseSignUp(email, password, username);
        setLoading(false);
        if (result.success) {
          onLoginSuccess(email, username || email.split('@')[0]);
          handleClose();
        } else {
          setError(result.error || t('注册失败', 'Registration failed'));
        }
      } else {
        const result = await supabaseSignIn(email, password);
        setLoading(false);
        if (result.success) {
          onLoginSuccess(email, email.split('@')[0]);
          handleClose();
        } else {
          setError(result.error || t('登录失败', 'Login failed'));
        }
      }
    } else {
      // localStorage fallback
      if (modalState === 'register') {
        const result = register(email, password, username);
        if (result.success && result.user) {
          onLoginSuccess(email, result.user.username);
          handleClose();
        } else {
          setError(result.error || t('注册失败', 'Registration failed'));
        }
      } else {
        const result = login(email, password);
        if (result.success && result.user) {
          onLoginSuccess(email, result.user.username);
          handleClose();
        } else {
          setError(result.error || t('登录失败', 'Login failed'));
        }
      }
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setModalState('login');
      resetForm();
    }, 300);
  };

  const switchMode = (newState: ModalState) => {
    setModalState(newState);
    setError('');
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity animate-fade-in-up"
        style={{ animationDuration: '0.3s' }}
        onClick={handleClose}
      ></div>

      <div
        className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-primary/10 overflow-hidden animate-fade-in-up"
        style={{ animationDuration: '0.4s' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-container/30 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-tertiary-container/30 rounded-full blur-[80px] pointer-events-none"></div>

        {modalState === 'forgot_password' && (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="absolute top-6 left-6 p-2 text-secondary/50 hover:text-primary transition-colors hover:bg-surface-container-highest rounded-full z-50 cursor-pointer"
            aria-label={t('返回登录', 'Back to login')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 text-secondary/50 hover:text-primary transition-colors hover:bg-surface-container-highest rounded-full z-50 cursor-pointer"
          aria-label={t('关闭', 'Close')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-10 relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-primary-container/50 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <UserIcon className="w-8 h-8" />
            </div>
          </div>

          <h2
            id="login-modal-title"
            className="text-3xl font-bold font-nunito text-center text-on-surface mb-2"
          >
            {modalState === 'login' && t('欢迎回来', 'Welcome Back')}
            {modalState === 'register' && t('开启数字治愈之旅', 'Start Your Journey')}
            {modalState === 'forgot_password' && t('重置密码', 'Reset Password')}
          </h2>
          <p className="text-center text-on-surface-variant font-medium text-sm mb-8">
            {modalState === 'login' &&
              t('登录 Spring Nest 发现更多美好', 'Log in to discover more')}
            {modalState === 'register' &&
              t('注册 Spring Nest 享受宁静时光', 'Sign up to enjoy peaceful moments')}
            {modalState === 'forgot_password' &&
              (isUsingSupabase()
                ? t(
                    '输入邮箱地址，我们将发送密码重置链接',
                    "Enter your email and we'll send a password reset link",
                  )
                : t(
                    '本地应用暂不支持密码重置，请直接登录',
                    'Password reset is not available for local apps',
                  ))}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm font-medium text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {modalState === 'register' && (
                <div className="relative flex items-center group">
                  <UserIcon className="absolute left-4 w-5 h-5 text-secondary/50 group-focus-within:text-primary transition-colors pointer-events-none" />
                  <input
                    type="text"
                    placeholder={t('用户名（可选）', 'Username (optional)')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-variant/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/40"
                    aria-label={t('用户名（可选）', 'Username (optional)')}
                  />
                </div>
              )}
              <div className="relative flex items-center group">
                <Mail className="absolute left-4 w-5 h-5 text-secondary/50 group-focus-within:text-primary transition-colors pointer-events-none" />
                <input
                  type="email"
                  placeholder={t('邮箱地址', 'Email Address')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border border-surface-variant/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/40"
                  aria-label={t('邮箱地址', 'Email Address')}
                  required
                />
              </div>
              {modalState !== 'forgot_password' && (
                <div className="relative flex items-center group">
                  <Lock className="absolute left-4 w-5 h-5 text-secondary/50 group-focus-within:text-primary transition-colors pointer-events-none" />
                  <input
                    type="password"
                    placeholder={t('密码 (6位以上)', 'Password (min 6 characters)')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-variant/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/40"
                    aria-label={t('密码', 'Password')}
                    required
                    minLength={6}
                  />
                </div>
              )}
            </div>

            {modalState === 'login' && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => switchMode('forgot_password')}
                  className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  {t('忘记密码？', 'Forgot Password?')}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold text-base shadow-[0_8px_20px_rgba(63,103,81,0.2)] hover:shadow-[0_12px_25px_rgba(63,103,81,0.3)] hover:-translate-y-0.5 transition-all duration-300 mt-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t('处理中...', 'Processing...')
                : modalState === 'login'
                  ? t('登录', 'Log In')
                  : modalState === 'register'
                    ? t('注册', 'Sign Up')
                    : t('发送重置邮件', 'Send Reset Email')}
            </button>
          </form>

          {modalState !== 'forgot_password' && (
            <>
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => switchMode(modalState === 'login' ? 'register' : 'login')}
                  className="text-sm font-semibold text-secondary hover:text-primary transition-colors"
                >
                  {modalState === 'login'
                    ? t('没有账号？去注册', 'No account? Sign up')
                    : t('已有账号？去登录', 'Have an account? Log in')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
