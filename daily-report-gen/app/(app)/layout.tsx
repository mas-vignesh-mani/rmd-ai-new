import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TabNavigation from '@/components/TabNavigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <TabNavigation userEmail={user.email ?? ''} />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        {children}
      </main>
    </div>
  )
}
