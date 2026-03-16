import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fileName, contentType } = await req.json()

  const serviceSupabase = createServiceClient()
  const filePath = `uploads/${user.id}/${Date.now()}_${fileName}`

  const { data, error } = await serviceSupabase.storage
    .from('documents')
    .createSignedUploadUrl(filePath)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path: filePath,
    token: data.token,
  })
}
