'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button } from '@/components/ui'
import { 
  Plus, BookOpen, Clock, ChevronRight, 
  Search, Filter, LayoutDashboard, FileText
} from 'lucide-react'
import { assessmentService } from '@/lib/services/AssessmentService'
import { Tables } from '@/lib/types/database.types'

type AssessmentWithCount = Tables<'assessments'> & {
  questions: { count: number }[]
}

export default function AssessmentsListPage() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<AssessmentWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadAssessments() {
      try {
        const data = await assessmentService.getExaminerAssessments()
        setAssessments(data as unknown as AssessmentWithCount[])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadAssessments()
  }, [])

  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      const matchesFilter = 
        filter === 'all' || 
        (filter === 'published' && a.is_published) || 
        (filter === 'draft' && !a.is_published)
      
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesFilter && matchesSearch
    })
  }, [assessments, filter, searchQuery])

  if (loading) return <div className="animate-pulse flex flex-col gap-8">
    <div className="h-12 w-48 bg-slate-200 rounded-2xl mb-4" />
    <div className="flex gap-4 mb-8">
      {[1, 2, 3].map(i => <div key={i} className="h-10 w-24 bg-slate-200 rounded-xl" />)}
    </div>
    <div className="flex flex-col gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
    </div>
  </div>

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="secondary" 
              className="px-3 py-1.5 h-auto text-xs" 
              icon={LayoutDashboard}
              onClick={() => router.push('/examiner/dashboard')}
            >
              Dashboard
            </Button>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Manage Assessments</h1>
          <p className="text-slate-500 font-medium">Create, edit, and publish your academic assessments.</p>
        </div>
        <Button icon={Plus} onClick={() => router.push('/examiner/assessments/new')}>Create New</Button>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search assessments by title..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-hidden bg-slate-50 font-medium text-slate-800 transition-all text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {filteredAssessments.map((a) => (
          <Card 
            key={a.id} 
            className="flex items-center justify-between p-6 group cursor-pointer hover:border-teal-200 transition-all"
            onClick={() => router.push(`/examiner/assessments/${a.id}/edit`)}
          >
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                a.is_published ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'
              }`}>
                <BookOpen size={24} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-teal-600 transition-colors">{a.title}</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                    a.is_published ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {a.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-slate-400 text-sm font-medium flex items-center gap-1.5">
                    <Clock size={14} /> {a.duration_minutes} mins
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-slate-400 text-sm font-medium flex items-center gap-1.5">
                    <FileText size={14} /> {a.questions?.[0]?.count || 0} Questions
                  </span>
                  {a.is_published && (
                    <>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-teal-600 font-bold text-sm tracking-tight">Code: {a.assessment_code}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <ChevronRight className="text-slate-200 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" size={24} />
          </Card>
        ))}

        {filteredAssessments.length === 0 && (
          <Card className="p-20 flex flex-col items-center justify-center text-center bg-slate-50/50 border-dashed border-4 border-slate-100">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
              <Filter size={32} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-400">No assessments found</h3>
            <p className="text-slate-300 font-medium max-w-xs mt-2">
              Try adjusting your filters or search query to find what you&apos;re looking for.
            </p>
            <Button 
              variant="secondary" 
              className="mt-8"
              onClick={() => {
                setFilter('all')
                setSearchQuery('')
              }}
            >
              Clear all filters
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
