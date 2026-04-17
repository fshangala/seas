'use client'

import React, { useEffect, useState, use } from 'react'
import { Card, Button } from '@/components/ui'
import { assessmentService, SubmissionWithAssessment } from '@/lib/services/AssessmentService'
import { useRouter } from 'next/navigation'
import { ChevronLeft, User, Clock, CheckCircle2, AlertCircle, Eye, Download, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { useAlert } from '@/lib/viewmodels/AlertContext'

export default function AssessmentSubmissions({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { showAlert, showLoading, hideLoading } = useAlert()
  const { id } = use(params)
  const [submissions, setSubmissions] = useState<SubmissionWithAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMCQMarkingKey, setHasMCQMarkingKey] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [subData, keyData] = await Promise.all([
          assessmentService.getSubmissions(id),
          assessmentService.getMarkingKeys(id)
        ])
        setSubmissions(subData || [])
        
        // Check if any MCQ has a marking key
        const hasMCQKey = keyData?.some(q => {
          if (q.question_type !== 'mcq') return false
          const mk = q.marking_keys
          const key = Array.isArray(mk) ? mk[0] : mk
          return key && key.correct_option_id
        })
        setHasMCQMarkingKey(!!hasMCQKey)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleAutoMark = async () => {
    showAlert({
      title: 'Auto-Mark MCQs',
      message: 'This will automatically grade all MCQ responses for this assessment. Existing manual grades for MCQs might be overwritten. Continue?',
      confirmLabel: 'Start Marking',
      cancelLabel: 'Cancel',
      variant: 'primary',
      onConfirm: async () => {
        showLoading('Marking MCQ responses...')
        try {
          await assessmentService.autoMarkMCQ(id)
          const updatedSubmissions = await assessmentService.getSubmissions(id)
          setSubmissions(updatedSubmissions || [])
          showAlert({
            title: 'Success',
            message: 'All MCQ responses have been automatically graded.',
            variant: 'success'
          })
        } catch (err) {
          console.error(err)
          showAlert({
            title: 'Error',
            message: 'Failed to auto-mark responses.',
            variant: 'danger'
          })
        } finally {
          hideLoading()
        }
      }
    })
  }

  const handleDownloadCSV = () => {
    if (submissions.length === 0) return

    const headers = [
      'First Name',
      'Last Name',
      'Student ID',
      'Assessment Code',
      'Assessment Name',
      'Time Taken (Min)',
      'Grades'
    ]

    const rows = submissions.map(s => {
      const startTime = s.client_start_time ? new Date(s.client_start_time) : null
      const endTime = s.client_end_time 
        ? new Date(s.client_end_time) 
        : s.server_received_at 
          ? new Date(s.server_received_at) 
          : null
      
      let timeTaken = 'N/A'
      if (startTime && endTime) {
        const diffMs = endTime.getTime() - startTime.getTime()
        timeTaken = Math.round(diffMs / 60000).toString()
      }

      return [
        s.candidates?.first_name || '',
        s.candidates?.last_name || '',
        s.candidates?.student_id || '',
        s.assessments?.assessment_code || '',
        s.assessments?.title || '',
        timeTaken,
        s.grading_status === 'completed' ? s.total_score : 'Pending'
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `results-${submissions[0].assessments.assessment_code}-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div className="animate-pulse space-y-4">
    <div className="h-12 w-64 bg-slate-200 rounded-2xl" />
    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
  </div>

  return (
    <div className="flex flex-col gap-12">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-teal-600 transition-colors font-bold text-xs uppercase tracking-widest mb-2"
          >
            <ChevronLeft size={16} />
            Back to Marking
          </button>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Submissions</h1>
          <p className="text-slate-500 font-medium">Review and grade candidate attempts for this assessment.</p>
        </div>

        <div className="flex items-center gap-4">
          {hasMCQMarkingKey && submissions.length > 0 && (
            <Button 
              variant="primary" 
              icon={Zap}
              onClick={handleAutoMark}
            >
              Auto-Mark MCQs
            </Button>
          )}
          <Button 
            variant="secondary" 
            icon={Download}
            onClick={handleDownloadCSV}
            disabled={submissions.length === 0}
          >
            Download Results
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {submissions.length === 0 ? (
          <Card className="p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <User size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">No Submissions Yet</h3>
              <p className="text-slate-500">Candidates have not submitted their attempts for this assessment.</p>
            </div>
          </Card>
        ) : (
          <div className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Candidate</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Time Submitted</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Score</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                          {s.candidates?.first_name[0]}{s.candidates?.last_name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{s.candidates?.first_name} {s.candidates?.last_name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.candidates?.student_id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-6">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} />
                        <span className="text-sm font-medium">
                          {s.server_received_at ? format(new Date(s.server_received_at), 'MMM d, p') : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      {s.grading_status === 'completed' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-600 rounded-full">
                          <CheckCircle2 size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Graded</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full">
                          <AlertCircle size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <span className="font-black text-slate-800">
                        {s.grading_status === 'completed' ? `${s.total_score}` : '-'}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <Button 
                        variant="secondary" 
                        icon={Eye}
                        onClick={() => router.push(`/examiner/marking/${id}/submissions/${s.id}`)}
                      >
                        Grade
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
