
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaMinus, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaArrowRight, FaShoppingCart, FaPlay, FaInstagram, FaTwitter, FaYoutube, FaSpotify, FaExternalLinkAlt, FaQuestionCircle } from 'react-icons/fa'
import Header from '../components/Header'
import Footer from '../components/Footer'
import api from '../lib/api'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { getAssetPath } from '../lib/pathUtils'

const HomePage = () => {
  const navigate = useNavigate()
  const [hoveredMember, setHoveredMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [faqs, setFaqs] = useState([])
  const [openFaq, setOpenFaq] = useState(null)
  const [activeMemberId, setActiveMemberId] = useState(null)

  // ---------------------------------------------------------------------------
  // HERO DATA
  // ---------------------------------------------------------------------------

  const initialMembers = [
    { id: 'cally', name: 'CALLY', color: 'bg-[#9BBF9B]', photo: getAssetPath('/images/hero/cally.webp?v=32'), posX: 27, posY: 28, scale: 1.8, translateX: 18, translateY: 0 },
    { id: 'channie', name: 'CHANNIE', color: 'bg-[#6A9F6A]', photo: getAssetPath('/images/hero/channie.webp?v=32'), posX: 39, posY: 30, scale: 2.1, translateX: -8, translateY: 8 },
    { id: 'aca', name: 'ACA', color: 'bg-[#4A90B5]', photo: getAssetPath('/images/hero/aca.webp?v=32'), posX: 0, posY: 23, scale: 2.1, translateX: 18, translateY: 0 },
    { id: 'cissi', name: 'CISSI', color: 'bg-[#5A8F5A]', photo: getAssetPath('/images/hero/cissi.webp?v=32'), posX: 26, posY: 25, scale: 2.1, translateX: -27, translateY: 5 },
    { id: 'sinta', name: 'SINTA', color: 'bg-[#4C804C]', photo: getAssetPath('/images/hero/sinta.webp?v=32'), posX: 48, posY: 31, scale: 2, translateX: 18, translateY: 6 },
    { id: 'piya', name: 'PIYA', color: 'bg-[#3E723E]', photo: getAssetPath('/images/hero/piya.webp?v=32'), posX: 50, posY: 30, scale: 2.1, translateX: 5, translateY: 9 },
  ]

  const members = initialMembers




  const getMemberStyle = (member) => ({
    objectPosition: `${member.posX}% ${member.posY}%`,
    transform: `scale(${member.scale}) translate(${member.translateX}px, ${member.translateY}px)`
  })



  const [events, setEvents] = useState([])

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    })
    const fetchData = async () => {
        try {
            const [eventsRes, faqsRes] = await Promise.all([
                api.get('/events'),
                api.get('/faqs')
            ])

            if (eventsRes.data.success) {
                // Filter upcoming and sort by date
                const upcoming = eventsRes.data.data
                    .filter(e => !e.is_past)
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(0, 3) // Take top 3
                setEvents(upcoming)
            }
            if (faqsRes.data.success) {
                setFaqs(faqsRes.data.data)
            }
        } catch (error) {
            console.error('Failed to fetch home data:', error)
        } finally {
            setLoading(false)
        }
    }
    fetchData()
  }, [])
  
  return (
    <div className="min-h-screen bg-white text-dark overflow-x-hidden relative">
      <div className="noise-bg opacity-10"></div>
      <Header />

      {/* Hero Section - Desktop: 7 columns, Mobile: Stacked with horizontal scroll members */}
      
      {/* Desktop Hero (7 columns) */}
      <section className="relative h-[100vh] w-full hidden md:flex overflow-hidden">
        {members.map((member, idx) => (
          <motion.div 
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: Math.abs(idx - 3) * 0.1,
              ease: "easeOut"
            }}
            onMouseEnter={() => setHoveredMember(member.id)}
            onMouseLeave={() => setHoveredMember(null)}
            className="hero-column relative group cursor-pointer"
            onClick={() => navigate('/members')}
          >
            <div className="absolute inset-0">
               <img 
                 src={member.photo} 
                 alt={member.name} 
                 className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
               />
               <div className={`absolute inset-0 ${member.color} mix-blend-multiply opacity-30 group-hover:opacity-0 transition-opacity duration-700`}></div>
               <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent"></div>
            </div>

            <div className="absolute inset-x-0 bottom-24 flex justify-center z-10 pointer-events-none group-hover:opacity-0 transition-opacity duration-500">
              <span className="vertical-rl text-orientation-mixed text-white font-black text-xl md:text-2xl tracking-[0.2em] opacity-80 drop-shadow-2xl">
                {member.name}
              </span>
            </div>
          </motion.div>
        ))}

        <div className="absolute inset-x-0 bottom-[25%] flex flex-col items-center justify-center z-20 pointer-events-none">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { 
                opacity: 1,
                transition: { staggerChildren: 0.15, delayChildren: 0.8 }
              }
            }}
            className="text-center"
          >
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 0.7, y: 0 } }}
              className="mb-1 text-[9px] tracking-[0.5em] font-bold text-white uppercase"
            >
              Japanese Style Idol Group • Tulungagung
            </motion.div>
            
            <motion.h1 
              variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
              className="text-3xl font-black tracking-[0.1em] text-white my-1 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              REFRESH BREEZE
            </motion.h1>
            
            <motion.div 
              variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 } }}
              className="text-xs font-black tracking-[0.5em] text-accent-yellow uppercase"
            >
              リフレッシュ・ブリーズ
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 w-full h-2 caution-pattern z-30 opacity-60"></div>
      </section>

      {/* Mobile Hero - Option C: Top Header Focus */}
      <section className="md:hidden relative bg-white flex flex-col pt-16">
        {/* Branding Section at the Top */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-8 text-center bg-white"
        >
          <p className="text-[8px] tracking-[0.5em] font-black text-[#079108]/60 uppercase mb-2">
            Japanese Style Idol Group • Tulungagung
          </p>
          <h1 className="text-4xl font-black tracking-tight text-[#079108] mb-1">
            REFRESH BREEZE
          </h1>
          <p className="text-xs font-black tracking-[0.4em] text-accent-yellow">
            リフレッシュ・ブリーズ
          </p>
        </motion.div>

        {/* Member Strips Column - Full Width */}
        <div className="flex flex-col relative">
          {members.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, height: 80 }}
              animate={{ 
                opacity: 1,
                height: activeMemberId === member.id ? 180 : 80 
              }}
              whileHover={{ height: 120 }}
              transition={{ 
                height: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { delay: idx * 0.05 }
              }}
              onClick={() => setActiveMemberId(activeMemberId === member.id ? null : member.id)}
              className="relative overflow-hidden cursor-pointer group border-b border-white/5"
            >
              <img 
                src={member.photo} 
                alt={member.name}
                className={`absolute inset-0 w-full h-full object-cover z-0 transition-all duration-700 ${activeMemberId === member.id ? 'grayscale-0 scale-110 brightness-110' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105'}`}
                style={getMemberStyle(member)}
              />
              <div className={`absolute inset-0 ${member.color} transition-opacity duration-700 z-10 ${activeMemberId === member.id ? 'opacity-0' : 'opacity-40 mix-blend-multiply group-hover:opacity-0'}`}></div>
            </motion.div>
          ))}
          
          {/* Bottom Hard Break - Caution Pattern */}
          <div className="h-2 w-full caution-pattern opacity-60"></div>
        </div>
      </section>

      <section id="about" className="py-20 md:py-40 container mx-auto max-w-7xl px-4 relative z-40 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Side: Visual with Vertical Text */}
          <div className="relative group order-2 lg:order-1">
            {/* Vertical Branding Text - Positioned to be ~30% covered by photo */}
            <div className="absolute -left-12 md:-left-20 top-1/2 -translate-y-1/2 z-0 opacity-[0.07] select-none pointer-events-none">
              <span className="vertical-rl text-orientation-mixed font-black text-6xl md:text-9xl tracking-[0.3em] text-[#079108] whitespace-nowrap">
                REFRESH BREEZE
              </span>
            </div>
            
            {/* Photo Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/5] md:aspect-auto border-4 border-white"
            >
              <img 
                src={getAssetPath('/images/members/group.webp')} 
                alt="Refresh Breeze Group"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            </motion.div>
            
            {/* Decorative Badge */}
            <motion.div 
              initial={{ rotate: -10, opacity: 0 }}
              whileInView={{ rotate: 12, opacity: 1 }}
              viewport={{ once: true }}
              className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#079108] rounded-full flex items-center justify-center z-20 shadow-xl border-4 border-white"
            >
              <span className="text-white font-black text-[10px] tracking-tighter text-center leading-tight">
                EST.<br/>2023
              </span>
            </motion.div>
          </div>

          {/* Right Side: Content */}
          <div className="space-y-8 order-1 lg:order-2">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-1 bg-[#079108]"></div>
                <span className="text-[#079108] font-black tracking-[0.5em] text-xs uppercase text-left">ABOUT US</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-dark leading-none text-left">
                OUR <span className="text-[#079108]">STORY</span>
              </h2>
            </div>
            
            <div className="space-y-6 text-gray-500 text-lg leading-relaxed text-left">
              <p className="font-medium text-dark">
                <span className="text-[#079108] font-black">Refresh Breeze</span> adalah grup idola bergaya Jepang asal Tulungagung yang membawa semangat "Breeze" — kesegaran yang menginspirasi.
              </p>
              <p>
                Berdiri dengan visi menyebarkan energi positif, kami hadir lewat penampilan yang penuh warna, koreografi yang enerjik, dan interaksi yang hangat dengan para penggemar.
              </p>
              <p>
                Kami percaya bahwa setiap pertemuan adalah sebuah momen berharga yang patut dirayakan dengan senyuman dan keceriaan bersama.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { label: 'Energy', icon: '⚡' },
                { label: 'Fresh', icon: '🍃' },
                { label: 'Youth', icon: '✨' },
                { label: 'Together', icon: '🤝' }
              ].map((point, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 p-4 bg-[#079108]/5 rounded-2xl border border-[#079108]/10"
                >
                  <span className="text-xl">{point.icon}</span>
                  <span className="font-black text-[10px] uppercase tracking-widest text-[#079108]">{point.label}</span>
                </motion.div>
              ))}
            </div>

            <div className="pt-6 flex justify-start">
              <button 
                onClick={() => navigate('/story')}
                className="group flex items-center gap-4 px-8 py-4 bg-[#4A90B5] text-white rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-[#3a718f] transition-all shadow-xl hover:shadow-[#4A90B5]/30"
              >
                Read Full History
                <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SCHEDULE SECTION */}
      <section className="py-20 md:py-32 bg-white relative overflow-hidden">
        <div className="container mx-auto max-w-7xl px-4 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 sm:mb-20 gap-6 md:gap-8 text-center md:text-left">
                <div className="w-full">
                     <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                        <div className="w-8 h-1 bg-[#079108]"></div>
                        <span className="text-[#079108] font-black tracking-[0.4em] text-xs uppercase">SCHEDULE</span>
                     </div>
                     <h2 className="text-4xl md:text-6xl font-black text-dark tracking-tighter uppercase mb-4">
                        Upcoming <span className="text-[#079108]">Events</span>
                     </h2>
                     <p className="text-gray-400 font-medium max-w-lg mx-auto md:mx-0">
                        Jangan lewatkan penampilan seru kami di event terdekat!
                     </p>
                </div>
                <button 
                  onClick={() => navigate('/schedule')}
                  className="w-full md:w-auto px-10 py-4 rounded-full border-2 border-gray-100 text-[#4A90B5] font-black text-xs uppercase tracking-widest hover:border-[#4A90B5] hover:bg-[#4A90B5]/5 transition-all"
                >
                    View Full Schedule
                </button>
            </div>

            {events.length > 0 ? (
                <div className="grid gap-8">
                    {events.map((event, idx) => {
                        const isSpecial = event.is_special || event.nama.toLowerCase().includes('valentine');
                        const themeColor = isSpecial ? (event.theme_color || '#FF6B9D') : '#079108';
                        
                        return (
                            <motion.div 
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className={`p-5 sm:p-6 rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row items-center gap-6 sm:gap-8 hover:shadow-xl transition-all group bg-white border-2 cursor-pointer ${
                                  isSpecial ? 'border-theme/20' : 'border-gray-50'
                                }`}
                                style={{ 
                                  borderColor: isSpecial ? `${themeColor}33` : '#F9FAFB',
                                  background: isSpecial ? `linear-gradient(135deg, ${themeColor}05 0%, white 50%)` : 'white'
                                }}
                                onClick={() => navigate('/schedule')}
                            >
                                {/* Date Badge */}
                                <div 
                                  className="text-white w-20 h-20 sm:w-28 sm:h-28 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0"
                                  style={{ backgroundColor: themeColor }}
                                >
                                  <span className="block text-2xl sm:text-4xl font-black leading-none">{event.tanggal}</span>
                                  <span className="block text-[8px] sm:text-xs font-black tracking-widest uppercase mt-1">{event.bulan}</span>
                                </div>

                                {/* Event Info */}
                                <div className="flex-1 space-y-3 text-center md:text-left min-w-0">
                                  <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-dark tracking-tight truncate max-w-full">
                                      {event.nama}
                                    </h3>
                                    {isSpecial && (
                                      <span 
                                        className="px-3 py-1 rounded-full text-white text-[8px] font-black uppercase tracking-widest shadow-sm"
                                        style={{ backgroundColor: themeColor }}
                                      >
                                        🎀 SPECIAL
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6 text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                      <FaMapMarkerAlt style={{ color: themeColor }} />
                                      <span>{event.lokasi}</span>
                                    </div>
                                    {event.event_time && (
                                      <div className="flex items-center gap-2">
                                        <FaClock style={{ color: themeColor }} />
                                        <span>{event.event_time}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Arrow Button */}
                                <div 
                                    className="hidden md:flex w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-50 items-center justify-center text-gray-300 group-hover:text-white group-hover:bg-theme group-hover:rotate-45 transition-all shadow-inner group-hover:shadow-lg"
                                >
                                    <FaArrowRight size={20} className="group-hover:text-white" />
                                </div>
                                <style dangerouslySetInnerHTML={{ __html: `
                                    .group:hover .group-hover\\:bg-theme { background-color: ${themeColor} !important; }
                                `}} />
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                    <p className="text-gray-400 font-black tracking-widest uppercase opacity-50">No upcoming events scheduled</p>
                </div>
            )}
        </div>
      </section>

      {/* SHOP PREVIEW SECTION */}
      <section className="py-12 sm:py-16 md:py-24 bg-white relative">
        <div className="container mx-auto max-w-7xl px-4">
             <div className="text-center mb-16">
                 <h2 className="text-4xl md:text-6xl font-black text-dark overflow-hidden">
                    <motion.span 
                        initial={{ y: "100%" }}
                        whileInView={{ y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-block"
                    >
                        OFFICIAL MERCH
                    </motion.span>
                 </h2>
                 <p className="mt-4 text-gray-500 font-light">Dapatkan merchandise resmi Refresh Breeze</p>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                 {/* Main Feature: Group Cheki */}
                 <div 
                    onClick={() => navigate('/shop')}
                    className="sm:col-span-2 lg:col-span-2 bg-[#0a0f1d] rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-8 md:p-12 relative overflow-hidden group cursor-pointer text-white h-[280px] sm:h-[350px] md:h-[400px] flex flex-col justify-end"
                 >
                    <img 
                        src={getAssetPath('/images/members/group.webp')} 
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-[#079108] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Best Seller</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase mb-2 sm:mb-4">Group Cheki</h3>
                        <div className="flex items-center justify-between">
                            <p className="text-gray-300 max-w-sm text-sm">Abadikan momen bersama seluruh member dalam satu frame eksklusif.</p>
                            <span className="w-12 h-12 rounded-full bg-white text-dark flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FaShoppingCart />
                            </span>
                        </div>
                    </div>
                 </div>

                 {/* Secondary Feature: Random Member / General */}
                 <div 
                    onClick={() => navigate('/shop')}
                    className="bg-gray-100 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-8 md:p-12 relative overflow-hidden group cursor-pointer h-[280px] sm:h-[350px] md:h-[400px] flex flex-col justify-between"
                 >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#079108] rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    
                    <div>
                        <h3 className="text-2xl font-black text-dark uppercase mb-2">Member Cheki</h3>
                        <p className="text-gray-500 text-sm font-bold">2-Shot Polaroid</p>
                    </div>

                    <div className="relative h-48 w-full">
                         {/* Polaroid Stacked Effect */}
                        {/* Aca (Front) - Main Subject */}
                        <div className="absolute bottom-0 right-0 w-32 h-44 bg-white p-1.5 pb-10 shadow-2xl transform rotate-6 group-hover:rotate-12 transition-transform duration-500 z-30 border border-gray-100">
                          <div className="w-full h-full overflow-hidden bg-gray-50/50 rounded-sm">
                            <img 
                              src={getAssetPath('/images/shop/aca.webp')} 
                              loading="lazy" 
                              className="w-full h-full object-contain scale-[1.3] grayscale group-hover:grayscale-0 transition-all duration-700 origin-top pt-2" 
                            />
                          </div>
                          <p className="absolute bottom-2 left-0 w-full text-center text-[7px] font-black text-gray-400 tracking-[0.2em] uppercase">Official Cheki</p>
                        </div>

                        {/* Sinta (Middle) */}
                        <div className="absolute bottom-2 right-12 w-30 h-40 bg-white p-1.5 pb-8 shadow-xl transform -rotate-3 group-hover:-rotate-6 transition-transform duration-500 z-20 border border-gray-100">
                          <div className="w-full h-full overflow-hidden bg-gray-50/50 rounded-sm">
                            <img 
                              src={getAssetPath('/images/shop/sinta.webp')} 
                              loading="lazy" 
                              className="w-full h-full object-contain scale-[1.3] grayscale group-hover:grayscale-0 transition-all duration-700 origin-top pt-2" 
                            />
                          </div>
                        </div>

                        {/* Cally (Back) */}
                        <div className="absolute bottom-4 right-24 w-28 h-36 bg-white p-1.5 pb-8 shadow-lg transform -rotate-12 group-hover:-rotate-20 transition-transform duration-500 z-10 border border-gray-100 opacity-80 group-hover:opacity-100">
                          <div className="w-full h-full overflow-hidden bg-gray-50/50 rounded-sm">
                            <img 
                              src={getAssetPath('/images/shop/cally.webp')} 
                              loading="lazy" 
                              className="w-full h-full object-contain scale-[1.3] grayscale group-hover:grayscale-0 transition-all duration-700 origin-top pt-2" 
                            />
                          </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-dark font-black text-xs uppercase tracking-widest group-hover:text-[#079108] transition-colors">
                        Browse All <FaArrowRight />
                    </div>
                 </div>
             </div>

             <div className="text-center mt-12">
                 <button 
                    onClick={() => navigate('/shop')}
                    className="px-10 py-4 bg-[#079108] text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#068007] transition-all shadow-xl shadow-[#079108]/20 hover:scale-105"
                 >
                    Visit Store
                 </button>
             </div>
        </div>
      </section>

      {/* GALLERY PREVIEW */}
      <section className="py-12 sm:py-16 md:py-24 bg-[#079108]/5 text-dark overflow-hidden relative">
         <div className={`absolute top-0 left-0 w-full h-full bg-[url('${getAssetPath('/noise.png')}')] opacity-5`}></div>
         <div className="container mx-auto max-w-7xl px-4 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 sm:mb-16 gap-4 md:gap-6 text-center md:text-left">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter text-dark">
                   Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#079108] to-emerald-400">Media</span>
                </h2>
                <button 
                  onClick={() => navigate('/media')}
                  className="w-full md:w-auto px-6 py-3 rounded-full border border-gray-200 text-gray-500 hover:text-dark font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                   View Gallery <FaArrowRight />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {[
                    { 
                      type: 'video', 
                      title: 'JEWEL KISS - 恋華 (Lovers Flower)', 
                      thumb: 'https://img.youtube.com/vi/77iP-nJ4b8Q/sddefault.jpg', 
                      url: 'https://youtu.be/77iP-nJ4b8Q?si=CfZ3haCys12C7ONg'
                    },
                    { 
                      type: 'video', 
                      title: 'FRUiTY - LOVE SONG FOR YOU', 
                      thumb: 'https://img.youtube.com/vi/Twin7LVhnHI/sddefault.jpg', 
                      url: 'https://youtu.be/Twin7LVhnHI?si=r-REpbjFgJkvrv7r'
                    },
                    { 
                      type: 'video', 
                      title: 'MARY ANGEL - LIKE A ANGEL', 
                      thumb: 'https://img.youtube.com/vi/dKcq3tR69sM/sddefault.jpg', 
                      url: 'https://youtu.be/dKcq3tR69sM?si=DnheTptSVN-FK-cl'
                    },
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="group aspect-video relative rounded-2xl overflow-hidden bg-gray-100 cursor-pointer shadow-lg hover:shadow-xl transition-all"
                        onClick={() => navigate('/media')}
                    >
                        <img 
                           src={item.thumb}
                           alt={item.title}
                           loading="lazy"
                           className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                           onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80' }}
                        />
                         <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100 shadow-2xl">
                                   <FaPlay className="ml-1" />
                              </div>
                         </div>
                         <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                             <p className="text-xs font-bold truncate text-white">{item.title}</p>
                         </div>
                    </motion.div>
                ))}
            </div>
         </div>
      </section>




      {/* FAQ Section */}
      <section className="py-12 sm:py-16 md:py-24 container mx-auto max-w-3xl px-4 relative z-40">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2 uppercase text-dark">
            Help Center
          </h2>
          <div className="w-20 h-1 bg-[#079108] mx-auto opacity-50"></div>
        </div>

        <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div 
                key={faq.id || idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className={`transition-all duration-300 border-2 border-[#079108]/20 hover:border-[#079108] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgba(7,145,8,0.1)] ${openFaq === idx ? 'border-[#079108] shadow-md' : ''}`}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full py-6 px-6 text-left flex items-center justify-between gap-6 group relative overflow-hidden"
                >
                  <span className={`text-base md:text-lg font-bold transition-colors ${openFaq === idx ? 'text-dark' : 'text-gray-500 group-hover:text-[#079108]'}`}>
                    {faq.tanya}
                  </span>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${openFaq === idx ? 'bg-[#079108] text-white rotate-180' : 'bg-gray-100 text-gray-400 group-hover:bg-[#079108]/10 group-hover:text-[#079108]'}`}>
                    {openFaq === idx ? <FaMinus size={10} /> : <FaPlus size={10} />}
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-8 pt-2 text-gray-500 text-sm md:text-base font-medium leading-relaxed pl-8 md:pl-10">
                        {faq.jawab}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
        </div>
      </section>



      <Footer />
    </div>
  )
}

export default HomePage
