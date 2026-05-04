'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import LoadingOverlay from '@/components/LoadingOverlay'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

type AlertOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
  variant?: 'primary' | 'danger' | 'success'
}

type AlertContextType = {
  showAlert: (options: AlertOptions | string) => void
  hideAlert: () => void
  showLoading: (message?: string) => void
  hideLoading: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertOptions | null>(null)
  const [loading, setLoading] = useState<{ show: boolean, message?: string }>({ show: false })

  const showAlert = useCallback((options: AlertOptions | string) => {
    if (typeof options === 'string') {
      setAlert({ message: options })
    } else {
      setAlert(options)
    }
  }, [])

  const hideAlert = useCallback(() => {
    setAlert(null)
  }, [])

  const showLoading = useCallback((message?: string) => {
    setLoading({ show: true, message })
  }, [])

  const hideLoading = useCallback(() => {
    setLoading({ show: false })
  }, [])

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert, showLoading, hideLoading }}>
      {children}
      {alert && (
        <CustomAlertOverlay 
          {...alert} 
          onClose={hideAlert} 
        />
      )}
      <LoadingOverlay show={loading.show} message={loading.message} />
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const context = useContext(AlertContext)
  if (!context) throw new Error('useAlert must be used within AlertProvider')
  return context
}

function CustomAlertOverlay({ 
  title, 
  message, 
  confirmLabel = 'OK', 
  cancelLabel, 
  onConfirm, 
  onCancel, 
  variant = 'primary',
  onClose 
}: AlertOptions & { onClose: () => void }) {
  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    onClose()
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
    onClose()
  }

  const Icon = variant === 'danger' ? AlertCircle : (variant === 'success' ? CheckCircle2 : Info)
  const iconColor = variant === 'danger' ? 'text-red-500' : (variant === 'success' ? 'text-teal-500' : 'text-blue-500')

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center shadow-inner ${iconColor}`}>
            <Icon size={32} />
          </div>
          
          <div className="space-y-2">
            {title && <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>}
            <p className="text-slate-600 font-medium leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-3 w-full mt-4">
            {cancelLabel && (
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={handleCancel}
              >
                {cancelLabel}
              </Button>
            )}
            <Button 
              variant={variant === 'danger' ? 'secondary' : 'primary'} 
              className={variant === 'danger' ? 'flex-1 bg-red-600 shadow-red-200' : 'flex-1'}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
