import { LucideIcon } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default function Button({ 
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
