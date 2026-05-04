import { LucideIcon } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default function Input({ 
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
