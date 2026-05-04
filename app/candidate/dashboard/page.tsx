'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'
import { 
  ShieldCheck,
  Search
} from 'lucide-react'

import { assessmentService } from '@/lib/services/AssessmentService'

export default function CandidateDashboardEntry() {
  const router = useRouter()
  const [tempId, setTempId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempId.trim()) return
    
    setLoading(true)
    setError('')
    try {
      const candidate = await assessmentService.getCandidateByStudentId(tempId.trim())
      if (candidate) {
        router.push(`/candidate/${candidate.id}/dashboard`)
      } else {
        router.push(`/candidate/profile?studentId=${tempId.trim()}`)
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
      <Card className="max-w-md w-full p-10 flex flex-col gap-8 shadow-2xl border-teal-100">
        <div className="text-center flex flex-col gap-4">
          <div className="w-20 h-20 bg-teal-100 rounded-3xl flex items-center justify-center text-teal-600 mx-auto">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Candidate Dashboard</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Please identify yourself with your Student ID to access your records.
          </p>
        </div>
        <form onSubmit={handleIdentify} className="flex flex-col gap-4">
          <Input 
            placeholder="Enter Student ID" 
            value={tempId}
            onChange={(e) => setTempId(e.target.value)}
            className="text-center text-lg font-bold"
            icon={Search}
            disabled={loading}
          />
          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
          <Button type="submit" className="py-4" loading={loading}>
            Access Records
          </Button>
        </form>
        <button 
          onClick={() => router.push('/')}
          className="text-slate-400 hover:text-teal-600 font-bold text-xs uppercase tracking-widest transition-colors"
        >
          Back to Home
        </button>
      </Card>
    </div>
  )
}
