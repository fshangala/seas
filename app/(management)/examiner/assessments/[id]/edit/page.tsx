'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'
import FormGroup from '@/components/FormGroup'
import { 
  Plus, Save, Trash2, LayoutList, 
  CheckCircle2, AlertTriangle, Send, GripVertical,
  LayoutDashboard, BookOpen, Share2, Check, Settings, Copy,
  Clock, FileText, Upload
} from 'lucide-react'
import { assessmentService } from '@/lib/services/AssessmentService'
import { useAlert } from '@/lib/viewmodels/AlertContext'
import { supabase } from '@/lib/supabase'
import { Tables } from '@/lib/types/database.types'

type FullQuestion = Tables<'questions'> & {
  options: Tables<'options'>[]
}

export default function EditAssessmentPage() {
  const { id } = useParams()
  const router = useRouter()
  const { showAlert } = useAlert()
  const [assessment, setAssessment] = useState<Tables<'assessments'> | null>(null)
  const [questions, setQuestions] = useState<FullQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [copying, setCopying] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [clearing, setClearing] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    title: '',
    duration_minutes: 0,
    description: ''
  })
  const [showSettings, setShowSettings] = useState(false)

  // Form state for adding/editing questions
  const [editingQuestion, setEditingQuestion] = useState<Partial<FullQuestion> | null>(null)

  const loadQuestions = useCallback(async () => {
    const { data: qData, error: qError } = await supabase
      .from('questions')
      .select('*, options(*)')
      .eq('assessment_id', id as string)
      .order('order_index', { ascending: true })

    if (qError) throw qError
    setQuestions(qData || [])
  }, [id])

  useEffect(() => {
    async function loadData() {
      try {
        const { data: aData, error: aError } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', id as string)
          .single()
        
        if (aError) throw aError
        setAssessment(aData)
        setSettings({
          title: aData.title,
          duration_minutes: aData.duration_minutes,
          description: aData.description || ''
        })

        await loadQuestions()
      } catch (err) {
        console.error(err)
        showAlert({
          title: 'Error',
          message: 'Failed to load assessment data.',
          variant: 'danger'
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, loadQuestions, showAlert])

  const handleUpdateSettings = async () => {
    if (!assessment) return
    setSavingSettings(true)
    try {
      const updated = await assessmentService.updateAssessment(assessment.id, settings)
      setAssessment(updated)
      setShowSettings(false)
      showAlert({
        title: 'Settings Saved',
        message: 'Assessment settings updated successfully!',
        variant: 'success'
      })
    } catch (err) {
      console.error(err)
      showAlert({
        title: 'Error',
        message: 'Failed to update settings',
        variant: 'danger'
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleDuplicate = async () => {
    showAlert({
      title: 'Duplicate Assessment',
      message: 'This will create a new draft copy of this assessment. Continue?',
      confirmLabel: 'Duplicate',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        setDuplicating(true)
        try {
          const duplicate = await assessmentService.duplicateAssessment(id as string)
          router.push(`/examiner/assessments/${duplicate.id}/edit`)
        } catch (err) {
          console.error(err)
          showAlert({
            title: 'Error',
            message: 'Failed to duplicate assessment',
            variant: 'danger'
          })
        } finally {
          setDuplicating(false)
        }
      }
    })
  }

  const handleAddQuestion = (type: string) => {
    setEditingQuestion({
      question_type: type,
      content: '',
      marks_possible: 1,
      options: type === 'mcq' ? [] : undefined
    })
  }

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !editingQuestion.content) return

    try {
      if (editingQuestion.id) {
        // Update
        await assessmentService.updateQuestion(editingQuestion.id, {
          content: editingQuestion.content,
          question_type: editingQuestion.question_type,
          marks_possible: editingQuestion.marks_possible
        })
      } else {
        // Create
        await assessmentService.addQuestion(
          id as string,
          {
            content: editingQuestion.content,
            question_type: editingQuestion.question_type,
            marks_possible: editingQuestion.marks_possible,
            order_index: questions.length
          },
          editingQuestion.options?.map(o => o.content)
        )
      }
      await loadQuestions()
      setEditingQuestion(null)
      showAlert({
        title: 'Question Saved',
        message: 'The question has been updated in the assessment structure.',
        variant: 'success'
      })
    } catch (err) {
      console.error(err)
      showAlert({
        title: 'Error',
        message: 'Failed to save question',
        variant: 'danger'
      })
    }
  }

  const handleDeleteQuestion = async (qId: string) => {
    showAlert({
      title: 'Delete Question',
      message: 'Are you sure you want to remove this question?',
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await assessmentService.deleteQuestion(qId)
          setQuestions(prev => prev.filter(q => q.id !== qId))
        } catch (err) {
          console.error(err)
          showAlert({
            title: 'Error',
            message: 'Failed to delete question',
            variant: 'danger'
          })
        }
      }
    })
  }

  const handleClearAll = async () => {
    showAlert({
      title: 'Clear All Questions',
      message: 'Are you sure you want to delete ALL questions? This action cannot be undone.',
      confirmLabel: 'Clear All',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        setClearing(true)
        try {
          await assessmentService.clearQuestions(id as string)
          setQuestions([])
          showAlert({
            title: 'Questions Cleared',
            message: 'All questions have been removed from this assessment.',
            variant: 'success'
          })
        } catch (err) {
          console.error(err)
          showAlert({
            title: 'Error',
            message: 'Failed to clear questions',
            variant: 'danger'
          })
        } finally {
          setClearing(false)
        }
      }
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result
      if (typeof content !== 'string') return

      try {
        const jsonData = JSON.parse(content)
        if (!Array.isArray(jsonData)) throw new Error('Invalid format: Expected an array of questions')
        
        setUploading(true)
        await assessmentService.addQuestionsBulk(id as string, jsonData)
        await loadQuestions()
        showAlert({
          title: 'Import Successful',
          message: 'Questions have been uploaded and added to the assessment.',
          variant: 'success'
        })
      } catch (err) {
        console.error(err)
        showAlert({
          title: 'Import Error',
          message: `Failed to upload questions: ${err instanceof Error ? err.message : 'Invalid JSON'}`,
          variant: 'danger'
        })
      } finally {
        setUploading(false)
        event.target.value = '' // Reset input
      }
    }
    reader.readAsText(file)
  }

  const handlePublish = async () => {
    if (questions.length === 0) {
      return showAlert({
        title: 'Cannot Publish',
        message: 'Add at least one question before publishing.',
        variant: 'danger'
      })
    }

    showAlert({
      title: 'Publish Assessment',
      message: 'Once published, the assessment will be accessible via a code and cannot be modified. Continue?',
      confirmLabel: 'Publish Now',
      cancelLabel: 'Later',
      onConfirm: async () => {
        setPublishing(true)
        try {
          const updated = await assessmentService.publishAssessment(id as string)
          setAssessment(updated)
          showAlert({
            title: 'Assessment Published',
            message: `Assessment is now live! Access Code: ${updated.assessment_code}`,
            variant: 'success'
          })
        } catch (err) {
          console.error(err)
          showAlert({
            title: 'Publish Error',
            message: 'Failed to publish assessment',
            variant: 'danger'
          })
        } finally {
          setPublishing(false)
        }
      }
    })
  }

  const handleShareLink = () => {
    if (!assessment) return
    const url = `${window.location.origin}/assessment/${assessment.assessment_code}`
    navigator.clipboard.writeText(url)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  if (loading) return <div className="animate-pulse">Loading editor...</div>
  if (!assessment) return <div>Assessment not found.</div>

  return (
    <div className="flex flex-col gap-12">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="secondary" className="px-3 py-1.5 h-auto text-xs" icon={LayoutDashboard} onClick={() => router.push('/examiner/dashboard')}>
              Dashboard
            </Button>
            <Button variant="secondary" className="px-3 py-1.5 h-auto text-xs" icon={BookOpen} onClick={() => router.push('/examiner/assessments')}>
              Assessments
            </Button>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${assessment.is_published ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
              {assessment.is_published ? 'Published' : 'Draft'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">{assessment.title}</h1>
            {!assessment.is_published && (
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-slate-400 hover:text-teal-600 transition-colors"
                title="Edit Settings"
              >
                <Settings size={24} />
              </button>
            )}
          </div>
          <p className="text-slate-500 font-medium">
            {assessment.is_published 
              ? 'This assessment is published and cannot be modified.' 
              : 'Manage questions and assessment configuration.'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {assessment.is_published ? (
            <Button variant="secondary" icon={Copy} onClick={handleDuplicate} disabled={duplicating}>
              {duplicating ? 'Duplicating...' : 'Duplicate as Draft'}
            </Button>
          ) : (
            <Button icon={Send} onClick={handlePublish} disabled={publishing}>
              {publishing ? 'Publishing...' : 'Publish Assessment'}
            </Button>
          )}

          {assessment.is_published && (
            <Card className="px-6 py-3 bg-teal-50 border-teal-200 flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Access Code</span>
                <span className="text-2xl font-black text-slate-800 tracking-tighter">{assessment.assessment_code}</span>
              </div>
              <div className="h-10 w-[2px] bg-teal-100" />
              <Button 
                variant="secondary" 
                className={`px-4 py-2 h-auto text-xs transition-all ${copying ? 'bg-teal-500 text-white border-teal-500 hover:bg-teal-600' : ''}`}
                icon={copying ? Check : Share2}
                onClick={handleShareLink}
              >
                {copying ? 'Link Copied' : 'Copy Link'}
              </Button>
            </Card>
          )}
        </div>
      </header>

      {showSettings && !assessment.is_published && (
        <Card className="p-8 border-teal-200 bg-teal-50/30 animate-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <FormGroup label="Assessment Title">
                <Input 
                  value={settings.title}
                  onChange={e => setSettings({...settings, title: e.target.value})}
                  icon={BookOpen}
                />
              </FormGroup>
              <FormGroup label="Duration (Minutes)">
                <Input 
                  type="number"
                  value={settings.duration_minutes}
                  onChange={e => setSettings({...settings, duration_minutes: parseInt(e.target.value) || 0})}
                  icon={Clock}
                />
              </FormGroup>
            </div>
            <FormGroup label="Description">
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
                <textarea 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-hidden bg-white font-medium text-slate-800 transition-all min-h-32"
                  value={settings.description}
                  onChange={e => setSettings({...settings, description: e.target.value})}
                />
              </div>
            </FormGroup>
          </div>
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-teal-100">
            <Button variant="secondary" onClick={() => setShowSettings(false)}>Cancel</Button>
            <Button icon={Save} onClick={handleUpdateSettings} disabled={savingSettings}>
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-12">
        {/* Question List */}
        <div className="col-span-8 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <LayoutList className="text-teal-500" />
              Assessment Structure
            </h2>
            <div className="flex items-center gap-4">
              {!assessment.is_published && (
                <>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="json-upload"
                  />
                  <Button 
                    variant="secondary" 
                    className="px-3 py-1.5 h-auto text-xs" 
                    icon={Upload}
                    onClick={() => document.getElementById('json-upload')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload JSON'}
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="px-3 py-1.5 h-auto text-xs text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200" 
                    icon={Trash2}
                    onClick={handleClearAll}
                    disabled={clearing || questions.length === 0}
                  >
                    {clearing ? 'Clearing...' : 'Clear All'}
                  </Button>
                </>
              )}
              <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                {questions.length} Questions
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {questions.map((q, idx) => (
              <Card key={q.id} className="p-6 flex items-start gap-6 group hover:border-slate-200 transition-all relative">
                <div className="mt-1 text-slate-300">
                  <GripVertical size={20} />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded-full">
                      Q{idx + 1} &bull; {q.question_type?.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{q.marks_possible} Marks</span>
                  </div>
                  <p className="font-bold text-slate-800 leading-relaxed">{q.content}</p>
                  {q.question_type === 'mcq' && q.options && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {q.options.map(opt => (
                        <div key={opt.id} className="px-4 py-2 bg-slate-50 rounded-xl text-sm font-medium text-slate-500 border border-slate-100 italic">
                          {opt.content}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {!assessment.is_published && (
                  <button 
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </Card>
            ))}

            {questions.length === 0 && (
              <Card className="p-12 border-dashed border-4 border-slate-100 flex flex-col items-center justify-center text-center">
                <AlertTriangle size={48} className="text-slate-200 mb-4" />
                <h3 className="text-lg font-bold text-slate-400">No questions added yet</h3>
                <p className="text-slate-300 text-sm font-medium mt-1">Select a type below to start building.</p>
              </Card>
            )}

            {!assessment.is_published && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <button 
                  onClick={() => handleAddQuestion('mcq')}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-teal-400 hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition-all gap-2 group"
                >
                  <Plus size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Multiple Choice</span>
                </button>
                <button 
                  onClick={() => handleAddQuestion('short_answer')}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-teal-400 hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition-all gap-2 group"
                >
                  <Plus size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Short Answer</span>
                </button>
                <button 
                  onClick={() => handleAddQuestion('image_upload')}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-teal-400 hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition-all gap-2 group"
                >
                  <Plus size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Image Upload</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Editor Sidebar / Modal */}
        <div className="col-span-4">
          {editingQuestion ? (
            <Card className="p-8 sticky top-8 shadow-2xl border-teal-200 animate-in slide-in-from-right-8 duration-500">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Plus size={24} className="text-teal-500" />
                New {editingQuestion.question_type?.replace('_', ' ')}
              </h3>
              
              <div className="flex flex-col gap-6">
                <FormGroup label="Question Content">
                  <textarea 
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-hidden bg-slate-50 font-medium text-slate-800 transition-all min-h-24"
                    placeholder="Enter your question text here..."
                    value={editingQuestion.content}
                    onChange={e => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                  />
                </FormGroup>

                <FormGroup label="Marks Possible">
                  <Input 
                    type="number"
                    value={editingQuestion.marks_possible}
                    onChange={e => setEditingQuestion({ ...editingQuestion, marks_possible: parseInt(e.target.value) || 1 })}
                  />
                </FormGroup>

                {editingQuestion.question_type === 'mcq' && (
                  <FormGroup label="Options (One per line)">
                    <textarea 
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-hidden bg-slate-50 font-medium text-slate-800 transition-all min-h-24"
                      placeholder="Option A\nOption B\nOption C..."
                      onChange={e => {
                        const lines = e.target.value.split('\n').filter(l => l.trim() !== '')
                        setEditingQuestion({
                          ...editingQuestion,
                          options: lines.map((l, i) => ({ 
                            id: i.toString(), 
                            content: l,
                            question_id: editingQuestion.id || null
                          }))
                        })
                      }}
                    />
                  </FormGroup>
                )}

                <div className="flex gap-4 mt-4">
                  <Button variant="secondary" className="flex-1" onClick={() => setEditingQuestion(null)}>Cancel</Button>
                  <Button className="flex-1" icon={Save} onClick={handleSaveQuestion}>Save</Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 sticky top-8 bg-slate-50 border-dashed border-2 border-slate-200 flex flex-col gap-4 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center self-center shadow-sm">
                <CheckCircle2 size={32} className="text-teal-500" />
              </div>
              <h3 className="font-bold text-slate-800">Ready to Publish?</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Ensure all questions have correct marks and types. Once published, you can no longer add questions.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
