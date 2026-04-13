'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@/components/ui'
import { ShieldCheck, BookOpen, Clock, Fingerprint } from 'lucide-react'
import { assessmentService } from '@/lib/services/AssessmentService'

export default function Home() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleEnter = async () => {
    if (!code) return setError('Please enter an Assessment Code')
    setLoading(true)
    setError('')
    
    try {
      await assessmentService.getAssessmentByCode(code.toUpperCase())
      router.push(`/assessment/${code.toUpperCase()}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Assessment not found'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-4xl w-full flex flex-col gap-12">
        {/* Hero Section */}
        <div className="text-center flex flex-col items-center gap-6 relative">
          <button 
            onClick={() => router.push('/login')}
            className="absolute -top-4 -right-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all uppercase tracking-widest cursor-pointer"
          >
            <ShieldCheck size={14} />
            Staff Portal
          </button>
          <div className="w-24 h-24 teal-gradient rounded-3xl rotate-12 flex items-center justify-center text-white shadow-2xl">
            <ShieldCheck size={48} className="-rotate-12" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-5xl font-black text-slate-800 tracking-tight">SEAS</h1>
            <p className="text-xl text-slate-500 font-medium tracking-wide">Smart Examination & Assessment System</p>
          </div>
        </div>

        {/* Entry Card */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="flex flex-col gap-8 justify-between p-10 border-teal-100 bg-linear-to-b from-white to-teal-50/30">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-slate-800">Candidate Entrance</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                Enter your Assessment Code to begin or continue your evaluation.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Assessment Code (e.g. EXAM-2024)" 
                className="w-full p-6 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-hidden bg-white font-black tracking-widest text-2xl uppercase text-center"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
              />
              {error && <p className="text-red-500 font-bold text-sm px-2 text-center">{error}</p>}
              <Button onClick={handleEnter} disabled={loading} className="py-5 text-xl">
                {loading ? 'Verifying...' : 'Enter Assessment Room'}
              </Button>
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="flex items-center gap-6 p-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Offline-Ready</h3>
                <p className="text-slate-500 text-sm font-medium">Continue working even if your connection drops.</p>
              </div>
            </Card>

            <Card className="flex items-center gap-6 p-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-600">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Auto-Save</h3>
                <p className="text-slate-500 text-sm font-medium">Every keystroke is saved locally in real-time.</p>
              </div>
            </Card>

            <Card className="flex items-center gap-6 p-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Fingerprint size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Integrity Lock</h3>
                <p className="text-slate-500 text-sm font-medium">Native prevention of copy-paste & tab-switching.</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-slate-400 font-medium text-sm flex items-center justify-center gap-4">
          <span>&copy; 2024 SEAS Assessment Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          <span>v1.0.0-Stable</span>
        </footer>
      </div>
    </div>
  )
}
