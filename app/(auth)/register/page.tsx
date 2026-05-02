'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import FormGroup from '@/components/FormGroup'
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (authError) throw authError

      if (data.user) {
        // Insert into profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id, 
              full_name: fullName, 
              role: 'examiner' 
            }
          ])

        if (profileError) throw profileError
        
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 min-h-screen">
        <Card className="max-w-md w-full p-8 text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
            <CheckCircle2 size={48} />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-black text-slate-800">Registration Successful!</h1>
            <p className="text-slate-500 font-medium">
              Your account has been created. You can now log in to the Staff Portal.
            </p>
          </div>
          <p className="text-sm text-slate-400">Redirecting to login in a few seconds...</p>
          <Button onClick={() => router.push('/login')} className="w-full">
            Go to Login
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 min-h-screen">
      <div className="max-w-md w-full flex flex-col gap-8">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 teal-gradient rounded-2xl flex items-center justify-center text-white shadow-xl">
            <UserPlus size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-800">Examiner Sign Up</h1>
          <p className="text-slate-500 font-medium">Create your SEAS staff account</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleRegister} className="flex flex-col gap-6">
            <FormGroup label="Full Name">
              <Input 
                type="text" 
                required
                icon={User}
                placeholder="Dr. Jane Doe" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </FormGroup>

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
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 font-medium text-sm">
              Already have an account?{' '}
              <button 
                onClick={() => router.push('/login')}
                className="text-teal-600 font-black hover:underline cursor-pointer"
              >
                Sign In
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
