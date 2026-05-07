'use client'

import React, { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/actions/auth'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import FormGroup from '@/components/FormGroup'
import { ShieldCheck, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    signIn,
    null
  )

  useEffect(() => {
    if (state?.success) {
      if (state.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/examiner/dashboard')
      }
    }
  }, [state, router])

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
          <form action={formAction} className="flex flex-col gap-6">
            <FormGroup label="Email Address">
              <Input 
                name="email"
                type="email" 
                required
                icon={Mail}
                placeholder="name@institution.edu" 
              />
            </FormGroup>

            <FormGroup label="Password">
              <Input 
                name="password"
                type="password" 
                required
                icon={Lock}
                placeholder="••••••••" 
              />
            </FormGroup>

            {state?.error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-2xl text-sm font-bold border border-red-100">
                <AlertCircle size={16} />
                {state.error}
              </div>
            )}

            <Button type="submit" disabled={isPending} className="py-4 text-lg mt-2">
              {isPending ? 'Authenticating...' : 'Sign In'}
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
