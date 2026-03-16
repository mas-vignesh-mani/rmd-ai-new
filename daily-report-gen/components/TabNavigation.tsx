'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function TabNavigation({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const tabs = [
    { href: '/chat', label: 'Chat' },
    { href: '/reports', label: 'Reports' },
    { href: '/upload', label: 'Upload' },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                pathname === tab.href
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">{userEmail}</span>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}
