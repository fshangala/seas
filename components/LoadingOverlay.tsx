export default function LoadingOverlay({ 
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
