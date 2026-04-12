'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button, Card } from '@/components/ui'
import { ShieldCheck, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/examiner/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full flex flex-col gap-8">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 teal-gradient rounded-2xl flex items-center justify-center text-white shadow-xl">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-800">Staff Portal</h1>
          <p className="text-slate-500 font-medium">SEAS Management Console Access</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="name@institution.edu" 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-hidden bg-slate-50 font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-hidden bg-slate-50 font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-2xl text-sm font-bold border border-red-100">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="py-4 text-lg mt-2">
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 font-medium text-sm">
              New staff member?{' '}
              <button 
                onClick={() => router.push('/register')}
                className="text-teal-600 font-black hover:underline"
              >
                Create Account
              </button>
            </p>
          </div>
        </Card>

        <button 
          onClick={() => router.push('/')}
          className="text-slate-400 font-bold text-sm hover:text-teal-600 transition-colors"
        >
          &larr; Return to Candidate Entrance
        </button>
      </div>
    </div>
  )
}
