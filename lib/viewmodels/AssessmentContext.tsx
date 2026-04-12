'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { idb, IDBResponse } from '../idb'
import { assessmentService } from '../services/AssessmentService'

type State = {
  assessment: any | null
  submissionId: string | null
  currentQuestionIndex: number
  responses: Record<string, IDBResponse>
  proctoringLogs: any[]
  isOffline: boolean
}

type Action =
  | { type: 'SET_ASSESSMENT'; payload: any }
  | { type: 'SET_SUBMISSION_ID'; payload: string }
  | { type: 'SET_QUESTION_INDEX'; payload: number }
  | { type: 'SAVE_RESPONSE'; payload: IDBResponse }
  | { type: 'ADD_LOG'; payload: any }
  | { type: 'SET_OFFLINE'; payload: boolean }

const AssessmentContext = createContext<{
  state: State
  dispatch: React.Dispatch<Action>
} | undefined>(undefined)

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ASSESSMENT':
      return { ...state, assessment: action.payload }
    case 'SET_SUBMISSION_ID':
      return { ...state, submissionId: action.payload }
    case 'SET_QUESTION_INDEX':
      return { ...state, currentQuestionIndex: action.payload }
    case 'SAVE_RESPONSE':
      return {
        ...state,
        responses: { ...state.responses, [action.payload.question_id]: action.payload }
      }
    case 'ADD_LOG':
      return { ...state, proctoringLogs: [...state.proctoringLogs, action.payload] }
    case 'SET_OFFLINE':
      return { ...state, isOffline: action.payload }
    default:
      return state
  }
}

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    assessment: null,
    submissionId: null,
    currentQuestionIndex: 0,
    responses: {},
    proctoringLogs: [],
    isOffline: false
  })

  // Offline status listener
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_OFFLINE', payload: false })
      if (state.submissionId) {
        assessmentService.syncResponses(state.submissionId)
      }
    }
    const handleOffline = () => dispatch({ type: 'SET_OFFLINE', payload: true })

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    dispatch({ type: 'SET_OFFLINE', payload: !navigator.onLine })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [state.submissionId])

  // Proctoring listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const log = {
          timestamp: Date.now(),
          event: 'tab_switch',
          details: 'User switched tabs or minimized the window',
          synced: false
        }
        idb.addLog(log)
        dispatch({ type: 'ADD_LOG', payload: log })
      }
    }

    const handleCopyPaste = (e: Event) => {
      e.preventDefault()
      const log = {
        timestamp: Date.now(),
        event: 'integrity_violation',
        details: `Attempted ${e.type}`,
        synced: false
      }
      idb.addLog(log)
      dispatch({ type: 'ADD_LOG', payload: log })
      alert(`Copy/Paste/Cut is blocked for integrity. This event has been logged.`)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('copy', handleCopyPaste)
    document.addEventListener('paste', handleCopyPaste)
    document.addEventListener('cut', handleCopyPaste)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('copy', handleCopyPaste)
      document.removeEventListener('paste', handleCopyPaste)
      document.removeEventListener('cut', handleCopyPaste)
    }
  }, [])

  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>
      {children}
    </AssessmentContext.Provider>
  )
}

export function useAssessment() {
  const context = useContext(AssessmentContext)
  if (!context) throw new Error('useAssessment must be used within AssessmentProvider')
  return context
}
