'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAssessment } from '@/lib/viewmodels/AssessmentContext'
import { assessmentService } from '@/lib/services/AssessmentService'
import { QuestionRenderer } from '@/components/QuestionRenderer'
import { Button, Card, FAB } from '@/components/ui'
import { idb } from '@/lib/idb'
import { ChevronLeft, ChevronRight, Send, AlertCircle, Wifi, WifiOff, ShieldCheck } from 'lucide-react'

export default function AssessmentPage() {
  const { code } = useParams()
  const router = useRouter()
  const { state, dispatch } = useAssessment()
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState('')
  const [isStarted, setIsStarted] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const assessment = await assessmentService.getAssessmentByCode(code as string)
        dispatch({ type: 'SET_ASSESSMENT', payload: assessment })
        
        // Load local responses
        const localResponses = await idb.getResponses()
        localResponses.forEach(resp => {
          dispatch({ type: 'SAVE_RESPONSE', payload: resp })
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [code, dispatch])

  const handleStart = async () => {
    if (!studentId) return alert('Please enter your Student ID')
    try {
      const submission = await assessmentService.startSubmission(state.assessment.id, studentId)
      dispatch({ type: 'SET_SUBMISSION_ID', payload: submission.id })
      setIsStarted(true)
    } catch (err) {
      alert('Failed to start assessment. Are you online?')
    }
  }

  const handleResponse = (value: any) => {
    const question = state.assessment.questions[state.currentQuestionIndex]
    const response = {
      question_id: question.id,
      submission_id: state.submissionId!,
      ...value
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
        router.push('/')
      } catch (err) {
        alert('Failed to submit. Your progress is saved offline. Please reconnect to sync.')
      }
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center font-bold text-teal-600 animate-pulse">Initializing SEAS Environment...</div>

  if (!isStarted) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <Card className="max-w-md w-full flex flex-col gap-6 text-center">
          <div className="w-20 h-20 teal-gradient rounded-full flex items-center justify-center self-center text-white shadow-xl mb-2">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">{state.assessment?.title}</h1>
          <p className="text-slate-500 font-medium leading-relaxed">{state.assessment?.description}</p>
          <div className="flex flex-col gap-4 mt-4">
            <input 
              type="text" 
              placeholder="Enter Student ID" 
              className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-hidden bg-slate-50 font-semibold"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
            <Button onClick={handleStart} className="w-full py-4 text-lg">Start Assessment</Button>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-400 font-medium text-sm">
            <AlertCircle size={16} />
            Offline-first mode active.
          </div>
        </Card>
      </div>
    )
  }

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
