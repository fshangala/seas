'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAssessment } from '@/lib/viewmodels/AssessmentContext'
import { assessmentService } from '@/lib/services/AssessmentService'
import { QuestionRenderer } from '@/components/QuestionRenderer'
import { Button, FAB, Card } from '@/components/ui'
import { idb, IDBResponse } from '@/lib/idb'
import { ChevronLeft, ChevronRight, Send, Wifi, WifiOff, ShieldCheck, Clock } from 'lucide-react'

export default function AssessmentPage() {
  const { code } = useParams()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('studentId')
  const router = useRouter()
  const { state, dispatch } = useAssessment()
  const [loading, setLoading] = useState(true)
  const [isStarted, setIsStarted] = useState(false)
  
  // Entry form state
  const [entryId, setEntryId] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const assessment = await assessmentService.getAssessmentByCode(code as string)
        dispatch({ type: 'SET_ASSESSMENT', payload: assessment })

        if (!studentId) {
          setLoading(false)
          return
        }
        
        // Auto-start or fetch existing submission
        const submission = await assessmentService.startSubmission(assessment.id, studentId)
        dispatch({ type: 'SET_SUBMISSION_ID', payload: submission.id })

        // Load local responses for THIS submission
        const localResponses = await idb.getResponses()
        localResponses.forEach(resp => {
          if (resp.submission_id === submission.id) {
            dispatch({ type: 'SAVE_RESPONSE', payload: resp })
          }
        })
        
        setIsStarted(true)
      } catch (err) {
        console.error(err)
        alert('Failed to initialize assessment. Please check your connection or code.')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [code, studentId, dispatch, router])

  const handleEnterId = (e: React.FormEvent) => {
    e.preventDefault()
    if (!entryId.trim()) return
    router.push(`/assessment/${code}?studentId=${entryId.trim()}`)
  }

  const handleResponse = (value: Partial<IDBResponse>) => {
    if (!state.assessment) return
    const question = state.assessment.questions[state.currentQuestionIndex]
    const response: IDBResponse = {
      question_id: question.id,
      submission_id: state.submissionId!,
      selected_option_id: value.selected_option_id,
      text_value: value.text_value,
      image_response_blob: value.image_response_blob,
      image_response_url: value.image_response_url,
      synced: false,
      updated_at: Date.now()
    }
    idb.saveResponse(response)
    dispatch({ type: 'SAVE_RESPONSE', payload: response })
  }

  const handleSubmit = async () => {
    if (confirm('Are you sure you want to submit your assessment?')) {
      try {
        await assessmentService.syncResponses(state.submissionId!)
        await assessmentService.completeSubmission(state.submissionId!)
        alert('Assessment submitted successfully!')
        router.push(`/candidate/results/${studentId}`)
      } catch {
        alert('Failed to submit. Your progress is saved offline. Please reconnect to sync.')
      }
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center font-bold text-teal-600 animate-pulse bg-slate-50">Initializing SEAS Environment...</div>

  // Entry Form State
  if (!studentId && state.assessment) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="max-w-xl w-full flex flex-col gap-8">
          <div className="text-center flex flex-col gap-4">
            <div className="w-20 h-20 bg-teal-100 rounded-3xl flex items-center justify-center text-teal-600 mx-auto shadow-sm">
              <ShieldCheck size={40} />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">{state.assessment.title}</h1>
              <p className="text-slate-500 font-medium tracking-wide flex items-center justify-center gap-2">
                <Clock size={16} /> {state.assessment.duration_minutes} Minutes &bull; {state.assessment.questions.length} Questions
              </p>
            </div>
          </div>

          <Card className="p-10 flex flex-col gap-6 shadow-2xl border-teal-100">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-slate-800">Identify Yourself</h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Please enter your Student ID or Registration Number to begin the assessment.
              </p>
            </div>
            <form onSubmit={handleEnterId} className="flex flex-col gap-4">
              <input 
                type="text" 
                autoFocus
                placeholder="Student ID / Reg No" 
                className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-hidden bg-white font-bold text-lg text-center"
                value={entryId}
                onChange={(e) => setEntryId(e.target.value)}
              />
              <Button type="submit" className="py-4 text-lg">Start Assessment</Button>
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

  if (!isStarted || !state.assessment) return null

  const currentQuestion = state.assessment.questions[state.currentQuestionIndex]
  const currentResponse = state.responses[currentQuestion.id]

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative">
      {/* Header */}
      <header className="teal-gradient p-6 text-white shadow-lg flex items-center justify-between sticky top-0 z-10">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">{state.assessment.title}</h2>
          <span className="text-teal-100 font-medium text-sm opacity-80">Student ID: {studentId}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${state.isOffline ? 'bg-orange-500' : 'bg-teal-500'}`}>
            {state.isOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
            {state.isOffline ? 'OFFLINE' : 'ONLINE'}
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-full font-bold text-sm">
            Q {state.currentQuestionIndex + 1} / {state.assessment.questions.length}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
        <QuestionRenderer 
          question={currentQuestion}
          response={currentResponse}
          onResponse={handleResponse}
        />
        
        <div className="flex items-center justify-between mt-12 gap-6">
          <Button 
            variant="secondary" 
            icon={ChevronLeft}
            disabled={state.currentQuestionIndex === 0}
            onClick={() => dispatch({ type: 'SET_QUESTION_INDEX', payload: state.currentQuestionIndex - 1 })}
          >
            Previous
          </Button>

          {state.currentQuestionIndex === state.assessment.questions.length - 1 ? (
            <Button 
              variant="accent" 
              icon={Send}
              onClick={handleSubmit}
            >
              Finish & Submit
            </Button>
          ) : (
            <Button 
              icon={ChevronRight}
              onClick={() => dispatch({ type: 'SET_QUESTION_INDEX', payload: state.currentQuestionIndex + 1 })}
            >
              Next Question
            </Button>
          )}
        </div>
      </main>

      {/* Proctoring Status FAB */}
      <FAB icon={ShieldCheck} onClick={() => alert('SEAS Integrity System is active. All activities are being recorded.')} />
    </div>
  )
}
