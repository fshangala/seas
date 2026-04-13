'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Input, FormGroup } from '@/components/ui'
import { ChevronLeft, Save, BookOpen, Clock, FileText } from 'lucide-react'
import { assessmentService } from '@/lib/services/AssessmentService'

export default function NewAssessmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    duration_minutes: 60,
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) return setError('Title is required')

    setLoading(true)
    setError(null)

    try {
      const assessment = await assessmentService.createAssessment(
        formData.title,
        formData.duration_minutes,
        formData.description
      )
      router.push(`/examiner/assessments/${assessment.id}/edit`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assessment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-12 max-w-3xl mx-auto w-full">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="secondary" 
              className="px-3 py-1.5 h-auto text-xs" 
              icon={ChevronLeft}
              onClick={() => router.back()}
            >
              Back
            </Button>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">New Assessment</h1>
          <p className="text-slate-500 font-medium">Define the core details of your assessment.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="p-8 flex flex-col gap-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border-2 border-red-100 animate-in shake duration-500">
              {error}
            </div>
          )}

          <FormGroup label="Assessment Title">
            <Input 
              icon={BookOpen}
              placeholder="e.g., Mid-Term Mathematics 2026"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </FormGroup>

          <FormGroup label="Duration (Minutes)">
            <Input 
              icon={Clock}
              type="number"
              placeholder="60"
              value={formData.duration_minutes}
              onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
              required
              min={1}
            />
          </FormGroup>

          <FormGroup label="Description (Optional)">
            <div className="relative">
              <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
              <textarea 
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-hidden bg-slate-50 font-medium text-slate-800 transition-all min-h-32"
                placeholder="Briefly describe the assessment goals or instructions..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </FormGroup>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              icon={Save} 
              className="px-12 py-4 text-lg"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Continue to Questions'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
