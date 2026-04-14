'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { assessmentService, SubmissionWithAssessment } from '@/lib/services/AssessmentService'
import { Card, Button, StatsCard } from '@/components/ui'
import { 
  CheckCircle, 
  Clock, 
  ChevronLeft, 
  BookOpen, 
  Calendar, 
  Timer,
  Award,
  AlertCircle
} from 'lucide-react'

export default function ResultDetailPage() {
  const { studentId, assessmentId } = useParams()
  const router = useRouter()
  const [submission, setSubmission] = useState<SubmissionWithAssessment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await assessmentService.getSubmissionDetails(studentId as string, assessmentId as string)
        setSubmission(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [studentId, assessmentId])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-teal-500 animate-spin" />
    </div>
  )

  if (!submission) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-slate-800">Result Not Found</h1>
      <p className="text-slate-500 mb-8">We couldn&apos;t find the record you were looking for.</p>
      <Button onClick={() => router.push(`/candidate/dashboard?studentId=${studentId}`)}>Back to Dashboard</Button>
    </div>
  )

  const { assessments: assessment } = submission
  const startDate = submission.client_start_time ? new Date(submission.client_start_time) : null
  const endDate = submission.client_end_time ? new Date(submission.client_end_time) : null
  
  const timeTakenMinutes = startDate && endDate 
    ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
    : null

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto p-6 md:p-12">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => router.push(`/candidate/dashboard?studentId=${studentId}`)}
              className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-widest hover:underline mb-2"
            >
              <ChevronLeft size={14} /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{assessment.title}</h1>
            <p className="text-slate-500 font-medium">Results for Student ID: <span className="text-teal-600 font-bold">{studentId}</span></p>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <CheckCircle className="text-teal-500" size={20} />
            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Submission Confirmed</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 flex flex-col items-center justify-center text-center gap-4 bg-linear-to-b from-teal-50 to-white border-teal-100">
            <div className="w-20 h-20 rounded-3xl teal-gradient flex items-center justify-center text-white shadow-xl">
              <Award size={40} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Final Score</span>
              <span className="text-6xl font-black text-slate-800 leading-none">{submission.total_score ?? '—'}</span>
            </div>
            <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${submission.grading_status === 'completed' ? 'bg-teal-100 text-teal-600' : 'bg-orange-100 text-orange-600'}`}>
              {submission.grading_status === 'completed' ? 'Graded' : 'Pending Review'}
            </div>
          </Card>

          <div className="grid gap-6">
            <StatsCard label="Duration" value={`${assessment.duration_minutes}m`} icon={Timer} colorClass="bg-slate-800 shadow-slate-800/20" />
            <StatsCard label="Time Taken" value={timeTakenMinutes !== null ? `${timeTakenMinutes}m` : '—'} icon={Clock} colorClass="bg-cyan-500 shadow-cyan-500/20" />
          </div>
        </div>

        <Card className="p-10 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-slate-800">Assessment Summary</h2>
            <p className="text-slate-500 font-medium leading-relaxed">{assessment.description || 'No description provided.'}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                <Calendar size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Taken</span>
                <span className="font-bold text-slate-700">{startDate ? startDate.toLocaleDateString() : '—'}</span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                <BookOpen size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessment Code</span>
                <span className="font-bold text-slate-700">{assessment.assessment_code}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4 p-8 bg-slate-100 rounded-3xl border border-slate-200">
          <div className="flex items-center gap-3 text-slate-400">
            <AlertCircle size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Grading Note</span>
          </div>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Your assessment is currently being reviewed by the examination board. Automated scores for MCQs are included in the total, while short answers and essays may require manual grading.
          </p>
        </div>
      </div>
    </div>
  )
}
