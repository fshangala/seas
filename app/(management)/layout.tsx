'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ShieldCheck, LogOut, LayoutDashboard, BookOpen, Users, ClipboardCheck } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { Tables } from '@/lib/types/database.types'

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(profile)

      // Role Check
      if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
        router.push('/examiner/dashboard')
      } else if (pathname.startsWith('/examiner') && !['admin', 'examiner'].includes(profile?.role || '')) {
        router.push('/')
      }

      setLoading(false)
    }
    checkUser()
  }, [router, pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading || !profile) return <div className="flex-1 flex items-center justify-center font-bold text-teal-600 animate-pulse">Verifying Credentials...</div>

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: `/${profile.role}/dashboard` },
    { label: 'Assessments', icon: BookOpen, href: `/${profile.role}/assessments` },
    ...(profile.role === 'admin' ? [{ label: 'Users', icon: Users, href: '/admin/users' }] : []),
    { label: 'Marking', icon: ClipboardCheck, href: `/${profile.role}/marking` },
  ]

  return (
    <div className="flex-1 flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 slate-gradient p-8 text-white flex flex-col justify-between sticky top-0 h-screen">
        <div className="flex flex-col gap-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter">SEAS</span>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Management Console</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all text-sm cursor-pointer ${
                  pathname.startsWith(item.href) ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
            <p className="font-bold text-sm truncate">{profile?.full_name || user?.email}</p>
            <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mt-1">{profile?.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-400 hover:bg-red-500/10 transition-all text-sm cursor-pointer"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
