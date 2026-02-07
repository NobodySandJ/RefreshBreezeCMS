import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaHeart, FaArrowLeft, FaBirthdayCake, FaInstagram, FaPalette, FaQuoteLeft } from 'react-icons/fa'
import Header from '../components/Header'
import Footer from '../components/Footer'
import api from '../lib/api'
import Skeleton from '../components/Skeleton'

// Hardcoded member data from JSON
const memberData = {
  'yanyee': {
    color: '#F97316',
    gradient: 'from-orange-400 to-amber-500',
    emoji: '🍪',
    namaPanggung: '🍪 YanYee 🍪',
    tagline: 'Anggun, Hangat, Cerah',
    jiko: '"manis, lembut, dan selalu siap membuat harimu jadi lebih hangat seperti cookies yang baru matang🍪. haloo semuaa, aku yan yee!🪽"',
    tanggalLahir: '22 November',
    hobi: 'Makeup, dance, baking',
    instagram: '@ho_yan.yee',
    gallery: ['yanyee1.webp', 'yanyee2.webp', 'yanyee3.webp']
  },
  'sinta': {
    color: '#10B981',
    gradient: 'from-green-400 to-emerald-500',
    emoji: '🍃',
    namaPanggung: '🍃 Sinta 🍃',
    tagline: 'Pemalu, Penasaran',
    jiko: '"Si pemalu tetapi suka hal-hal baru, haloo aku Sintaa"',
    tanggalLahir: '12 Oktober',
    hobi: 'Memasak, menyanyi, menari, nonton anime, tidur',
    instagram: '@sii_ntaa',
    gallery: ['sinta1.webp', 'sinta2.webp', 'sinta3.webp']
  },
  'cissi': {
    color: '#F472B6',
    gradient: 'from-pink-400 to-rose-500',
    emoji: '👑',
    namaPanggung: '👑 Cissi 👑',
    tagline: 'Imajinatif, Penari',
    jiko: '"Aiyaiya, i\'m your little butterfly~ Kupu-kupu yang suka menari dan bisa membuatmu bahagia, halo halo semuanya aku Cissi"',
    tanggalLahir: '22 Agustus',
    hobi: 'Dance dan melamun',
    instagram: '@bakedciz',
    gallery: ['cissi1.webp', 'cissi2.webp', 'cissi3.webp']
  },
  'channie': {
    color: '#34D399',
    gradient: 'from-emerald-400 to-green-500',
    emoji: '✨',
    namaPanggung: '✨ Channie ✨',
    tagline: 'Kreatif, Menghibur',
    jiko: '"Semungil bintang yang akan menerangi hatimu seperti bulan, halo semuanya aku Channie!"',
    tanggalLahir: '8 September',
    hobi: 'Dance, bikin koreo, nulis, makan gorengan',
    instagram: '@zzuchannie',
    gallery: ['channie1.webp', 'channie2.webp', 'channie3.webp']
  },
  'acaa': {
    color: '#3B82F6',
    gradient: 'from-blue-500 to-blue-600',
    emoji: '💙',
    namaPanggung: '💙 Acaa 💙',
    tagline: 'Ceria, Usil, Lincah',
    jiko: '"Citcitcutcuit dengarlah kicauanku yang akan meramaikan hatimuuu"',
    tanggalLahir: '25 Agustus',
    hobi: 'Nyanyi, turu, main emel, berak, repeat',
    instagram: '@caafoxy',
    gallery: ['aca1.webp', 'aca2.webp', 'aca3.webp']
  },
  'cally': {
    color: '#A78BFA',
    gradient: 'from-violet-400 to-purple-500',
    emoji: '🪼',
    namaPanggung: '🪼 Cally 🪼',
    tagline: 'Lembut, Weirdo',
    jiko: '"Mengapung lembut dihatimu seperti ubur ubur yang menari di laut🪼~ Hallo aku Cally!!!"',
    tanggalLahir: '5 September',
    hobi: 'Menonton film, mempertanyakan eksistensi diri sendiri, menyanyi',
    instagram: '@calismilikitiw',
    gallery: ['cally1.webp', 'cally2.webp', 'cally3.webp']
  },
  'piya': {
    color: '#FBBF24',
    gradient: 'from-amber-400 to-yellow-500',
    emoji: '🐰',
    namaPanggung: '🐰 Piya 🐰',
    tagline: 'Periang, Lucu',
    jiko: '"Pyon! pyon! seperti kelinci yang melompat tinggi aku akan melompat ke posisi tertinggi di hatimu 🐰 ~ Hallo aku Piya !!"',
    tanggalLahir: '1 Januari',
    hobi: 'Gambar dan main rosbloz',
    instagram: '@matcvie_',
    gallery: ['piya1.webp', 'piya2.webp', 'piya3.webp']
  }
}

