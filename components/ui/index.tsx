import { LucideIcon } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function Card({ 
  children, 
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('material-card', className)} {...props}>
      {children}
    </div>
  )
}

export function StatsCard({ 
  label, 
  value, 
  icon: Icon, 
  colorClass = 'bg-teal-500 shadow-teal-500/20' 
}: { 
  label: string, 
  value: string | number, 
  icon: LucideIcon,
  colorClass?: string
}) {
  return (
    <Card className="flex items-center gap-6 p-8">
      <div className={cn('w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-lg', colorClass)}>
        <Icon size={28} />
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-black text-slate-800">{value}</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</span>
      </div>
    </Card>
  )
}

export function Input({ 
  icon: Icon, 
  className,
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
      <input 
        className={cn(
          'w-full pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-hidden bg-slate-50 font-medium text-slate-800 transition-all',
          Icon ? 'pl-12' : 'pl-4',
          className
        )}
        {...props}
      />
    </div>
  )
}

export function FormGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
      {children}
    </div>
  )
}

export function Button({ 
  children, 
  className, 
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'accent',
  icon?: LucideIcon,
  loading?: boolean
}) {
  const variantClass = {
    primary: 'teal-gradient',
    secondary: 'slate-gradient',
    accent: 'accent-gradient'
  }[variant]

  return (
    <button 
      className={cn(
        'flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-medium shadow-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white cursor-pointer',
        variantClass,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : Icon && (
        <Icon size={20} />
      )}
      {children}
    </button>
  )
}

export function FAB({ icon: Icon, onClick, className }: { icon: LucideIcon, onClick?: () => void, className?: string }) {
  return (
    <button className={cn('material-fab cursor-pointer', className)} onClick={onClick}>
      <Icon size={24} />
    </button>
  )
}

export function LoadingOverlay({ 
  message = 'Processing...', 
  show = true 
}: { 
  message?: string, 
  show?: boolean 
}) {
  if (!show) return null
  
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6 max-w-xs w-full mx-4 border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-ping" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">{message}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">
            Secure Submission in Progress
          </p>
        </div>
      </div>
    </div>
  )
}
