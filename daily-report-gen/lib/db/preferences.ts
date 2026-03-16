import { createServiceClient } from '@/lib/supabase/server'

export async function getUserPreferences(userId: string, limit = 20): Promise<string[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('user_preferences')
    .select('preference')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data.map(r => r.preference)
}

export async function savePreferences(
  userId: string,
  preferences: string[],
  sourceReportId?: string
) {
  const supabase = createServiceClient()
  const rows = preferences.map(p => ({
    user_id: userId,
    preference: p,
    source_report_id: sourceReportId ?? null,
  }))
  const { error } = await supabase.from('user_preferences').insert(rows)
  if (error) throw error
}