const MembersPage = () => {
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [loading, setLoading] = useState(true)

  const sanitizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

  const getMemberData = (name) => {
    const clean = sanitizeName(name)
    // Handle 'aca' vs 'acaa' mismatch
    if (clean === 'aca') return memberData['acaa']
    return memberData[clean] || { 
      color: '#079108', 
      gradient: 'from-green-500 to-emerald-600', 
      emoji: '💚',
      tagline: 'Member',
      jiko: '',
      tanggalLahir: '-',
      hobi: '-',
      instagram: '-'
    }
  }

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get('/members')
        if (response.data.success) {
          const sorted = response.data.data
            .filter(m => m.member_id !== 'group')
            .sort((a, b) => a.nama_panggung.localeCompare(b.nama_panggung))
          setMembers(sorted)
        }
      } catch (error) {
        console.error('Failed to fetch members:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMembers()
  }, [])

  // Profile images from /images/members/
  const getProfileImage = (name) => {
    const clean = sanitizeName(name)
    if (clean === 'acaa' || clean === 'aca') return '/images/members/aca.webp'
    return `/images/members/${clean}.webp`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 overflow-x-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#079108]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-100/20 via-purple-100/20 to-blue-100/20 rounded-full blur-3xl"></div>
      </div>

      <Header />

      <main className="relative pt-28 pb-20 container mx-auto max-w-6xl px-4">
        <AnimatePresence mode="wait">
          {!selectedMember ? (
            // GRID VIEW
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Hero Section */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-[2rem] overflow-hidden h-64 md:h-80"
              >
                <img 
                  src="/images/members/group.webp" 
                  alt="Refresh Breeze Members" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
                <div className="absolute inset-0 flex items-center p-8 md:p-12">
                  <div>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-emerald-400 text-xs font-black uppercase tracking-[0.3em] mb-3"
                    >
                      Refresh Breeze
                    </motion.p>
                    <motion.h1 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-4"
                    >
                      Meet The<br/>Members
                    </motion.h1>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-gray-300 max-w-md text-sm md:text-base"
                    >
                      7 individu berbakat yang siap menghibur dan menginspirasi dengan energi positif mereka!
                    </motion.p>
                  </div>
                </div>
              </motion.div>

              {/* Members Grid - Card Layout */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
                {loading ? (
                  [...Array(7)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-3xl bg-white/50 backdrop-blur-sm border border-white/50 overflow-hidden">
                      <Skeleton className="w-full h-full" />
                    </div>
                  ))
                ) : (
                  members.map((member, idx) => {
                    const data = getMemberData(member.nama_panggung)
                    return (
                      <motion.div 
                        key={member.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -10, scale: 1.02 }}
                        onClick={() => setSelectedMember(member)}
                        className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-500"
                        style={{
                          boxShadow: `0 10px 40px ${data.color}20`
                        }}
                      >
                        {/* Image */}
                        <img 
                          src={getProfileImage(member.nama_panggung)} 
                          alt={member.nama_panggung}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        
                        {/* Gradient overlay */}
                        <div 
                          className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                          style={{
                            background: `linear-gradient(to top, ${data.color}, transparent 60%)`
                          }}
                        ></div>

                        {/* Glow effect on hover */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            boxShadow: `inset 0 0 60px ${data.color}40`
                          }}
                        ></div>

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight drop-shadow-lg">
                              {data.namaPanggung}
                            </h3>
                          </div>
                          <p className="text-white/80 text-xs font-medium">{data.tagline}</p>
                        </div>

                        {/* View Profile indicator */}
                        <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <FaHeart className="text-white text-sm" />
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </motion.div>
          ) : (
            // DETAIL VIEW
            <motion.div
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto"
            >
              {(() => {
                const data = getMemberData(selectedMember.nama_panggung)
                const clean = sanitizeName(selectedMember.nama_panggung)
                const folderName = (clean === 'aca' || clean === 'acaa') ? 'aca' : clean
                
                return (
                  <>
                    {/* Back Button */}
                    <motion.button 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setSelectedMember(null)}
                      className="mb-8 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors group"
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                        style={{ backgroundColor: `${data.color}20` }}
                      >
                        <FaArrowLeft style={{ color: data.color }} />
                      </div>
                      Back to Members
                    </motion.button>

                    {/* Profile Hero */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative rounded-[2rem] overflow-hidden mb-8"
                      style={{
                        background: `linear-gradient(135deg, ${data.color}20, ${data.color}05)`
                      }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        {/* Image Side */}
                        <div className="relative h-80 md:h-[500px]">
                          <img 
                            src={getProfileImage(selectedMember.nama_panggung)} 
                            alt={selectedMember.nama_panggung}
                            className="w-full h-full object-cover object-center"
                          />
                          <div 
                            className="absolute inset-0 md:hidden"
                            style={{
                              background: `linear-gradient(to top, ${data.color}, transparent 50%)`
                            }}
                          ></div>
                        </div>

                        {/* Info Side */}
                        <div className="p-8 md:p-12 flex flex-col justify-center">
                          <div className="flex items-center gap-3 mb-4">
                            <div 
                              className="px-4 py-1.5 rounded-full text-white text-xs font-black uppercase tracking-widest"
                              style={{ backgroundColor: data.color }}
                            >
                              {data.tagline}
                            </div>
                          </div>
                          
                          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6" style={{ color: data.color }}>
                            {data.namaPanggung}
                          </h1>

                          {/* Quote / Jikoshoukai */}
                          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/50">
                            <FaQuoteLeft className="text-2xl mb-3" style={{ color: data.color }} />
                            <p className="text-gray-700 leading-relaxed italic">
                              {data.jiko || selectedMember.jikoshoukai || 'Salam kenal semuanya!'}
                            </p>
                          </div>

                          {/* Stats / Details - Vertical List */}
                          <div className="space-y-3">
                            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50 flex items-center gap-4">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${data.color}20` }}
                              >
                                <FaBirthdayCake style={{ color: data.color }} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Birthday</p>
                                <p className="font-black text-gray-900">{data.tanggalLahir}</p>
                              </div>
                            </div>
                            
                            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50 flex items-start gap-4">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${data.color}20` }}
                              >
                                <FaPalette style={{ color: data.color }} />
                              </div>
                              <div className="flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hobi</p>
                                <p className="font-bold text-gray-900">{data.hobi}</p>
                              </div>
                            </div>
                            
                            <a 
                              href={`https://instagram.com/${data.instagram?.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50 flex items-center gap-4 hover:bg-white/80 transition-colors cursor-pointer block"
                            >
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${data.color}20` }}
                              >
                                <FaInstagram style={{ color: data.color }} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Instagram</p>
                                <p className="font-black" style={{ color: data.color }}>{data.instagram}</p>
                              </div>
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Gallery */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: data.color }}
                        >
                          <FaHeart className="text-white" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-widest">Gallery</h2>
                      </div>

                      <div className="grid grid-cols-3 gap-3 md:gap-5">
                        {[1, 2, 3].map((num, idx) => {
                          const imgSrc = `/images/members/gallery/${folderName}/${folderName}${num}.webp`
                          return (
                            <motion.div 
                              key={num}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + idx * 0.1 }}
                              whileHover={{ scale: 1.03 }}
                              className="aspect-square rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                              style={{
                                boxShadow: `0 10px 30px ${data.color}20`
                              }}
                            >
                              <img 
                                src={imgSrc} 
                                alt={`Gallery ${num}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  </>
                )
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  )
}

export default MembersPage
