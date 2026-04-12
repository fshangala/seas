'use client'

import React, { useEffect, useState } from 'react'
import { Card, Button } from '@/components/ui'
import { Plus, BookOpen, Clock, Users, ChevronRight, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ExaminerDashboard() {
  const [stats, setStats] = useState({
    activeAssessments: 0,
    totalSubmissions: 0,
    pendingGrading: 0
  })
  const [recentAssessments, setRecentAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { count: aCount } = await supabase.from('assessments').select('*', { count: 'exact', head: true })
        const { count: sCount } = await supabase.from('submissions').select('*', { count: 'exact', head: true })
        const { count: pCount } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('grading_status', 'pending')

        setStats({
          activeAssessments: aCount || 0,
          totalSubmissions: sCount || 0,
          pendingGrading: pCount || 0
        })

        const { data: assessments } = await supabase
          .from('assessments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3)
        
        setRecentAssessments(assessments || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  if (loading) return <div className="animate-pulse flex flex-col gap-8">
    <div className="h-12 w-48 bg-slate-200 rounded-2xl mb-4" />
    <div className="grid grid-cols-3 gap-6">
      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl" />)}
    </div>
  </div>

  return (
    <div className="flex flex-col gap-12">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Examiner Dashboard</h1>
          <p className="text-slate-500 font-medium">Welcome back. Here is what's happening today.</p>
        </div>
        <Button icon={Plus}>Create New Assessment</Button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="flex items-center gap-6 p-8 bg-linear-to-br from-teal-50 to-white border-teal-100">
          <div className="w-14 h-14 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
            <BookOpen size={28} />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-slate-800">{stats.activeAssessments}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Active Assessments</span>
          </div>
        </Card>

        <Card className="flex items-center gap-6 p-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-lg shadow-slate-800/20">
            <Users size={28} />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-slate-800">{stats.totalSubmissions}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Submissions</span>
          </div>
        </Card>

        <Card className="flex items-center gap-6 p-8 bg-linear-to-br from-orange-50 to-white border-orange-100">
          <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Clock size={28} />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-slate-800">{stats.pendingGrading}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Grading</span>
          </div>
        </Card>
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-12 gap-12">
        {/* Recent Assessments */}
        <div className="col-span-8 flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-slate-800">Recent Assessments</h2>
          <div className="flex flex-col gap-4">
            {recentAssessments.map((a) => (
              <Card key={a.id} className="flex items-center justify-between p-6 group cursor-pointer hover:border-teal-200 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-teal-600 transition-colors">{a.title}</h3>
                    <p className="text-slate-400 text-sm font-medium">Code: {a.assessment_code} &bull; {a.duration_minutes} mins</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-300 group-hover:text-teal-400 group-hover:translate-x-1 transition-all">
                  <span className="text-xs font-bold uppercase tracking-widest">Manage</span>
                  <ChevronRight size={20} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Insights */}
        <Card className="col-span-4 p-8 flex flex-col gap-6 slate-gradient text-white border-0 shadow-2xl">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-teal-400" />
            <h2 className="text-xl font-bold">System Insights</h2>
          </div>
          <p className="text-slate-300 text-sm font-medium leading-relaxed italic opacity-80">
            "Candidate activity usually peaks between 10 AM and 2 PM. Ensure the sync engine is monitoring traffic during these windows."
          </p>
          <div className="mt-4 pt-6 border-t border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Server Health</span>
              <span className="text-teal-400 font-bold text-xs uppercase">Optimal</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-teal-500 h-full w-[94%]" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
