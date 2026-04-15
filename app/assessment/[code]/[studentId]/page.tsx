'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAssessment } from '@/lib/viewmodels/AssessmentContext'
import { assessmentService } from '@/lib/services/AssessmentService'
import { QuestionRenderer } from '@/components/QuestionRenderer'
import { Button, FAB } from '@/components/ui'
import { idb, IDBResponse } from '@/lib/idb'
import { ChevronLeft, ChevronRight, Send, Wifi, WifiOff, ShieldCheck } from 'lucide-react'

export default function AssessmentExecutionPage() {
  const { code, studentId } = useParams()
  const router = useRouter()
  const { state, dispatch } = useAssessment()
  const [loading, setLoading] = useState(true)
  const [isStarted, setIsStarted] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!code || !studentId) return
      
      try {
        const assessment = await assessmentService.getAssessmentByCode(code as string)
        dispatch({ type: 'SET_ASSESSMENT', payload: assessment })

        // Auto-start or fetch existing submission
        const submission = await assessmentService.startSubmission(assessment.id, studentId as string)
        if (!submission) throw new Error('Could not initialize submission session')
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
        router.push(`/candidate/${studentId}/dashboard`)
      } catch {
        alert('Failed to submit. Your progress is saved offline. Please reconnect to sync.')
      }
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center font-bold text-teal-600 animate-pulse bg-slate-50">Initializing SEAS Environment...</div>

  if (!isStarted || !state.assessment) return null

  const currentQuestion = state.assessment.questions[state.currentQuestionIndex]
  const currentResponse = state.responses[currentQuestion.id]

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative">
      {/* Header */}
      <header className="teal-gradient p-4 md:p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-10 gap-4">
        <div className="flex flex-col">
          <h2 className="text-lg md:text-xl font-bold line-clamp-1">{state.assessment.title}</h2>
          <span className="text-teal-100 font-medium text-xs md:text-sm opacity-80">Student ID: {studentId}</span>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-[10px] md:text-sm ${state.isOffline ? 'bg-orange-500' : 'bg-teal-500'}`}>
            {state.isOffline ? <WifiOff size={14} className="md:w-4 md:h-4" /> : <Wifi size={14} className="md:w-4 md:h-4" />}
            {state.isOffline ? 'OFFLINE' : 'ONLINE'}
          </div>
          <div className="bg-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-[10px] md:text-sm">
            Q {state.currentQuestionIndex + 1} / {state.assessment.questions.length}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-12">
        <QuestionRenderer 
          question={currentQuestion}
          response={currentResponse}
          onResponse={handleResponse}
        />
        
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 md:mt-12 gap-4">
          <Button 
            variant="secondary" 
            icon={ChevronLeft}
            disabled={state.currentQuestionIndex === 0}
            onClick={() => dispatch({ type: 'SET_QUESTION_INDEX', payload: state.currentQuestionIndex - 1 })}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Previous
          </Button>

          {state.currentQuestionIndex === state.assessment.questions.length - 1 ? (
            <Button 
              variant="accent" 
              icon={Send}
              onClick={handleSubmit}
              className="w-full sm:w-auto order-1 sm:order-2 py-4 sm:py-3"
            >
              Finish & Submit
            </Button>
          ) : (
            <Button 
              icon={ChevronRight}
              onClick={() => dispatch({ type: 'SET_QUESTION_INDEX', payload: state.currentQuestionIndex + 1 })}
              className="w-full sm:w-auto order-1 sm:order-2 py-4 sm:py-3"
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
