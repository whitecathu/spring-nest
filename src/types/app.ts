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
  instructions?: string;
  instructionsEn?: string;
  features?: string[];
  featuresEn?: string[];
  related?: string[];
  featured?: boolean;
  isNew?: boolean;
  popularScore?: number;
  catalogSortOrder?: number;
  catalogAnnouncement?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: string;
  estimatedTimeEn?: string;
  faq?: { q: string; a: string; qEn?: string; aEn?: string }[];
}

export interface RecentItem {
  type: AppItemType;
  id: string;
  title: string;
  titleEn: string;
  icon?: string;
  route: string;
  visitedAt: number;
}
