import { LucideIcon } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default function FAB({ icon: Icon, onClick, className }: { icon: LucideIcon, onClick?: () => void, className?: string }) {
  return (
    <button className={cn('material-fab cursor-pointer', className)} onClick={onClick}>
      <Icon size={24} />
    </button>
  )
}
