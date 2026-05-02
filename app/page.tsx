'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  ShieldCheck, 
  BookOpen, 
  Clock, 
  Fingerprint, 
  Smartphone, 
  Zap, 
  Shield, 
  Globe, 
  User, 
  Mail, 
  Phone,
  Download,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { assessmentService } from '@/lib/services/AssessmentService'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function LandingPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

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

  const features = [
    {
      icon: BookOpen,
      title: "Offline-Ready",
      description: "Continue working even if your connection drops. Data is synced automatically when you're back online.",
      color: "text-teal-600",
      bg: "bg-teal-100"
    },
    {
      icon: Clock,
      title: "Real-time Auto-Save",
      description: "Every keystroke is saved locally in real-time, ensuring no progress is ever lost during an assessment.",
      color: "text-cyan-600",
      bg: "bg-cyan-100"
    },
    {
      icon: Fingerprint,
      title: "Proctoring Integrity",
      description: "Native prevention of copy-paste, tab-switching tracking, and visibility monitoring to ensure fairness.",
      color: "text-slate-600",
      bg: "bg-slate-100"
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "A fully responsive interface designed for candidates taking assessments on any device or screen size.",
      color: "text-teal-600",
      bg: "bg-teal-100"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Automated marking for MCQ and short answers provides immediate feedback and performance analytics.",
      color: "text-cyan-600",
      bg: "bg-cyan-100"
    },
    {
      icon: Shield,
      title: "Secure Architecture",
      description: "Built with Supabase and UUID-based routing to ensure candidate data and assessments are strictly protected.",
      color: "text-slate-600",
      bg: "bg-slate-100"
    }
  ]

  const contactDetails = [
    {
      icon: Phone,
      label: "WhatsApp / Phone",
      value: "+260974836436",
      href: "https://wa.me/260974836436"
    },
    {
      icon: Mail,
      label: "Email",
      value: "fshangala@gmail.com",
      href: "mailto:fshangala@gmail.com"
    },
    {
      icon: Globe,
      label: "Portfolio Website",
      value: "fshangala.github.io/profile",
      href: "https://fshangala.github.io/profile"
    },
    {
      icon: User,
      label: "LinkedIn",
      value: "linkedin.com/in/fshangala",
      href: "https://linkedin.com/in/fshangala"
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image src="/logo.png" alt="SEAS Logo" fill className="object-contain" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tight">SEAS</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-slate-500 hover:text-teal-600 transition-colors uppercase tracking-widest cursor-pointer">Features</a>
            <a href="#contact" className="text-sm font-bold text-slate-500 hover:text-teal-600 transition-colors uppercase tracking-widest cursor-pointer">Contact</a>
            {deferredPrompt && !isInstalled && (
              <button 
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-600 hover:bg-teal-100 transition-all uppercase tracking-widest cursor-pointer"
              >
                <Download size={14} />
                Install App
              </button>
            )}
            <button 
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all uppercase tracking-widest cursor-pointer shadow-lg shadow-slate-200"
            >
              <ShieldCheck size={16} />
              Staff Portal
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-teal-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-cyan-50 rounded-full blur-3xl opacity-50" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-xs font-black uppercase tracking-[0.2em]">
                <Zap size={14} />
                Smart Examination & Assessment System
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-slate-800 leading-[1.1] tracking-tight">
                Assessment for the <span className="text-teal-600">Modern Era.</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
                A resilient, offline-capable platform designed for academic integrity and candidate success. Securely host, manage, and grade assessments with ease.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => router.push('/candidate/dashboard')}
                  className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 cursor-pointer group"
                >
                  Go to My Dashboard
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                {deferredPrompt && (
                  <button 
                    onClick={handleInstallClick}
                    className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-slate-600 bg-white border-2 border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <Download size={20} />
                    Install Web App
                  </button>
                )}
              </div>
            </div>

            {/* Candidate Entrance Card */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-linear-to-r from-teal-500 to-cyan-500 rounded-[2.5rem] opacity-20 blur-2xl group-hover:opacity-30 transition-opacity" />
              <Card className="relative p-10 border-teal-100 bg-white/80 backdrop-blur-xl shadow-2xl flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Candidate Entrance</h2>
                  <p className="text-slate-500 font-medium">
                    Enter your unique Assessment Code to begin.
                  </p>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="EXAM-CODE-2024" 
                      className="w-full p-6 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-hidden bg-slate-50 font-black tracking-widest text-2xl uppercase text-center placeholder:text-slate-200"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                    />
                  </div>
                  {error && (
                    <div className="p-4 rounded-xl bg-red-50 text-red-500 text-sm font-bold text-center animate-in slide-in-from-top-2">
                      {error}
                    </div>
                  )}
                  <Button onClick={handleEnter} loading={loading} className="py-5 text-xl">
                    Enter Assessment Room
                  </Button>
                </div>

                <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <CheckCircle2 size={14} className="text-teal-500" />
                    Offline-Ready
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <CheckCircle2 size={14} className="text-teal-500" />
                    Auto-Saving
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <CheckCircle2 size={14} className="text-teal-500" />
                    Secure Lock
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <CheckCircle2 size={14} className="text-teal-500" />
                    Proctoring Enabled
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 flex flex-col gap-4">
            <h2 className="text-sm font-black text-teal-600 uppercase tracking-[0.3em]">Core Capabilities</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">
              Engineered for Academic <br /> Integrity and Reliability.
            </h3>
            <p className="text-lg text-slate-500 font-medium">
              SEAS provides a comprehensive toolset for educational institutions to deliver high-stakes assessments securely.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="p-8 hover:-translate-y-2 transition-transform duration-300 group">
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={28} />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border-4 border-teal-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 border-4 border-cyan-500 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="flex flex-col gap-8">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Let&apos;s Build the Future <br /> of <span className="text-teal-400">Assessment Together.</span>
              </h2>
              <p className="text-xl text-slate-400 font-medium leading-relaxed">
                Have questions about SEAS or want to discuss a custom implementation? Get in touch with our lead developer.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 pt-4">
                {contactDetails.map((contact, idx) => (
                  <a 
                    key={idx}
                    href={contact.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-teal-500/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <contact.icon size={24} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{contact.label}</span>
                      <span className="text-sm font-bold text-slate-200">{contact.value}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <Card className="bg-white/5 border-white/10 backdrop-blur-lg p-10 flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 relative rounded-2xl overflow-hidden bg-slate-800">
                  <Image src="/logo.png" alt="Developer" fill className="object-cover" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white tracking-tight">Lead Developer</h4>
                  <p className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Available for Collaborations</p>
                </div>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed italic">
                &quot;SEAS was born from a need for resilient educational technology that respects both the educator&apos;s standards and the student&apos;s circumstances.&quot;
              </p>
              <Button 
                variant="accent" 
                className="py-4"
                onClick={() => window.open('https://fshangala.github.io/profile', '_blank')}
              >
                Visit Portfolio
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative opacity-50">
              <Image src="/logo.png" alt="SEAS Logo" fill className="object-contain" />
            </div>
            <span className="text-xl font-black text-white/50 tracking-tight">SEAS</span>
          </div>
          
          <div className="flex items-center gap-6 text-slate-500 font-bold text-xs uppercase tracking-widest">
            <a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Documentation</a>
          </div>

          <div className="text-slate-500 font-medium text-xs">
            &copy; 2024 SEAS Assessment Platform. v1.0.0-Stable
          </div>
        </div>
      </footer>
    </div>
  )
}
