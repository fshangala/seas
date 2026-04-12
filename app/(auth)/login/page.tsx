'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button, Card, Input, FormGroup } from '@/components/ui'
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
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 min-h-screen">
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
            <FormGroup label="Email Address">
              <Input 
                type="email" 
                required
                icon={Mail}
                placeholder="name@institution.edu" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormGroup>

            <FormGroup label="Password">
              <Input 
                type="password" 
                required
                icon={Lock}
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormGroup>

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
                className="text-teal-600 font-black hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </div>
        </Card>

        <button 
          onClick={() => router.push('/')}
          className="text-slate-400 font-bold text-sm hover:text-teal-600 transition-colors cursor-pointer text-center"
        >
          &larr; Return to Candidate Entrance
        </button>
      </div>
    </div>
  )
}
