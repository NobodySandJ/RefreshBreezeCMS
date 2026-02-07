import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaFilePdf, FaFileExcel, FaCalendarAlt, FaTicketAlt, FaLayerGroup } from 'react-icons/fa'

const ExportModal = ({ isOpen, onClose, onExport, events = [] }) => {
  const [format, setFormat] = useState('excel') // 'excel' | 'pdf'
  const [scope, setScope] = useState('current') // 'current' (screen filter) | 'event' | 'month' | 'all'
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setFormat('excel')
      setScope('current')
      if (events.length > 0) setSelectedEventId(events[0].id)
    }
  }, [isOpen, events])

  const handleExport = () => {
    const exportData = {
      format,
      scope,
      value: scope === 'event' ? selectedEventId : scope === 'month' ? selectedMonth : null
    }
    onExport(exportData)
    onClose()
  }

  // Filter events (active/past doesn't matter for export, but maybe we want all)
  // Assuming 'events' passed are already comprehensive or we just show what's available
  
  console.log('ExportModal Rendered. isOpen:', isOpen)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gray-900 px-6 py-5 flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase tracking-wider">Export Data</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 1. Choose Format */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">1. Pilih Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormat('excel')}
                    className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      format === 'excel' 
                        ? 'border-[#079108] bg-[#079108]/5 text-[#079108]' 
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    }`}
                  >
                    <FaFileExcel className="text-2xl" />
                    <span className="font-bold text-sm">Excel (.xlsx)</span>
                    {format === 'excel' && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#079108]"></div>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setFormat('pdf')}
                    className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      format === 'pdf' 
                        ? 'border-red-500 bg-red-50 text-red-500' 
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    }`}
                  >
                    <FaFilePdf className="text-2xl" />
                    <span className="font-bold text-sm">PDF Document</span>
                    {format === 'pdf' && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></div>
                    )}
                  </button>
                </div>
              </div>

              {/* 2. Choose Scope/Filter */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">2. Filter Data</label>
                <div className="space-y-3">
                  
                  {/* Current Filter */}
                  <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    scope === 'current' ? 'border-gray-800 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    <input 
                      type="radio" 
                      name="scope" 
                      checked={scope === 'current'} 
                      onChange={() => setScope('current')}
                      className="w-4 h-4 text-gray-800 focus:ring-gray-800"
                    />
                    <div className="ml-3 flex items-center gap-2">
                      <FaLayerGroup className="text-gray-400" />
                      <span className="font-semibold text-sm">Sesuai Filter di Layar</span>
                    </div>
                  </label>

                  {/* By Event */}
                  <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    scope === 'event' ? 'border-gray-800 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    <input 
                      type="radio" 
                      name="scope" 
                      checked={scope === 'event'} 
                      onChange={() => setScope('event')}
                      className="w-4 h-4 text-gray-800 focus:ring-gray-800"
                    />
                    <div className="ml-3 flex items-center gap-2">
                      <FaTicketAlt className="text-gray-400" />
                      <span className="font-semibold text-sm">Per Event Spesifik</span>
                    </div>
                  </label>

                  {/* Event Dropdown */}
                  <AnimatePresence>
                    {scope === 'event' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pl-7"
                      >
                         <div className="pt-2">
                           <select 
                             value={selectedEventId}
                             onChange={(e) => setSelectedEventId(e.target.value)}
                             className="w-full bg-white border-2 border-gray-200 rounded-lg p-2 text-sm focus:border-gray-800 focus:outline-none"
                           >
                             {events.map(ev => (
                               <option key={ev.id} value={ev.id}>
                                 {ev.nama} ({ev.tanggal} {ev.bulan} {ev.tahun})
                               </option>
                             ))}
                           </select>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* By Month */}
                  <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    scope === 'month' ? 'border-gray-800 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    <input 
                      type="radio" 
                      name="scope" 
                      checked={scope === 'month'} 
                      onChange={() => setScope('month')}
                      className="w-4 h-4 text-gray-800 focus:ring-gray-800"
                    />
                    <div className="ml-3 flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400" />
                      <span className="font-semibold text-sm">Per Bulan</span>
                    </div>
                  </label>

                  {/* Month Picker */}
                  <AnimatePresence>
                    {scope === 'month' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pl-7"
                      >
                         <div className="pt-2">
                           <input 
                             type="month"
                             value={selectedMonth}
                             onChange={(e) => setSelectedMonth(e.target.value)}
                             className="w-full bg-white border-2 border-gray-200 rounded-lg p-2 text-sm focus:border-gray-800 focus:outline-none"
                           />
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-100">
              <button 
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleExport}
                className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all transform hover:scale-105 ${
                  format === 'excel' 
                    ? 'bg-[#079108] shadow-[#079108]/20' 
                    : 'bg-red-500 shadow-red-500/20'
                }`}
              >
                Download {format === 'excel' ? 'Excel' : 'PDF'}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ExportModal
