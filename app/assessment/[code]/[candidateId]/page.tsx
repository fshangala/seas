'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAssessment } from '@/lib/viewmodels/AssessmentContext'
import { assessmentService } from '@/lib/services/AssessmentService'
import { QuestionRenderer } from '@/components/QuestionRenderer'
import { Button, FAB } from '@/components/ui'
import { idb, IDBResponse } from '@/lib/idb'
import { ChevronLeft, ChevronRight, Send, Wifi, WifiOff, ShieldCheck, Play, Clock, FileText, User } from 'lucide-react'
import { Tables } from '@/lib/types/database.types'

export default function AssessmentExecutionPage() {
  const { code, candidateId } = useParams()
  const router = useRouter()
  const { state, dispatch } = useAssessment()
  const [loading, setLoading] = useState(true)
  const [isStarted, setIsStarted] = useState(false)
  const [candidate, setCandidate] = useState<Tables<'candidates'> | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!code || !candidateId) return
      
      try {
        // 1. Load Assessment and Candidate
        const [assessment, cData] = await Promise.all([
          assessmentService.getAssessmentByCode(code as string),
          assessmentService.getCandidateById(candidateId as string)
        ])
        setCandidate(cData)
        dispatch({ type: 'SET_ASSESSMENT', payload: assessment })

        // 2. Associate candidate with assessment (audit trail)
        await assessmentService.associateCandidateWithAssessment(cData.id, assessment.id)

        // 3. Check for existing submission
        const existingSubmission = await assessmentService.getSubmission(assessment.id, cData.id)
        
        if (existingSubmission) {
          // Check if already submitted (server_received_at is set or status is completed)
          if (existingSubmission.server_received_at || existingSubmission.grading_status === 'completed') {
            alert('You have already submitted this assessment.')
            router.push(`/candidate/${candidateId}/dashboard`)
            return
          }

          dispatch({ type: 'SET_SUBMISSION_ID', payload: existingSubmission.id })
          
          // Load local responses for THIS submission
          const localResponses = await idb.getResponses()
          localResponses.forEach(resp => {
            if (resp.submission_id === existingSubmission.id) {
              dispatch({ type: 'SAVE_RESPONSE', payload: resp })
            }
          })
          
          setIsStarted(true)
        } else {
          // No submission yet, stay on the "Start" screen
          setIsStarted(false)
        }
      } catch (err) {
        console.error(err)
        alert('Failed to initialize assessment. Please check your connection or code.')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [code, candidateId, dispatch, router])

  const handleStart = async () => {
    if (!state.assessment || !candidate) return
    
    setLoading(true)
    try {
      const submission = await assessmentService.startSubmission(state.assessment.id, candidate.id)
      if (!submission) throw new Error('Could not initialize submission session')
      
      dispatch({ type: 'SET_SUBMISSION_ID', payload: submission.id })
      setIsStarted(true)
    } catch (err) {
      console.error(err)
      alert('Failed to start assessment. Please try again.')
    } finally {
      setLoading(false)
    }
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
        await assessmentService.syncLogs(candidateId as string)
        await assessmentService.completeSubmission(state.submissionId!)
        alert('Assessment submitted successfully!')
        router.push(`/candidate/${candidateId}/dashboard`)
      } catch {
        alert('Failed to submit. Your progress is saved offline. Please reconnect to sync.')
      }
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center font-bold text-teal-600 animate-pulse bg-slate-50">Initializing SEAS Environment...</div>

  // PRE-START SCREEN
  if (!isStarted) {
    return (
      <div className="flex-1 flex flex-col bg-slate-50 p-4 md:p-8">
        <div className="max-w-2xl w-full mx-auto mt-8 md:mt-16">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            <div className="teal-gradient p-8 text-white">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{state.assessment?.title}</h1>
              <p className="text-teal-50 opacity-90 flex items-center gap-2">
                <FileText size={18} />
                Assessment Code: {code}
              </p>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="p-3 rounded-xl bg-teal-100 text-teal-600">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate</p>
                    <p className="text-lg font-bold text-slate-700">{candidate?.first_name} {candidate?.last_name}</p>
                    <p className="text-sm text-slate-500">{candidate?.student_id}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="p-3 rounded-xl bg-cyan-100 text-cyan-600">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                    <p className="text-lg font-bold text-slate-700">{state.assessment?.duration_minutes} Minutes</p>
                    <p className="text-sm text-slate-500">Timed session</p>
                  </div>
                </div>
              </div>

              {state.assessment?.description && (
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <FileText size={18} className="text-teal-500" />
                    Instructions
                  </h3>
                  <div className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {state.assessment.description}
                  </div>
                </div>
              )}

              <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl space-y-3">
                <h3 className="font-bold text-orange-800 flex items-center gap-2">
                  <ShieldCheck size={18} />
                  Integrity Notice
                </h3>
                <p className="text-sm text-orange-700 leading-relaxed">
                  By starting this assessment, you agree to the proctoring rules. 
                  Tab switching, copying, and pasting are monitored. Your session 
                  must remain in fullscreen or focused for the duration of the test.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  icon={Play} 
                  className="w-full py-6 text-lg shadow-teal-lg"
                  onClick={handleStart}
                >
                  Start Assessment
                </Button>
                <p className="text-center text-xs text-slate-400 mt-4">
                  The timer will begin as soon as you click start.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // EXECUTION SCREEN
  const currentQuestion = state.assessment!.questions[state.currentQuestionIndex]
  const currentResponse = state.responses[currentQuestion.id]

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative">
      {/* Header */}
      <header className="teal-gradient p-4 md:p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-10 gap-4">
        <div className="flex flex-col">
          <h2 className="text-lg md:text-xl font-bold line-clamp-1">{state.assessment!.title}</h2>
          <span className="text-teal-100 font-medium text-xs md:text-sm opacity-80">
            Candidate: {candidate?.first_name} {candidate?.last_name} ({candidate?.student_id})
          </span>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-[10px] md:text-sm ${state.isOffline ? 'bg-orange-500' : 'bg-teal-500'}`}>
            {state.isOffline ? <WifiOff size={14} className="md:w-4 md:h-4" /> : <Wifi size={14} className="md:w-4 md:h-4" />}
            {state.isOffline ? 'OFFLINE' : 'ONLINE'}
          </div>
          <div className="bg-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-[10px] md:text-sm">
            Q {state.currentQuestionIndex + 1} / {state.assessment!.questions.length}
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

          {state.currentQuestionIndex === state.assessment!.questions.length - 1 ? (
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
