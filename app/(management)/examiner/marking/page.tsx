'use client'

import React, { useEffect, useState } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { BookOpen, ChevronDown, ChevronUp, FileText, Users, CheckCircle } from 'lucide-react'
import { assessmentService } from '@/lib/services/AssessmentService'
import { useRouter } from 'next/navigation'

import { Tables } from '@/lib/types/database.types'

type AssessmentWithDetails = Tables<'assessments'> & {
  questions: (Tables<'questions'> & {
    marking_keys: Tables<'marking_keys'>[]
  })[]
}

export default function MarkingDashboard() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<AssessmentWithDetails[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await assessmentService.getPublishedAssessments()
        setAssessments(data as unknown as AssessmentWithDetails[])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="animate-pulse flex flex-col gap-6">
    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
  </div>

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Marking & Grading</h1>
        <p className="text-slate-500 font-medium">Manage marking keys and grade student submissions.</p>
      </header>

      <div className="flex flex-col gap-4">
        {assessments.length === 0 ? (
          <Card className="p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <BookOpen size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">No Published Assessments</h3>
              <p className="text-slate-500">Publish an assessment to start marking submissions.</p>
            </div>
          </Card>
        ) : (
          assessments.map((a) => {
            const isExpanded = expandedId === a.id
            const hasMarkingKey = a.questions?.some((q) => {
              const mk = q.marking_keys
              if (!mk) return false
              return Array.isArray(mk) ? mk.length > 0 : true
            })
            
            return (
              <Card 
                key={a.id} 
                className={`transition-all overflow-hidden ${isExpanded ? 'ring-2 ring-teal-500 border-transparent shadow-xl' : 'hover:border-teal-200'}`}
              >
                <div 
                  className="p-6 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{a.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-wider">{a.assessment_code}</span>
                        <span className="text-slate-400 text-xs font-medium">{a.questions?.length || 0} Questions</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {hasMarkingKey && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-600 rounded-full">
                        <CheckCircle size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Key Set</span>
                      </div>
                    )}
                    {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/50 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-8 text-sm">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</span>
                        <p className="text-slate-600 leading-relaxed">{a.description || 'No description provided.'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                          <span className="font-bold text-slate-800">{a.duration_minutes} Minutes</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Late Policy</span>
                          <span className="font-bold text-slate-800 capitalize">{a.late_policy || 'None'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                      <Button 
                        icon={Users} 
                        className="flex-1 rounded-xl"
                        onClick={() => router.push(`/examiner/marking/${a.id}/submissions`)}
                      >
                        View Submissions
                      </Button>
                      <Button 
                        variant="secondary" 
                        icon={CheckCircle} 
                        className="flex-1 rounded-xl"
                        onClick={() => router.push(`/examiner/marking/${a.id}/key`)}
                      >
                        {hasMarkingKey ? 'Update Marking Key' : 'Create Marking Key'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
