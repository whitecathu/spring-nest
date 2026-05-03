export type AppItemType = 'game' | 'tool';

export interface AppItem {
  id: string;
  type: AppItemType;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  category: string;
  categoryEn: string;
  tags: string[];
  image?: string;
  icon?: string;
  iconBg?: string;
  route: string;
}
