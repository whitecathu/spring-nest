import { supabase } from '../lib/supabase';

export type FeedbackCategory = 'general' | 'bug' | 'feature' | 'account' | 'content';

export async function submitFeedbackTicket(input: {
  userId: string;
  subject: string;
  message: string;
  category: FeedbackCategory;
}) {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  const { error } = await supabase.from('feedback_tickets').insert({
    user_id: input.userId,
    subject: input.subject.trim(),
    message: input.message.trim(),
    category: input.category,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
