
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaMinus, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaArrowRight, FaShoppingCart, FaPlay, FaInstagram, FaTwitter, FaYoutube, FaSpotify, FaExternalLinkAlt, FaQuestionCircle } from 'react-icons/fa'
import Header from '../components/Header'
import Footer from '../components/Footer'
import api from '../lib/api'
import AOS from 'aos'
import 'aos/dist/aos.css'

const HomePage = () => {
  const navigate = useNavigate()
  const [hoveredMember, setHoveredMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [faqs, setFaqs] = useState([])
  const [openFaq, setOpenFaq] = useState(null)

  // ---------------------------------------------------------------------------
  // HERO IMAGE CALIBRATION TOOL
  // ---------------------------------------------------------------------------
  const [showCalibration, setShowCalibration] = useState(false)
  const [activeMemberId, setActiveMemberId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')

  const initialMembers = [
    { id: 'cally', name: 'CALLY', color: 'bg-[#9BBF9B]', photo: '/images/hero/cally.webp?v=32', posX: 27, posY: 28, scale: 1.8, translateX: 18, translateY: 0 },
    { id: 'yanyee', name: 'YANYEE', color: 'bg-[#7EAE7E]', photo: '/images/hero/yanyee.webp?v=32', posX: 50, posY: 32, scale: 2, translateX: -22, translateY: -10 },
    { id: 'channie', name: 'CHANNIE', color: 'bg-[#6A9F6A]', photo: '/images/hero/channie.webp?v=32', posX: 39, posY: 31, scale: 1.2, translateX: -8, translateY: 8 },
    { id: 'aca', name: 'ACA', color: 'bg-[#4A90B5]', photo: '/images/hero/aca.webp?v=32', posX: 0, posY: 23, scale: 2.1, translateX: 18, translateY: 0 },
    { id: 'cissi', name: 'CISSI', color: 'bg-[#5A8F5A]', photo: '/images/hero/cissi.webp?v=32', posX: 26, posY: 25, scale: 2.1, translateX: -27, translateY: 5 },
    { id: 'sinta', name: 'SINTA', color: 'bg-[#4C804C]', photo: '/images/hero/sinta.webp?v=32', posX: 48, posY: 31, scale: 2.1, translateX: 18, translateY: -4 },
    { id: 'piya', name: 'PIYA', color: 'bg-[#3E723E]', photo: '/images/hero/piya.webp?v=32', posX: 50, posY: 30, scale: 2.1, translateX: 5, translateY: 9 },
  ]

  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('rb_hero_config')
    return saved ? JSON.parse(saved) : initialMembers
  })

  // Keep localStorage in sync or use a save button
  const handleSaveConfig = () => {
    const config = JSON.stringify(members, null, 2)
    localStorage.setItem('rb_hero_config', config)
    navigator.clipboard.writeText(config)
    setSaveStatus('Config Saved & Copied!')
    setTimeout(() => setSaveStatus(''), 3000)
  }

  const updateMember = (id, field, value) => {
    setMembers(prev => prev.map(m => 
      m.id === id ? { ...m, [field]: parseFloat(value) } : m
    ))
  }

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

      {/* Mobile Hero - Simple horizontal strips with text overlay */}
      <section className="md:hidden relative">
        {/* All Member Strips stacked */}
        <div className="flex flex-col pt-16">
          {members.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setActiveMemberId(activeMemberId === member.id ? null : member.id)}
              className="relative h-20 overflow-hidden cursor-pointer bg-white"
            >
              <img 
                src={member.photo} 
                alt={member.name}
                className={`absolute inset-0 w-full h-full object-cover z-0 transition-all duration-500 ${activeMemberId === member.id ? 'grayscale-0 scale-110 brightness-110' : 'grayscale opacity-70'}`}
                style={getMemberStyle(member)}
              />
              <div className={`absolute inset-0 ${member.color} transition-opacity duration-500 z-10 ${activeMemberId === member.id ? 'opacity-0' : 'opacity-40 mix-blend-multiply'}`}></div>
            </motion.div>
          ))}
        </div>

        {/* Text Overlay - centered on all strips */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none pt-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-center transition-opacity duration-300 ${activeMemberId ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <p className="text-[6px] tracking-[0.3em] font-bold text-white/80 uppercase mb-1 drop-shadow-lg">
              Japanese Style Idol Group • Tulungagung
            </p>
            <h1 className="text-2xl font-black tracking-wider text-white drop-shadow-2xl mb-1">
              REFRESH BREEZE
            </h1>
            <p className="text-[9px] font-bold tracking-[0.2em] text-accent-yellow drop-shadow-lg">
              リフレッシュ・ブリーズ
            </p>
          </motion.div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16 md:py-32 container mx-auto max-w-7xl px-4 relative z-40 overflow-hidden md:overflow-visible">
        
        <div className="grid lg:grid-cols-2 gap-10 md:gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 md:space-y-8"
          >
             <div className="flex items-center gap-4">
               <div className="w-8 h-1 md:w-12 md:h-1 bg-[#079108]"></div>
               <span className="text-[#079108] font-black tracking-[0.3em] md:tracking-[0.4em] text-xs uppercase underline underline-offset-8">REFRESH BREEZE</span>
             </div>
            <h2 className="text-3xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight text-dark">
              BRINGING THE <span className="text-[#079108]">FRESH WIND</span><br />
              OF ENERGY.
            </h2>
            <p className="text-gray-500 text-sm sm:text-base md:text-lg leading-relaxed font-light">
              Refresh Breeze adalah sebuah grup idola lokal asal Tulungagung. Beranggotakan 7 Member yang setiap member memiliki bakat dan karakter yang berbeda. Kami hadir untuk mencerahkan hari-harimu dengan semangat dan kegembiraan di setiap penampilan kami.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 pt-2">
              <button 
                onClick={() => navigate('/story')}
                className="px-8 sm:px-10 py-3 sm:py-4 bg-[#0a0f1d] text-white font-black tracking-widest text-xs uppercase rounded-full hover:bg-[#079108] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 text-center"
              >
                Our Story
              </button>
              <button 
                onClick={() => navigate('/members')}
                className="px-8 sm:px-10 py-3 sm:py-4 border-2 border-dark/10 text-dark font-black tracking-widest text-xs uppercase rounded-full hover:bg-[#079108] hover:border-[#079108] hover:text-white transition-all transform hover:-translate-y-1 text-center"
              >
                Members
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative lg:pl-10 pt-10 flex justify-center lg:justify-end"
          >
            {/* Abstract Shapes */}
            <div className="absolute top-10 right-10 w-24 h-24 md:w-32 md:h-32 bg-[#c3e3a3] rounded-full opacity-50 blur-2xl -z-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-[#079108] rounded-full opacity-10 blur-3xl -z-10"></div>

            <div className="relative z-10 w-full max-w-sm">
                 {/* Vertical Text behind image - Responsive adjustment */}
                 <div className="hidden md:flex absolute -right-12 top-1/2 -translate-y-1/2 h-auto items-center -z-10 select-none pointer-events-none">
                    <h2 
                      data-aos="fade-left"
                      className="text-5xl md:text-6xl font-black text-gray-300/50 leading-none tracking-widest uppercase vertical-rl text-orientation-mixed whitespace-nowrap"
                    >
                       REFRESH BREEZE
                    </h2>
                 </div>
                 
                 {/* Mobile version of decorative text - horizontal or subtly placed */}
                 <div className="md:hidden absolute -right-4 top-0 -z-10 select-none pointer-events-none opacity-20">
                     <h2 className="text-4xl font-black text-gray-300 tracking-widest uppercase writing-vertical-rl">
                       REFRESH
                     </h2>
                 </div>

                <div 
                  data-aos="zoom-in"
                  className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(7,145,8,0.15)] relative"
                >
                  <div className="absolute inset-0 bg-white/10 z-20 mix-blend-overlay pointer-events-none"></div> {/* Texture Overlay (Removed blur) */}
                  <img 
                    src="/images/members/group.webp" 
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                    onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=1200&q=80'} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60"></div>
                </div>
                
                {/* Floating Badge */}
                <div 
                  data-aos="fade-up"
                  data-aos-delay="200"
                  className="absolute -bottom-6 -left-6 bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 flex items-center gap-4 animate-float z-30"
                >
                   <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                      <img src="/images/logos/logo.webp" alt="Logo" className="w-full h-full object-cover" />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Since</p>
                      <p className="text-2xl font-black text-dark">2023</p>
                   </div>
                </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SCHEDULE SECTION */}
      <section className="py-12 sm:py-16 md:py-24 bg-[#079108]/5 relative overflow-hidden">
        <div className="container mx-auto max-w-7xl px-4 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div>
                     <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-dark tracking-tighter uppercase mb-2 sm:mb-4">
                        Upcoming <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#079108] to-[#a3e635]">Live</span>
                     </h2>
                     <p className="text-gray-500 font-medium max-w-lg">
                        Jangan lewatkan penampilan seru kami di event terdekat!
                     </p>
                </div>
                <button 
                  onClick={() => navigate('/schedule')}
                  className="px-8 py-3 rounded-full border-2 border-dark/10 text-dark font-black text-xs uppercase tracking-widest hover:bg-dark hover:text-white hover:border-dark transition-all"
                >
                    View Full Schedule
                </button>
            </div>

            {events.length > 0 ? (
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Featured Event (First One) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-dark text-white rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group cursor-pointer"
                        onClick={() => navigate('/schedule')}
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#079108] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        
                        <div className="relative z-10">
                            <div className="inline-block px-4 py-2 bg-[#079108] rounded-full text-[10px] font-black tracking-widest uppercase mb-6">
                                Next Stage
                            </div>
                            <h3 className="text-3xl md:text-4xl font-black leading-tight mb-6">
                                {events[0].nama}
                            </h3>
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-4 text-gray-300">
                                    <FaCalendarAlt className="text-[#079108]" />
                                    <span className="font-bold tracking-wide">{events[0].tanggal} {events[0].bulan} {events[0].tahun}</span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-300">
                                    <FaClock className="text-[#079108]" />
                                    <span className="font-bold tracking-wide">{events[0].event_time}</span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-300">
                                    <FaMapMarkerAlt className="text-[#079108]" />
                                    <span className="font-bold tracking-wide">{events[0].lokasi}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-[#a3e635] font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                                More Info <FaArrowRight />
                            </div>
                        </div>
                    </motion.div>

                    {/* Other Events List */}
                    <div className="space-y-4">
                        {events.slice(1).map((event, idx) => (
                            <motion.div 
                                key={event.id}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white p-8 rounded-[2rem] border border-gray-100 hover:shadow-xl hover:border-[#079108]/20 transition-all cursor-pointer group"
                                onClick={() => navigate('/schedule')}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="text-center min-w-[60px]">
                                        <span className="block text-2xl font-black text-[#079108]">{event.tanggal}</span>
                                        <span className="block text-[10px] font-black uppercase text-gray-400">{event.bulan}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-black text-dark mb-1 group-hover:text-[#079108] transition-colors line-clamp-1">{event.nama}</h4>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{event.lokasi}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#079108] group-hover:text-white transition-colors">
                                        <FaArrowRight className="-rotate-45 group-hover:rotate-0 transition-transform" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {events.length === 1 && (
                             <div className="h-full bg-white/50 border-2 border-dashed border-gray-200 rounded-[2rem] flex items-center justify-center">
                                <p className="text-gray-400 font-bold text-sm">More events coming soon</p>
                             </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-gray-100">
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
                        src="/images/members/group.webp" 
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
                         {/* Stacked Images Effect */}
                        <img src="/images/members/cally.webp" loading="lazy" className="absolute bottom-0 right-0 w-32 h-40 object-cover rounded-xl shadow-lg transform rotate-6 group-hover:rotate-12 transition-transform duration-500 z-10" />
                        <img src="/images/members/aca.webp" loading="lazy" className="absolute bottom-2 right-12 w-30 h-36 object-cover rounded-xl shadow-lg transform -rotate-6 group-hover:-rotate-12 transition-transform duration-500" />
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
         <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-5"></div>
         <div className="container mx-auto max-w-7xl px-4 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-dark">
                   Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#079108] to-emerald-400">Media</span>
                </h2>
                <button 
                  onClick={() => navigate('/media')}
                  className="text-gray-400 hover:text-dark font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
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
                className={`transition-all duration-300 border border-[#079108]/30 hover:border-[#079108] hover:shadow-[0_0_20px_rgba(7,145,8,0.3)] ${openFaq === idx ? 'bg-white shadow-lg rounded-xl' : 'bg-transparent border-b border-gray-100'}`}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full py-6 px-6 text-left flex items-center justify-between gap-6 group relative overflow-hidden"
                >
                  {openFaq === idx && (
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#079108]"></div>
                  )}
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

      {/* CALIBRATION TOOL */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-auto">
        <button 
          onClick={() => setShowCalibration(!showCalibration)}
          className="bg-red-600 text-white p-3 rounded-full shadow-lg font-bold text-xs hover:scale-110 active:scale-95 transition-transform"
        >
          {showCalibration ? 'CLOSE' : 'EDIT'}
        </button>
        
        {showCalibration && (
          <div className="bg-black/95 p-4 rounded-xl text-white w-80 max-h-[50vh] overflow-y-auto border border-white/20 shadow-2xl">
            <h3 className="text-xs font-bold mb-4 uppercase tracking-widest text-[#079108] border-b border-white/10 pb-2">Hero Config</h3>
            <div className="space-y-6">
              {members.map(m => (
                <div key={m.id} className="border-b border-white/10 pb-4 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-xs text-accent-yellow">{m.name}</span>
                    <span className="text-[9px] text-gray-500 font-mono">Scale: {m.scale}</span>
                  </div>
                  
                  <div className="space-y-3">
                     {/* Pos X/Y */}
                     <div className="grid grid-cols-2 gap-3">
                       <label className="text-[9px] font-bold text-gray-400">
                          Pos X (%)
                          <input type="range" min="0" max="100" value={m.posX} onChange={(e) => updateMember(m.id, 'posX', e.target.value)} className="w-full accent-[#079108] h-1 mt-1" />
                       </label>
                       <label className="text-[9px] font-bold text-gray-400">
                          Pos Y (%)
                          <input type="range" min="0" max="100" value={m.posY} onChange={(e) => updateMember(m.id, 'posY', e.target.value)} className="w-full accent-[#079108] h-1 mt-1" />
                       </label>
                     </div>

                     {/* Translate X/Y */}
                     <div className="grid grid-cols-2 gap-3">
                       <label className="text-[9px] font-bold text-gray-400">
                          Trans X (px)
                          <input type="range" min="-100" max="100" value={m.translateX} onChange={(e) => updateMember(m.id, 'translateX', e.target.value)} className="w-full accent-blue-500 h-1 mt-1" />
                       </label>
                       <label className="text-[9px] font-bold text-gray-400">
                          Trans Y (px)
                          <input type="range" min="-100" max="100" value={m.translateY} onChange={(e) => updateMember(m.id, 'translateY', e.target.value)} className="w-full accent-blue-500 h-1 mt-1" />
                       </label>
                     </div>
                     
                     {/* Scale */}
                     <label className="text-[9px] font-bold text-gray-400 block">
                        Scale (1-3)
                        <input type="range" min="1" max="3" step="0.1" value={m.scale} onChange={(e) => updateMember(m.id, 'scale', e.target.value)} className="w-full accent-red-500 h-1 mt-1" />
                     </label>
                  </div>
                </div>
              ))}
            </div>
            {/* Save & Copy Button */}
            <div className="mt-4 space-y-2">
              <button 
                onClick={handleSaveConfig}
                className="w-full py-3 bg-[#079108] text-white font-black text-[10px] uppercase tracking-widest rounded shadow-lg hover:bg-[#068007] transition-all active:scale-95"
              >
                {saveStatus || 'SAVE & COPY CONFIG'}
              </button>
              
              <div className="pt-2 border-t border-white/20">
                  <p className="text-[9px] text-[#079108] mb-1 font-bold uppercase">Config JSON:</p>
                  <textarea 
                    className="w-full h-24 bg-black text-[9px] font-mono text-green-400 p-2 rounded border border-white/10 focus:outline-none select-text pointer-events-auto"
                    onClick={(e) => e.target.select()}
                    value={JSON.stringify(members.map(m => ({
                      id: m.id, 
                      name: m.name, 
                      color: m.color, 
                      photo: m.photo, 
                      posX: m.posX, posY: m.posY, scale: m.scale, translateX: m.translateX, translateY: m.translateY
                    })), null, 2)}
                    onChange={() => {}}
                  />
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default HomePage
