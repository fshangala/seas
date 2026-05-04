'use client'

import React, { useEffect, useState, use } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { assessmentService } from '@/lib/services/AssessmentService'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import Image from 'next/image'

import { Tables } from '@/lib/types/database.types'
import { aiMarking } from '@/lib/actions/ai_marking'

type FullSubmission = Tables<'submissions'> & {
  assessments: Tables<'assessments'>
  candidates?: Tables<'candidates'>
  responses: (Tables<'responses'> & {
    questions: Tables<'questions'> & {
      options: Tables<'options'>[]
      marking_keys: Tables<'marking_keys'>[]
    }
  })[]
}

export default function GradeSubmission({ params }: { params: Promise<{ id: string, submissionId: string }> }) {
  const router = useRouter()
  const { submissionId } = use(params)
  const [submission, setSubmission] = useState<FullSubmission | null>(null)
  const [grades, setGrades] = useState<Record<string, number>>({})
  const [showKeys, setShowKeys] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // AI Marking States
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, { marks: number, reasoning: string }>>({})
  const [submissionAiMarkingLoading, setSubmissionAiMarkingLoading] = useState(false)

  const handleAiMark = async (resp: FullSubmission['responses'][0]) => {
    const q = resp.questions
    const mk = q.marking_keys

    setAiLoading(prev => ({ ...prev, [resp.id]: true }))
    try {
      const res = await aiMarking({question: q, response: resp, marking_key: mk[0]});
      setGrades(prev => ({ ...prev, [resp.id]: res.marks }))
      setAiSuggestions(prev => ({...prev, [resp.id]: res}))
    } catch (error) {
      console.error('AI Marking Error:', error)
    } finally {
      setAiLoading(prev => ({ ...prev, [resp.id]: false }))
    }
  }

  const handleAiSubmissionMarking = async () => {
    setSubmissionAiMarkingLoading(true)
    for (const resp of submission?.responses || []) {
      await handleAiMark(resp)
    }
    setSubmissionAiMarkingLoading(false)
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await assessmentService.getSubmissionWithResponses(submissionId)
        const typedData = data as unknown as FullSubmission
        setSubmission(typedData)
        
        // Initialize grades state
        const initialGrades: Record<string, number> = {}
        typedData.responses.forEach((r) => {
          initialGrades[r.id] = r.marks_awarded || 0
        })
        setGrades(initialGrades)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [submissionId])

  const handleSave = async () => {
    if (!submission) return
    setSaving(true)
    try {
      const responseGrades = submission.responses.map((r) => ({
        id: r.id,
        marks_awarded: grades[r.id],
        is_graded: true
      }))
      await assessmentService.saveGrades(submissionId, responseGrades)
      router.back()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const updateGrade = (responseId: string, marks: number, max: number) => {
    const val = Math.min(Math.max(0, marks), max)
    setGrades(prev => ({ ...prev, [responseId]: val }))
  }

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-12 w-64 bg-slate-200 rounded-2xl" />
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-200 rounded-2xl" />)}
    </div>
  </div>

  return (
    <div className="flex flex-col gap-12 max-w-5xl mx-auto">
      <header className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md py-4 z-10 border-b border-slate-200 -mx-12 px-12">
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-teal-600 transition-colors font-bold text-xs uppercase tracking-widest mb-2"
          >
            <ChevronLeft size={16} />
            Back to Submissions
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Grading: {submission?.candidates?.first_name} {submission?.candidates?.last_name}
            </h1>
            <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              ID: {submission?.candidates?.student_id}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="secondary" 
            icon={showKeys ? EyeOff : Eye} 
            onClick={() => setShowKeys(!showKeys)}
            className="rounded-xl"
          >
            {showKeys ? 'Hide Marking Key' : 'Show Marking Key'}
          </Button>
          <Button 
            icon={Sparkles} 
            onClick={handleAiSubmissionMarking} 
            disabled={submissionAiMarkingLoading}
            className="rounded-xl shadow-lg shadow-teal-500/20"
          >
            {submissionAiMarkingLoading ? 'AI Marking...' : 'Mark All with AI'}
          </Button>
          <Button 
            icon={Save} 
            onClick={handleSave} 
            disabled={saving}
            className="rounded-xl shadow-lg shadow-teal-500/20"
          >
            {saving ? 'Completing...' : 'Complete Grading'}
          </Button>
          </div>
          </header>

          <div className="flex flex-col gap-8 pb-20">
          {submission?.responses.map((resp, index) => {
          const q = resp.questions
          const mk = q.marking_keys
          const key = (Array.isArray(mk) ? mk[0] : mk) as Tables<'marking_keys'> | undefined
          const isMcq = q.question_type === 'mcq'
          const currentGrade = grades[resp.id]

          
          return (
            <Card key={resp.id} className="p-8 flex flex-col gap-8 relative overflow-hidden">
              {/* Question Header */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-black text-sm shrink-0">
                  {index + 1}
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <p className="font-bold text-slate-800 text-lg leading-relaxed">{q.content}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {q.question_type}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                      {q.marks_possible} Marks Possible
                    </span>
                  </div>
                </div>
                
                {/* Grade Input */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Award Marks</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="0" 
                      max={q.marks_possible}
                      value={currentGrade}
                      onChange={(e) => updateGrade(resp.id, parseFloat(e.target.value) || 0, q.marks_possible)}
                      className="w-20 p-2 text-center font-black text-xl border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden transition-all"
                    />
                    <span className="text-slate-300 font-black">/</span>
                    <span className="text-slate-400 font-black">{q.marks_possible}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-8">
                {/* Student Response */}
                <div className={`${showKeys ? 'col-span-6' : 'col-span-12'} flex flex-col gap-4 transition-all duration-300`}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    Candidate Response
                  </label>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 min-h-[100px]">
                    {isMcq ? (
                      <div className="flex flex-col gap-2">
                        {q.options?.map((opt) => (
                          <div
                            key={opt.id}
                            className={`flex items-center gap-4 p-4 rounded-xl border ${
                              resp.selected_option_id === opt.id 
                              ? 'border-slate-800 bg-slate-800 text-white' 
                              : 'border-slate-200 bg-white text-slate-400'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${resp.selected_option_id === opt.id ? 'bg-teal-400' : 'bg-slate-200'}`} />
                            <span className="font-medium">{opt.content}</span>
                          </div>
                        ))}
                      </div>
                    ) : resp.image_response_url ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-sm">
                        <Image 
                          src={resp.image_response_url} 
                          alt="Handwritten response" 
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <p className="text-slate-700 font-medium whitespace-pre-wrap leading-relaxed italic">
                        &quot;{resp.text_value || 'No response provided.'}&quot;
                      </p>
                    )}
                  </div>

                  {/* AI Marking Button */}
                  <div className="flex items-center gap-4 mt-2">
                    <Button
                      variant="secondary"
                      icon={aiLoading[resp.id] ? Loader2 : Sparkles}
                      onClick={() => handleAiMark(resp)}
                      disabled={aiLoading[resp.id]}
                      className={`rounded-xl text-[10px] font-black uppercase tracking-widest ${aiLoading[resp.id] ? 'animate-pulse' : ''}`}
                    >
                      {aiLoading[resp.id] ? 'AI Marking...' : 'Mark with AI'}
                    </Button>
                  </div>

                  {/* AI Suggestion Display */}
                  {aiSuggestions[resp.id] && (
                    <div className="mt-4 p-6 bg-teal-50 border border-teal-100 rounded-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-teal-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-teal-600">AI Evaluation Agent</span>
                        </div>
                        <span className="px-3 py-1 bg-teal-600 text-white rounded-lg text-xs font-black">
                          {aiSuggestions[resp.id].marks} / {q.marks_possible} Marks Suggested
                        </span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {aiSuggestions[resp.id].reasoning}
                      </p>
                      <div className="text-[10px] font-bold text-teal-400 italic">
                        * Marks have been automatically filled in the input field.
                      </div>
                    </div>
                  )}
                </div>

                {/* Marking Key (Conditional) */}
                {showKeys && (
                  <div className="col-span-6 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <label className="text-[10px] font-black uppercase tracking-widest text-teal-600 flex items-center gap-2">
                      <CheckCircle2 size={12} />
                      Marking Key Reference
                    </label>
                    <div className="p-6 bg-teal-50/50 rounded-2xl border border-teal-100 h-full">
                      {isMcq ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-teal-700 mb-2">Correct Option:</p>
                          <div className="p-4 bg-white border border-teal-200 rounded-xl text-teal-900 font-bold shadow-sm">
                            {q.options?.find((o) => o.id === key?.correct_option_id)?.content || 'No key set'}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-teal-700">Expected Match / Keywords:</p>
                            <p className="text-teal-900 font-bold leading-relaxed">{key?.correct_text_match || 'No key set'}</p>
                          </div>
                          {key?.grading_notes && (
                            <div className="flex flex-col gap-2 pt-4 border-t border-teal-100">
                              <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1">
                                <AlertCircle size={10} />
                                Examiner Notes:
                              </p>
                              <p className="text-slate-600 text-xs leading-relaxed italic">{key.grading_notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
