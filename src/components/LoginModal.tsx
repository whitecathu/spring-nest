import { useState, useEffect, type FormEvent } from 'react';
import { X, Mail, Lock, User as UserIcon, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import {
  supabaseSignUp,
  supabaseSignIn,
  supabaseResetPassword,
  isUsingSupabase,
  sendRegisterOtp,
  verifyRegisterOtp,
} from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string, username: string) => void;
}

type ModalState = 'login' | 'register' | 'forgot_password';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const { t, login, register, refreshUser } = useUser();
  const [modalState, setModalState] = useState<ModalState>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const timer = setTimeout(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpTimer]);

  if (!isOpen) return null;

  const resetForm = () => {
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setUsername('');
    setOtpMode(false);
    setOtpCode('');
    setOtpTimer(0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // OTP verification step
    if (modalState === 'register' && otpMode) {
      if (!otpCode || otpCode.length !== 6) {
        setError(t('请输入 6 位验证码', 'Please enter the 6-digit code'));
        return;
      }
      setLoading(true);
      const result = await verifyRegisterOtp(email, otpCode, password, username);
      setLoading(false);
      if (result.success) {
        const currentUser = refreshUser();
        onLoginSuccess(email, currentUser?.username || username || email.split('@')[0]);
        handleClose();
      } else {
        setError(result.error || t('验证失败', 'Verification failed'));
      }
      return;
    }

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
        // Send OTP instead of direct signUp
        const result = await sendRegisterOtp(email);
        setLoading(false);
        if (result.success) {
          setOtpMode(true);
          setOtpTimer(60);
          setSuccess(t('验证码已发送到邮箱，请查收', 'Verification code sent to your email'));
        } else {
          setError(result.error || t('验证码发送失败', 'Failed to send code'));
        }
      } else {
        const result = await supabaseSignIn(email, password);
        setLoading(false);
        if (result.success) {
          const currentUser = refreshUser();
          onLoginSuccess(email, currentUser?.username || email.split('@')[0]);
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
    setOtpMode(false);
    setOtpCode('');
    setOtpTimer(0);
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0 || loading) return;
    setLoading(true);
    setError('');
    setSuccess('');
    const result = await sendRegisterOtp(email);
    setLoading(false);
    if (result.success) {
      setOtpTimer(60);
      setSuccess(t('验证码已重新发送', 'Verification code resent'));
    } else {
      setError(result.error || t('发送失败', 'Failed to send'));
    }
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

        {(modalState === 'forgot_password' || (modalState === 'register' && otpMode)) && (
          <button
            type="button"
            onClick={() => {
              if (modalState === 'register' && otpMode) {
                setOtpMode(false);
                setOtpCode('');
                setOtpTimer(0);
                setError('');
                setSuccess('');
              } else {
                switchMode('login');
              }
            }}
            className="absolute top-6 left-6 p-2 text-secondary/50 hover:text-primary transition-colors hover:bg-surface-container-highest rounded-full z-50 cursor-pointer"
            aria-label={t('返回', 'Back')}
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
            {modalState === 'register' && otpMode && t('验证邮箱', 'Verify Email')}
            {modalState === 'register' && !otpMode && t('开启数字治愈之旅', 'Start Your Journey')}
            {modalState === 'forgot_password' && t('重置密码', 'Reset Password')}
          </h2>
          <p className="text-center text-on-surface-variant font-medium text-sm mb-8">
            {modalState === 'login' &&
              t('登录 Spring Nest 发现更多美好', 'Log in to discover more')}
            {modalState === 'register' && otpMode &&
              t('验证码已发送，请输入邮箱中的 6 位数字', 'Code sent — enter the 6 digits from your email')}
            {modalState === 'register' && !otpMode &&
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
              {otpMode ? (
                <div className="relative flex items-center group">
                  <ShieldCheck className="absolute left-4 w-5 h-5 text-secondary/50 group-focus-within:text-primary transition-colors pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={t('输入 6 位验证码', 'Enter 6-digit code')}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-surface-container-low border border-surface-variant/50 rounded-2xl py-4 pl-12 pr-4 text-lg font-bold tracking-[0.3em] text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/40 placeholder:tracking-normal placeholder:text-sm placeholder:font-medium"
                    aria-label={t('验证码', 'Verification code')}
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>
              ) : (
                <>
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
                </>
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
                    ? otpMode
                      ? t('验证并注册', 'Verify & Sign Up')
                      : t('获取验证码', 'Get Code')
                    : t('发送重置邮件', 'Send Reset Email')}
            </button>
          </form>

          {otpMode && modalState === 'register' ? (
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary/70 font-medium">
                  {t('没收到验证码？', "Didn't receive the code?")}
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpTimer > 0 || loading}
                  className={`text-sm font-bold transition-colors ${otpTimer > 0 ? 'text-secondary/40 cursor-not-allowed' : 'text-primary hover:text-primary/80 cursor-pointer'}`}
                >
                  {otpTimer > 0
                    ? t(`${otpTimer}s 后重新发送`, `Resend in ${otpTimer}s`)
                    : t('重新发送', 'Resend')}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOtpMode(false);
                  setOtpCode('');
                  setOtpTimer(0);
                  setError('');
                  setSuccess('');
                }}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                {t('更换邮箱', 'Change email')}
              </button>
            </div>
          ) : modalState !== 'forgot_password' ? (
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
