import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CatalogItemCard from '../components/CatalogItemCard';
import type { AppItem } from '../types/app';

const item: AppItem = {
  id: 'tool-test',
  type: 'tool',
  title: '测试工具',
  titleEn: 'Test Tool',
  description: '用于测试卡片',
  descriptionEn: 'Used to test cards',
  category: '日常实用',
  categoryEn: 'Daily',
  tags: ['test'],
  icon: 'T',
  iconBg: 'bg-primary-container',
  route: '/tools/test',
};

const t = (zh: string) => zh;

describe('CatalogItemCard', () => {
  it('renders translated item content and a route action', () => {
    render(
      <MemoryRouter>
        <CatalogItemCard
          item={item}
          actionLabel="打开工具"
          to={item.route}
          isFavorite={false}
          onFavorite={vi.fn()}
          t={t}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('article', { name: '测试工具' })).not.toBeNull();
    expect(screen.getByRole('link', { name: /打开工具/ }).getAttribute('href')).toBe('/tools/test');
    expect(screen.getByText('日常实用')).not.toBeNull();
  });

  it('calls favorite and action handlers for button cards', () => {
    const onFavorite = vi.fn();
    const onAction = vi.fn();

    render(
      <MemoryRouter>
        <CatalogItemCard
          item={item}
          actionLabel="立即使用"
          isFavorite
          onFavorite={onFavorite}
          onAction={onAction}
          t={t}
        />
      </MemoryRouter>,
    );

    screen.getByRole('button', { name: '取消收藏' }).click();
    screen.getByRole('button', { name: /立即使用/ }).click();

    expect(onFavorite).toHaveBeenCalledWith(item.id);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
