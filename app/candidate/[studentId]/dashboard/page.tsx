'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { assessmentService, SubmissionWithAssessment } from '@/lib/services/AssessmentService'
import { Card, Button, Input, StatsCard } from '@/components/ui'
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  LayoutDashboard, 
  Plus, 
  LogOut
} from 'lucide-react'

export default function StudentDashboardPage() {
  const router = useRouter()
  const { studentId } = useParams()
  
  const [submissions, setSubmissions] = useState<SubmissionWithAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [newCode, setNewCode] = useState('')
  const [error, setError] = useState('')

  const loadSubmissions = React.useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    setError('')
    try {
      const data = await assessmentService.getSubmissionsByStudent(studentId as string)
      setSubmissions(data)
    } catch {
      setError('Failed to load your assessments.')
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  const handleStartNew = async () => {
    if (!newCode.trim()) return
    setError('')
    try {
      await assessmentService.getAssessmentByCode(newCode.trim().toUpperCase())
      router.push(`/assessment/${newCode.trim().toUpperCase()}/${studentId}`)
    } catch {
      setError('Invalid Assessment Code')
    }
  }

  const inProgress = submissions.filter(s => !s.client_end_time).length
  const completed = submissions.filter(s => s.client_end_time).length

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 teal-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
              <LayoutDashboard size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">Dashboard</h1>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {studentId}</span>
            </div>
          </div>
          <button 
            onClick={() => router.push('/candidate/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all uppercase tracking-widest"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto p-6 flex flex-col gap-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard label="Total Taken" value={submissions.length} icon={BookOpen} colorClass="bg-slate-800 shadow-slate-800/20" />
          <StatsCard label="In Progress" value={inProgress} icon={Clock} colorClass="bg-orange-500 shadow-orange-500/20" />
          <StatsCard label="Completed" value={completed} icon={CheckCircle} colorClass="bg-teal-500 shadow-teal-500/20" />
        </div>

        {/* Start New Section */}
        <Card className="p-8 border-teal-100 bg-linear-to-r from-teal-50/50 to-white">
          <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="flex flex-col gap-2 text-center md:text-left">
              <h2 className="text-xl font-bold text-slate-800">Start New Assessment</h2>
              <p className="text-slate-500 font-medium">Have an invitation code? Enter it below to begin.</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Input 
                placeholder="Assessment Code" 
                className="w-full md:w-64 font-bold tracking-widest uppercase"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartNew()}
              />
              <Button onClick={handleStartNew} icon={Plus} className="px-8 whitespace-nowrap">Start</Button>
            </div>
          </div>
          {error && <p className="text-red-500 font-bold text-xs mt-4 text-center md:text-right">{error}</p>}
        </Card>

        {/* History List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Assessment History</h2>
            <button onClick={loadSubmissions} className="text-xs font-bold text-teal-600 hover:underline uppercase tracking-widest">Refresh</button>
          </div>

          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-300">
              <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-teal-500 animate-spin" />
              <p className="font-bold">Syncing Records...</p>
            </div>
          ) : submissions.length === 0 ? (
            <Card className="p-16 flex flex-col items-center justify-center text-center gap-4 border-dashed">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                <BookOpen size={32} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-slate-800">No records found</h3>
                <p className="text-slate-400 font-medium">You haven&apos;t participated in any assessments yet.</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {submissions.map((sub) => {
                const isCompleted = !!sub.client_end_time
                return (
                  <Card 
                    key={sub.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:border-teal-200 transition-all group gap-6"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${isCompleted ? 'bg-teal-100 text-teal-600' : 'bg-orange-100 text-orange-600'}`}>
                        {isCompleted ? <CheckCircle size={28} /> : <Clock size={28} />}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-teal-600 transition-colors leading-tight">{sub.assessments.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{sub.assessments.assessment_code}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-xs font-bold text-slate-500">
                            {sub.client_start_time ? new Date(sub.client_start_time).toLocaleDateString() : 'Unknown Date'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-8 border-t sm:border-t-0 pt-4 sm:pt-0">
                      <div className="text-right flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                        <span className={`text-xs font-black uppercase tracking-tighter ${isCompleted ? 'text-teal-600' : 'text-orange-500'}`}>
                          {isCompleted ? 'Submitted' : 'In Progress'}
                        </span>
                      </div>
                      
                      {isCompleted ? (
                        <div className="text-right flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</span>
                          <span className="text-xl font-black text-slate-800">{sub.total_score ?? '—'}</span>
                        </div>
                      ) : null}

                      <Button 
                        variant={isCompleted ? 'secondary' : 'primary'}
                        className="px-6 py-2 rounded-xl text-sm"
                        onClick={() => {
                          if (isCompleted) {
                            router.push(`/candidate/results/${studentId}/${sub.assessment_id}`)
                          } else {
                            router.push(`/assessment/${sub.assessments.assessment_code}/${studentId}`)
                          }
                        }}
                      >
                        {isCompleted ? 'View Results' : 'Continue'}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
