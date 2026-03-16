import { createServiceClient } from '@/lib/supabase/server'

export async function createReport(userId: string, title: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('reports')
    .insert({ user_id: userId, title, status: 'processing' })
    .select('report_id')
    .single()
  if (error) throw error
  return data.report_id
}

export async function updateReport(reportId: string, updates: {
  status?: string
  content?: { markdown: string; pdfUrl?: string }
  completedAt?: string
}) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('reports')
    .update({
      ...(updates.status && { status: updates.status }),
      ...(updates.content && { content: updates.content }),
      ...(updates.completedAt && { completed_at: updates.completedAt }),
    })
    .eq('report_id', reportId)
  if (error) throw error
}

export async function getUserReports(userId: string, limit = 20) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('reports')
    .select('report_id, title, status, created_at, completed_at, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
