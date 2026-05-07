'use client'

import React, { useState } from 'react'
import Card from './Card'
import Button from './Button'
import { Copy, Upload, Code, Check, AlertCircle } from 'lucide-react'
import { useAlert } from '@/lib/viewmodels/AlertContext'
import { bulkUploadQuestionsAction } from '@/lib/actions/assessments'

interface QuestionJsonFormProps {
  assessmentId: string
  onSuccess?: () => void
  onCancel?: () => void
}

const AI_PROMPT_TEMPLATE = `Generate a set of questions for an assessment. 
The output must be ONLY a JSON array of objects conforming to this TypeScript interface:

interface BulkMarkingKey {
  is_auto_mark?: boolean;
  correct_option_index?: number; // 0-based index of the correct option in the options array (for MCQ)
  correct_text_match?: string; // Correct text for auto-marking (for Short Answer)
  grading_notes?: string;
}

interface BulkQuestion {
  content: string;
  question_type: 'mcq' | 'short_answer' | 'image_upload';
  marks_possible: number;
  options?: string[]; // Required for mcq, leave out for others
  marking_key?: BulkMarkingKey;
}

Example format:
[
  {
    "content": "What is the capital of France?",
    "question_type": "mcq",
    "marks_possible": 1,
    "options": ["Paris", "London", "Berlin", "Madrid"],
    "marking_key": {
      "is_auto_mark": true,
      "correct_option_index": 0
    }
  }
]

Please provide only the JSON code block.`

export default function QuestionJsonForm({ assessmentId, onSuccess, onCancel }: QuestionJsonFormProps) {
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { showAlert } = useAlert()

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showAlert({
      title: 'Prompt Copied',
      message: 'The AI instructions have been copied to your clipboard. Paste them into ChatGPT or Claude to generate your questions.',
      variant: 'success'
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jsonText.trim()) return

    setLoading(true)
    try {
      const result = await bulkUploadQuestionsAction(assessmentId, jsonText)
      if (result.error) {
        showAlert({
          title: 'Import Error',
          message: result.error,
          variant: 'danger'
        })
      } else {
        showAlert({
          title: 'Import Successful',
          message: 'Questions have been uploaded and added to the assessment.',
          variant: 'success'
        })
        setJsonText('')
        if (onSuccess) onSuccess()
      }
    } catch (err) {
      console.error(err)
      showAlert({
        title: 'Error',
        message: 'An unexpected error occurred during import.',
        variant: 'danger'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8 border-teal-200 bg-white animate-in zoom-in-95 duration-300">
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Code className="text-teal-500" />
              Bulk Question Import
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              Paste question JSON or use the AI prompt helper.
            </p>
          </div>
          <Button 
            variant="secondary" 
            className={`px-4 py-2 h-auto text-xs transition-all ${copied ? 'bg-teal-500 text-white border-teal-500' : ''}`}
            icon={copied ? Check : Copy}
            onClick={handleCopyPrompt}
          >
            {copied ? 'Prompt Copied' : 'Copy AI Prompt'}
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="relative">
            <textarea 
              className="w-full p-6 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-hidden bg-slate-50 font-mono text-xs text-slate-700 transition-all min-h-64 leading-relaxed"
              placeholder='[ { "content": "Question text...", "question_type": "mcq", ... } ]'
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              disabled={loading}
            />
            {jsonText.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle size={32} className="text-slate-300" />
                  <span className="text-sm font-bold text-slate-400">Paste JSON here</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="secondary" 
              className="flex-1" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              icon={Upload} 
              disabled={loading || !jsonText.trim()}
            >
              {loading ? 'Importing...' : 'Bulk Import Questions'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
