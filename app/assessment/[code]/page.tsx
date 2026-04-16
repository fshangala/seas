'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAssessment } from '@/lib/viewmodels/AssessmentContext'
import { assessmentService } from '@/lib/services/AssessmentService'
import { Button, Card, Input } from '@/components/ui'
import { ShieldCheck, Clock, User, ArrowRight } from 'lucide-react'

export default function AssessmentEntryPage() {
  const { code } = useParams()
  const router = useRouter()
  const { state, dispatch } = useAssessment()
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  
  // Entry form state
  const [studentId, setStudentId] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const assessment = await assessmentService.getAssessmentByCode(code as string)
        dispatch({ type: 'SET_ASSESSMENT', payload: assessment })
      } catch (err) {
        console.error(err)
        alert('Assessment not found or unavailable.')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [code, dispatch, router])

  const handleEnterId = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId.trim() || verifying) return

    setVerifying(true)
    try {
      const candidate = await assessmentService.getCandidateByStudentId(studentId.trim())
      
      if (candidate) {
        // Candidate exists, proceed to assessment using their UUID
        router.push(`/assessment/${code}/${candidate.id}`)
      } else {
        // New candidate, go to profile creation and remember the assessment redirect
        router.push(`/candidate/profile?studentId=${studentId.trim()}&redirect=/assessment/${code}`)
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred during verification. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center font-bold text-teal-600 animate-pulse bg-slate-50">Loading Assessment Details...</div>

  if (!state.assessment) return null

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-xl w-full flex flex-col gap-8">
        <div className="text-center flex flex-col gap-4">
          <div className="w-20 h-20 bg-teal-100 rounded-3xl flex items-center justify-center text-teal-600 mx-auto shadow-sm">
            <ShieldCheck size={40} />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{state.assessment.title}</h1>
            <p className="text-slate-500 font-medium tracking-wide flex items-center justify-center gap-2 text-sm md:text-base">
              <Clock size={16} /> {state.assessment.duration_minutes} Minutes &bull; {state.assessment.questions.length} Questions
            </p>
          </div>
        </div>

        <Card className="p-8 md:p-10 flex flex-col gap-6 shadow-2xl border-teal-100">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-slate-800">Identify Yourself</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Please enter your Student ID or Registration Number to begin the assessment.
            </p>
          </div>
          <form onSubmit={handleEnterId} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Identifier</label>
              <Input 
                autoFocus
                placeholder="Student ID / Reg No" 
                className="text-center text-lg md:text-xl font-bold py-6 border-slate-200"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                icon={User}
                disabled={verifying}
              />
            </div>
            <Button 
              type="submit" 
              className="py-6 text-lg" 
              loading={verifying}
              icon={ArrowRight}
            >
              Continue to Assessment
            </Button>
          </form>
        </Card>

        <div className="bg-slate-100/50 p-6 rounded-3xl border border-slate-200 flex items-start gap-4">
          <div className="p-2 bg-white rounded-xl text-orange-500 shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Integrity Notice</span>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              By entering, you agree to the proctoring rules. Tab-switching, copy-pasting, and navigation away from this page will be logged and may lead to disqualification.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
