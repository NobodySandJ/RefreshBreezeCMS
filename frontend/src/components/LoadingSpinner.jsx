const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#079108]/20 border-t-[#079108] rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
