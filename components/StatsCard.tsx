import { LucideIcon } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import Card from './Card'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default function StatsCard({ 
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
