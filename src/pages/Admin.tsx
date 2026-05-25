import { useEffect } from 'react';
import { ExternalLink, Shield } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const adminUrl = import.meta.env.VITE_ADMIN_URL as string | undefined;

export default function Admin() {
  const { t } = useUser();

  useEffect(() => {
    if (adminUrl) {
      window.location.replace(adminUrl);
    }
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-grow flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-container/40 text-primary">
        <Shield className="h-10 w-10" />
      </div>
      <h1 className="mb-3 text-3xl font-black text-on-surface">
        {t('管理台已独立部署', 'Admin console moved')}
      </h1>
      <p className="max-w-2xl text-sm leading-7 text-secondary">
        {t(
          'Spring Nest 前台不再内置 /admin。请使用独立管理台处理用户角色、反馈、公告、统计和工具/游戏运营配置。',
          'The public Spring Nest frontend no longer embeds /admin. Use the independent admin console for roles, feedback, announcements, stats, and catalog operations.',
        )}
      </p>
      {adminUrl ? (
        <a
          href={adminUrl}
          className="mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-sm transition-transform hover:-translate-y-0.5"
        >
          {t('打开独立管理台', 'Open admin console')}
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : (
        <p className="mt-8 rounded-2xl border border-surface-variant/40 bg-white/70 px-5 py-4 text-sm font-semibold text-on-surface-variant dark:bg-surface-container-high/70">
          {t(
            '部署后配置 VITE_ADMIN_URL 即可从此路由自动跳转。',
            'Set VITE_ADMIN_URL after deployment to redirect this route automatically.',
          )}
        </p>
      )}
    </main>
  );
}
