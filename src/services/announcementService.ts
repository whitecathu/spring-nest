import { supabase } from '../lib/supabase';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  platforms: string[];
}

export async function fetchActiveAnnouncements(platform = 'web'): Promise<Announcement[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, body, severity, platforms')
    .contains('platforms', [platform])
    .order('starts_at', { ascending: false })
    .limit(3);

  if (error || !data) return [];
  return data as Announcement[];
}
