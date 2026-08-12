import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BookkeepingSyncStatus } from './BookkeepingSyncStatus';

const t = (zh: string, _en: string) => zh;

describe('BookkeepingSyncStatus', () => {
  it.each([
    ['idle', '仅本地保存'],
    ['syncing', '正在同步云端'],
    ['synced', '云端已同步'],
  ] as const)('announces the %s state', (status, label) => {
    render(<BookkeepingSyncStatus t={t} status={status} lastError={null} onRetry={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent(label);
  });

  it('shows a retry action without hiding the cloud error', () => {
    const retry = vi.fn();
    render(
      <BookkeepingSyncStatus
        t={t}
        status="error"
        lastError={{ code: 'PGRST000', message: '网络不可用', retryable: true }}
        onRetry={retry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('网络不可用');
    fireEvent.click(screen.getByRole('button', { name: '重试云同步' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
