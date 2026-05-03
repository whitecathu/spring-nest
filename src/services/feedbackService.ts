const STORAGE_KEY = 'spring_nest_feedbacks';

export interface FeedbackItem {
  id: string;
  type: 'bug' | 'suggestion' | 'experience' | 'feature';
  content: string;
  contact: string;
  pageUrl: string;
  userAgent: string;
  createdAt: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadFeedbacks(): FeedbackItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed as FeedbackItem[];
  } catch {
    return [];
  }
}

function saveFeedbacks(feedbacks: FeedbackItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks));
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

export function submitFeedback(data: {
  type: 'bug' | 'suggestion' | 'experience' | 'feature';
  content: string;
  contact?: string;
}): FeedbackItem {
  const item: FeedbackItem = {
    id: generateId(),
    type: data.type,
    content: data.content,
    contact: data.contact ?? '',
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,
    createdAt: new Date().toISOString(),
  };

  const feedbacks = loadFeedbacks();
  feedbacks.unshift(item);
  saveFeedbacks(feedbacks);

  return item;
}

export function getAllFeedbacks(): FeedbackItem[] {
  return loadFeedbacks();
}

export function exportFeedbacksAsJson(): void {
  const feedbacks = loadFeedbacks();
  const json = JSON.stringify(feedbacks, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spring-nest-feedbacks-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
