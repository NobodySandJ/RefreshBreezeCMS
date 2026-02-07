import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaMapMarkerAlt, FaClock, FaHistory, FaCalendarAlt } from 'react-icons/fa'
import Header from '../components/Header'
import Footer from '../components/Footer'
import api from '../lib/api'
import { getMemberEmoji, formatMemberName } from '../lib/memberUtils'

const SchedulePage = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events')
        if (response.data.success) {
          setEvents(response.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const upcomingEvents = events.filter(e => !e.is_past)
  // Sort past events by date descending (already handled by backend usually, but ensuring)
  const pastEvents = events.filter(e => e.is_past)

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Header />
      
      <main className="pt-32 pb-20 container mx-auto max-w-7xl px-4">
        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black tracking-widest mb-6 uppercase"
          >
            SCHEDULE
          </motion.h1>
          <div className="w-32 h-1.5 bg-[#079108] mx-auto mb-8 shadow-[0_0_15px_rgba(7,145,8,0.3)]"></div>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed font-light">
            Jangan lewatkan kesempatan untuk bertemu <span className="text-[#079108] font-bold">Refresh Breeze</span> secara langsung di berbagai acara menarik.
          </p>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="h-10 w-48 bg-gray-50 animate-pulse rounded-lg"></div>
            {[1, 2].map(i => (
              <div key={i} className="h-32 w-full bg-gray-50 animate-pulse rounded-[2.5rem]"></div>
            ))}
          </div>
        ) : (
          <>
            {/* Upcoming Events */}
            <section className="mb-24">
              <div className="flex items-center gap-4 mb-12">
                <FaCalendarAlt className="text-[#079108] text-2xl" />
                <h2 className="text-2xl font-black tracking-widest uppercase text-dark">Upcoming Events</h2>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="py-24 text-center bg-[#079108]/5 rounded-[3rem] border border-dashed border-[#079108]/20">
                  <p className="text-[#079108] font-black tracking-[0.3em] uppercase text-xs opacity-60">Belum ada jadwal acara untuk saat ini.</p>
                </div>
              ) : (
                <div className="grid gap-8">
                  {upcomingEvents.map((event, idx) => (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className={`p-8 rounded-[3.5rem] flex flex-col gap-8 hover:shadow-2xl transition-all group ${
                        event.is_special 
                          ? 'border-2 hover:shadow-xl' 
                          : 'bg-white border-2 border-[#079108]/20 hover:border-[#079108]/40'
                      }`}
                      style={event.is_special ? {
                        background: `linear-gradient(135deg, ${event.theme_color}15 0%, white 50%)`,
                        borderColor: event.theme_color
                      } : {}}
                    >
                      <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                          {/* Date Badge */}
                          <div 
                            className={`text-white p-8 rounded-[2.5rem] text-center min-w-[140px] shadow-lg group-hover:scale-105 transition-transform`}
                            style={{ backgroundColor: event.is_special ? event.theme_color : '#079108' }}
                          >
                            <span className="block text-4xl font-black mb-1">{event.tanggal}</span>
                            <span className="block text-xs font-black tracking-widest uppercase">{event.bulan}</span>
                            <span className="block text-[10px] font-bold opacity-60 mt-1">{event.tahun}</span>
                          </div>

                          {/* Event Info */}
                          <div className="flex-1 space-y-3 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                              <h3 className="text-3xl md:text-4xl font-black text-dark tracking-tight">{event.nama}</h3>
                              {event.is_special && (
                                <span 
                                  className="px-4 py-1.5 rounded-full text-white text-xs font-bold shadow-md"
                                  style={{ backgroundColor: event.theme_color }}
                                >
                                  🎀 {event.theme_name || 'Special'}
                                </span>
                              )}
                            </div>
                            
                            {/* Location & Time - only for regular events */}
                            {!event.is_special && event.lokasi && (
                              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-500 text-sm font-bold">
                                <div className="flex items-center gap-2">
                                  <FaMapMarkerAlt className="text-[#079108]" />
                                  <span className="uppercase tracking-wider">{event.lokasi}</span>
                                </div>
                                {event.event_time && (
                                  <div className="flex items-center gap-2">
                                    <FaClock className="text-[#079108]" />
                                    <span className="tracking-widest">{event.event_time}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* PRE-ORDER Label for special events */}
                            {event.is_special && (
                              <div 
                                className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold border"
                                style={{ 
                                  backgroundColor: `${event.theme_color}15`,
                                  borderColor: event.theme_color,
                                  color: event.theme_color
                                }}
                              >
                                🏷️ PRE-ORDER ONLY
                              </div>
                            )}
                          </div>

                          {/* Button */}
                          <div className="w-full md:w-auto">
                            <button 
                              className="w-full md:w-auto px-12 py-4 text-white rounded-full font-black tracking-widest text-xs uppercase hover:opacity-90 transition-all shadow-xl active:scale-95"
                              style={{ backgroundColor: event.is_special ? event.theme_color : '#1a1a1a' }}
                            >
                                {event.is_special ? 'Pre-Order Now' : 'Ticket Info'}
                            </button>
                          </div>
                      </div>

                      {/* Lineup Section - Names Only */}
                      {event.event_lineup && event.event_lineup.length > 0 && (
                         <div className="w-full pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6">
                             <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 pt-2">Idol Line Up</h4>
                             <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                {event.event_lineup.map(el => (
                                    <span 
                                      key={el.members.id} 
                                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                                        event.is_special 
                                          ? 'text-white shadow-md' 
                                          : 'bg-gray-100 text-gray-700 hover:bg-[#079108]/10 hover:text-[#079108]'
                                      }`}
                                      style={event.is_special ? { backgroundColor: event.theme_color } : {}}
                                    >
                                      {formatMemberName(el.members.nama_panggung)}
                                    </span>
                                ))}
                             </div>
                         </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-12 opacity-40">
                  <FaHistory className="text-gray-400 text-2xl" />
                  <h2 className="text-2xl font-black tracking-widest uppercase text-dark">Memory Lane</h2>
                </div>

                <div className="grid gap-6">
                  {pastEvents.map((event, idx) => (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 0.6 }}
                      viewport={{ once: true }}
                      className="bg-gray-50 border border-gray-100 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 grayscale hover:grayscale-0 hover:opacity-100 transition-all group"
                    >
                      <div className="bg-gray-200 text-gray-500 p-4 rounded-[1.8rem] text-center min-w-[100px] group-hover:bg-[#079108]/10 group-hover:text-[#079108] transition-colors">
                        <span className="block text-2xl font-black">{event.tanggal}</span>
                        <span className="block text-[10px] font-black tracking-widest uppercase">{event.bulan}</span>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-black text-gray-700 group-hover:text-dark transition-colors">{event.nama}</h3>
                        <p className="text-xs font-bold text-gray-400 flex items-center justify-center md:justify-start gap-2 mt-2 uppercase tracking-tight">
                          <FaMapMarkerAlt /> {event.lokasi}
                        </p>
                      </div>
                      <div className="text-[10px] font-black tracking-widest text-gray-300 uppercase border border-gray-100 px-4 py-2 rounded-full group-hover:border-[#079108]/20 group-hover:text-[#079108]/40 transition-all">
                        COMPLETE
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className="mt-24 text-center">
          <button onClick={() => window.history.back()} className="px-12 py-5 border-2 border-gray-100 text-gray-400 font-black rounded-full text-[10px] tracking-[0.3em] uppercase hover:bg-dark hover:text-white hover:border-dark transition-all active:scale-95 shadow-sm">
            ← STEP BACK
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default SchedulePage
