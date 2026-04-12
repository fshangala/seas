'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { assessmentService } from '@/lib/services/AssessmentService'
import { Card, Button } from '@/components/ui'
import { BookOpen, CheckCircle, Clock, ChevronRight, LayoutDashboard } from 'lucide-react'

export default function CandidateResultsPage() {
  const { studentId } = useParams()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadSubmissions() {
      try {
        const data = await assessmentService.getSubmissionsByStudent(studentId as string)
        setSubmissions(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadSubmissions()
  }, [studentId])

  if (loading) return <div className="flex-1 flex items-center justify-center font-bold text-teal-600 animate-pulse">Fetching your records...</div>

  return (
    <div className="flex-1 flex flex-col bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
        <header className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Assessments</h1>
            <p className="text-slate-500 font-medium">Student ID: <span className="text-teal-600 font-bold">{studentId}</span></p>
          </div>
          <Button variant="secondary" icon={LayoutDashboard} onClick={() => router.push('/')}>
            Exit
          </Button>
        </header>

        {submissions.length === 0 ? (
          <Card className="text-center p-12">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-800">No assessments found</h2>
            <p className="text-slate-500 mt-2">You haven't taken any assessments yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {submissions.map((sub) => (
              <Card key={sub.id} className="flex items-center justify-between p-6 hover:border-teal-200 cursor-pointer group transition-all" onClick={() => router.push(`/candidate/results/${studentId}/${sub.assessment_id}`)}>
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${sub.grading_status === 'completed' ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-600'}`}>
                    {sub.grading_status === 'completed' ? <CheckCircle size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-teal-600 transition-colors">{sub.assessments.title}</h3>
                    <p className="text-slate-400 text-sm font-medium">Code: {sub.assessments.assessment_code}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <p className={`font-bold text-sm ${sub.grading_status === 'completed' ? 'text-teal-600' : 'text-orange-500'}`}>
                      {sub.grading_status === 'completed' ? 'GRADED' : 'PENDING'}
                    </p>
                  </div>
                  {sub.grading_status === 'completed' && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Score</p>
                      <p className="text-xl font-black text-slate-800">{sub.total_score}</p>
                    </div>
                  )}
                  <ChevronRight className="text-slate-300 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
