import { LucideIcon } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn('material-card', className)}>
      {children}
    </div>
  )
}

export function Button({ 
  children, 
  className, 
  variant = 'primary',
  icon: Icon,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'accent',
  icon?: LucideIcon
}) {
  const variantClass = {
    primary: 'teal-gradient',
    secondary: 'slate-gradient',
    accent: 'accent-gradient'
  }[variant]

  return (
    <button 
      className={cn(
        'flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-medium shadow-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white',
        variantClass,
        className
      )}
      {...props}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  )
}

export function FAB({ icon: Icon, onClick, className }: { icon: LucideIcon, onClick?: () => void, className?: string }) {
  return (
    <button className={cn('material-fab', className)} onClick={onClick}>
      <Icon size={24} />
    </button>
  )
}
