'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { assessmentService, SubmissionWithAssessment } from '@/lib/services/AssessmentService'
import { Card, Button } from '@/components/ui'
import { 
  CheckCircle, 
  LayoutDashboard
} from 'lucide-react'
import { Tables } from '@/lib/types/database.types'

export default function CandidateResultsListPage() {
  const router = useRouter()
  const { candidateId } = useParams()
  
  const [candidate, setCandidate] = useState<Tables<'candidates'> | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionWithAssessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!candidateId) return
      setLoading(true)
      try {
        const [cData, sData] = await Promise.all([
          assessmentService.getCandidateById(candidateId as string),
          assessmentService.getSubmissionsByCandidate(candidateId as string)
        ])
        setCandidate(cData)
        setSubmissions(sData.filter(s => !!s.client_end_time))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [candidateId])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-teal-500 animate-spin" />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto p-6 md:p-12">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <button 
            onClick={() => router.push(`/candidate/${candidateId}/dashboard`)}
            className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-widest hover:underline mb-2"
          >
            <LayoutDashboard size={14} /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Your Results</h1>
          <p className="text-slate-500 font-medium">
            Review your performance for: <span className="text-teal-600 font-bold">{candidate?.first_name} {candidate?.last_name}</span>
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {submissions.length === 0 ? (
            <Card className="p-16 flex flex-col items-center justify-center text-center gap-4 border-dashed">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                <CheckCircle size={32} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-slate-800">No completed assessments</h3>
                <p className="text-slate-400 font-medium">Results will appear here once you submit your work.</p>
              </div>
            </Card>
          ) : (
            submissions.map((sub) => (
              <Card 
                key={sub.id} 
                className="flex items-center justify-between p-6 hover:border-teal-200 cursor-pointer group transition-all"
                onClick={() => router.push(`/candidate/results/${candidateId}/${sub.assessment_id}`)}
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center shadow-sm">
                    <CheckCircle size={24} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-teal-600 transition-colors leading-tight">{sub.assessments.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sub.assessments.assessment_code}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-xs font-bold text-slate-500">
                        {sub.client_end_time ? new Date(sub.client_end_time).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</span>
                    <span className="text-xl font-black text-slate-800">{sub.total_score ?? '—'}</span>
                  </div>
                  <Button variant="secondary" className="hidden sm:flex">View Detail</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
