'use client'

import React, { useEffect, useState, use } from 'react'
import { Card, Button } from '@/components/ui'
import { assessmentService } from '@/lib/services/AssessmentService'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save, CheckCircle2, AlertCircle } from 'lucide-react'

import { Tables } from '@/lib/types/database.types'

type QuestionWithKey = Tables<'questions'> & {
  options: Tables<'options'>[]
  marking_keys: Tables<'marking_keys'>[]
}

export default function ManageMarkingKey({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [questions, setQuestions] = useState<QuestionWithKey[]>([])
  const [markingKeys, setMarkingKeys] = useState<Record<string, Partial<Tables<'marking_keys'>>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await assessmentService.getMarkingKeys(id)
        const typedData = data as unknown as QuestionWithKey[]
        setQuestions(typedData)
        
        // Initialize marking keys state
        const initialKeys: Record<string, Partial<Tables<'marking_keys'>>> = {}
        typedData.forEach((q) => {
          const key = q.marking_keys?.[0] || {
            question_id: q.id,
            correct_option_id: null,
            correct_text_match: '',
            grading_notes: '',
            is_auto_mark: q.question_type === 'mcq'
          }
          initialKeys[q.id] = key
        })
        setMarkingKeys(initialKeys)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const keysToSave = Object.values(markingKeys).map(k => ({
        ...k,
        // Ensure nulls for empty text
        correct_text_match: k.correct_text_match?.trim() || null,
        grading_notes: k.grading_notes?.trim() || null
      }))
      await assessmentService.saveMarkingKeys(keysToSave)
      router.back()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const updateKey = (questionId: string, updates: Partial<Tables<'marking_keys'>>) => {
    setMarkingKeys(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...updates }
    }))
  }

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-12 w-64 bg-slate-200 rounded-2xl" />
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-2xl" />)}
    </div>
  </div>

  return (
    <div className="flex flex-col gap-12 max-w-4xl mx-auto">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-teal-600 transition-colors font-bold text-xs uppercase tracking-widest mb-2"
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Set Marking Key</h1>
          <p className="text-slate-500 font-medium">Define correct answers and grading rubrics for this assessment.</p>
        </div>
        <Button 
          icon={Save} 
          onClick={handleSave} 
          disabled={saving}
          className="shadow-xl shadow-teal-500/20"
        >
          {saving ? 'Saving...' : 'Save All Keys'}
        </Button>
      </header>

      <div className="flex flex-col gap-8">
        {questions.map((q, index) => {
          const key = markingKeys[q.id]
          const isMcq = q.question_type === 'mcq'
          
          return (
            <Card key={q.id} className="p-8 flex flex-col gap-8">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-black text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-slate-800 text-lg leading-relaxed">{q.content}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {q.question_type}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                        {q.marks_possible} Marks
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-8">
                {/* Correct Answer Section */}
                <div className="col-span-7 flex flex-col gap-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-teal-500" />
                    Correct Answer
                  </label>
                  
                  {isMcq ? (
                    <div className="flex flex-col gap-2">
                      {q.options?.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => updateKey(q.id, { correct_option_id: opt.id })}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group ${
                            key?.correct_option_id === opt.id 
                            ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-sm' 
                            : 'border-slate-100 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            key?.correct_option_id === opt.id ? 'border-teal-500 bg-white' : 'border-slate-300'
                          }`}>
                            {key?.correct_option_id === opt.id && <div className="w-2.5 h-2.5 bg-teal-500 rounded-full" />}
                          </div>
                          <span className="font-medium">{opt.content}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea 
                      placeholder="Enter the expected answer or keywords..."
                      className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-teal-500 focus:outline-hidden transition-all min-h-[120px] font-medium text-slate-700"
                      value={key?.correct_text_match || ''}
                      onChange={(e) => updateKey(q.id, { correct_text_match: e.target.value })}
                    />
                  )}
                </div>

                {/* Grading Notes Section */}
                <div className="col-span-5 flex flex-col gap-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} className="text-orange-500" />
                    Grading Notes / Rubric
                  </label>
                  <textarea 
                    placeholder="Provide instructions for manual grading..."
                    className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-teal-500 focus:outline-hidden transition-all flex-1 min-h-[120px] text-xs font-medium text-slate-500 leading-relaxed"
                    value={key?.grading_notes || ''}
                    onChange={(e) => updateKey(q.id, { grading_notes: e.target.value })}
                  />
                  
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <input 
                      type="checkbox" 
                      id={`auto-${q.id}`}
                      checked={!!key?.is_auto_mark}
                      onChange={(e) => updateKey(q.id, { is_auto_mark: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <label htmlFor={`auto-${q.id}`} className="text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer">
                      Enable Auto-Marking
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-end pt-8">
        <Button 
          icon={Save} 
          onClick={handleSave} 
          disabled={saving}
          className="px-12 py-6 h-auto text-lg rounded-2xl shadow-2xl shadow-teal-500/20"
        >
          {saving ? 'Saving All Keys...' : 'Save All Marking Keys'}
        </Button>
      </div>
    </div>
  )
}
