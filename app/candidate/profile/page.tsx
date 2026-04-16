'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Button, Input } from '@/components/ui'
import { 
  UserPlus,
  User,
  ArrowRight
} from 'lucide-react'
import { assessmentService } from '@/lib/services/AssessmentService'

function ProfileForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('studentId') || ''
  const redirect = searchParams.get('redirect') || ''

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !studentId) return

    setLoading(true)
    setError('')
    try {
      const candidate = await assessmentService.createCandidate(
        studentId,
        firstName.trim(),
        lastName.trim()
      )
      
      if (redirect) {
        // If there's a redirect (e.g., from an assessment), go back to it with the new UUID
        router.push(`${redirect}/${candidate.id}`)
      } else {
        // Default to dashboard
        router.push(`/candidate/${candidate.id}/dashboard`)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to create profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!studentId) {
    router.push('/candidate/dashboard')
    return null
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
      <Card className="max-w-md w-full p-10 flex flex-col gap-8 shadow-2xl border-teal-100">
        <div className="text-center flex flex-col gap-4">
          <div className="w-20 h-20 bg-teal-100 rounded-3xl flex items-center justify-center text-teal-600 mx-auto">
            <UserPlus size={40} />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800">Create Profile</h1>
            <p className="text-slate-500 font-medium">Student ID: <span className="text-teal-600 font-bold">{studentId}</span></p>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Welcome! It looks like this is your first time here. Please provide your name to set up your profile.
          </p>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
            <Input 
              placeholder="e.g. John" 
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              icon={User}
              disabled={loading}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
            <Input 
              placeholder="e.g. Doe" 
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              icon={User}
              disabled={loading}
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center mt-2">{error}</p>}
          
          <Button type="submit" className="py-4 mt-4" loading={loading} icon={ArrowRight}>
            Complete Registration
          </Button>
        </form>

        <button 
          onClick={() => router.push('/candidate/dashboard')}
          className="text-slate-400 hover:text-teal-600 font-bold text-xs uppercase tracking-widest transition-colors"
        >
          Cancel
        </button>
      </Card>
    </div>
  )
}

export default function CandidateProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-teal-500 animate-spin" />
      </div>
    }>
      <ProfileForm />
    </Suspense>
  )
}
