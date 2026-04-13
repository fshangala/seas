'use client'

import React, { useEffect, useState } from 'react'
import { Card, StatsCard } from '@/components/ui'
import { Users, ShieldCheck, Activity, Database, ChevronRight, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Tables } from '@/lib/types/database.types'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAssessments: 0,
    systemLogs: 0
  })
  const [recentLogs, setRecentLogs] = useState<Tables<'audit_logs'>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAdminData() {
      try {
        const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        const { count: aCount } = await supabase.from('assessments').select('*', { count: 'exact', head: true })
        const { count: lCount } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true })

        setStats({
          totalUsers: uCount || 0,
          totalAssessments: aCount || 0,
          systemLogs: lCount || 0
        })

        const { data: logs } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)
        
        setRecentLogs(logs || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadAdminData()
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
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">System Administration</h1>
          <p className="text-slate-500 font-medium">Global overview and system-wide management.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold bg-white text-slate-800 shadow-sm border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer">
            <UserPlus size={20} />
            Add Examiner
          </button>
        </div>
      </header>

      {/* Admin Stats */}
      <div className="grid grid-cols-3 gap-6">
        <StatsCard 
          label="Total Staff" 
          value={stats.totalUsers} 
          icon={Users} 
          colorClass="bg-indigo-500 shadow-indigo-500/20" 
        />
        <StatsCard 
          label="Total Assessments" 
          value={stats.totalAssessments} 
          icon={ShieldCheck} 
          colorClass="bg-teal-500 shadow-teal-500/20" 
        />
        <StatsCard 
          label="Audit Entries" 
          value={stats.systemLogs} 
          icon={Activity} 
          colorClass="bg-slate-800 shadow-slate-800/20" 
        />
      </div>

      <div className="grid grid-cols-12 gap-12">
        {/* Audit Trail */}
        <div className="col-span-8 flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-slate-800">Recent Audit Trail</h2>
          <Card className="p-0 overflow-hidden border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Entity</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{log.action}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
                {recentLogs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">No recent logs found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>

        {/* System Status */}
        <div className="col-span-4 flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-slate-800">Resources</h2>
          <div className="flex flex-col gap-4">
            <Card className="flex items-center justify-between p-6 hover:border-teal-200 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <Database size={20} className="text-slate-400 group-hover:text-teal-500" />
                <span className="font-bold text-slate-700">Storage Usage</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Card>
            <Card className="flex items-center justify-between p-6 hover:border-teal-200 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <ShieldCheck size={20} className="text-slate-400 group-hover:text-teal-500" />
                <span className="font-bold text-slate-700">Security Audit</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
