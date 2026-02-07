import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaShoppingCart, FaPlus, FaMinus, FaChevronRight, FaCamera, FaCheckCircle, FaRegCopy, FaTicketAlt, FaInfoCircle, FaSpinner, FaUniversity } from 'react-icons/fa'
import api from '../lib/api'
import Skeleton from '../components/Skeleton'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getMemberColor, getMemberEmoji, formatMemberName } from '../lib/memberUtils'

const ShopPage = () => {
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  
  // Cart & Order State
  const [cart, setCart] = useState([])
  const [step, setStep] = useState(1)
  
  // Checkout Form State
  const [formData, setFormData] = useState({
    nama_panggilan: '',
    kontak: '',
    event_id: '',
  })
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false)
  const fileInputRef = useRef(null)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  // Helper functions
  const sanitizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

  const getMemberImage = (name) => {
    const clean = sanitizeName(name)
    if (clean === 'acaa' || clean === 'aca') return '/images/shop/aca.webp'
    return `/images/shop/${clean}.webp`
  }

  // getMemberColor is now imported from memberUtils

  // Month mapping for date parsing
  const monthMap = {
    'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
    'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
  }

  const isEventPast = (event) => {
    if (!event.tanggal || !event.bulan || !event.tahun) return false
    
    // Handle date ranges or simple numbers
    // If '25-26', take the last number '26'? Or first? User said "melebihi tanggal".
    // Let's safe-guard by taking the last number if possible, or just the number.
    // If we want PO to close *after* the event starts, checking start date is safe?
    // User: "melebihi tanggal event". Implies strict comparison.
    
    // Simplest: current date > event date
    const current = new Date()
    current.setHours(0, 0, 0, 0)
    
    // Parse day. If range "25-26", parseInt returns 25. 
    // If we want to support ranges properly, we'd split.
    // Assuming 'tanggal' is primarily the start date.
    const day = parseInt(event.tanggal) 
    const month = monthMap[event.bulan]
    const year = parseInt(event.tahun)
    
    if (isNaN(day) || month === undefined || isNaN(year)) return false
    
    const eventDate = new Date(year, month, day)
    
    // If current date is strictly AFTER event date
    return current > eventDate
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, membersRes, eventsRes] = await Promise.all([
          api.get('/config'),
          api.get('/members'),
          api.get('/events?is_past=false')
        ])
        
        if (configRes.data.success) setConfig(configRes.data.data)
        if (membersRes.data.success) {
           const sorted = membersRes.data.data
             .filter(m => m.member_id !== 'group')
             .sort((a, b) => a.nama_panggung.localeCompare(b.nama_panggung))
           setMembers(sorted)
        }
        if (eventsRes.data.success) setEvents(eventsRes.data.data)
        
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const hargaMember = Number(config?.hargaChekiPerMember) || 25000
  const hargaGrup = Number(config?.hargaChekiGrup) || 30000
  const payment = {
    bank: config?.paymentInfo_bank || "BCA",
    rekening: config?.paymentInfo_rekening || "8162015779",
    atasNama: config?.paymentInfo_atasNama || "Reyhan Alfa Sukmajati"
  }

  // Cart Logic
  const addToCart = (type, member = null) => {
    const isGroup = type === 'group'
    const imageUrl = isGroup ? '/images/members/group.webp' : getMemberImage(member.nama_panggung)
    
    const item = {
      id: isGroup ? 'group' : member.id,
      member_id: isGroup ? 'group' : member.id,
      name: isGroup ? 'Cheki Group' : `Cheki ${member.nama_panggung}`,
      price: isGroup ? hargaGrup : hargaMember,
      quantity: 1,
      image: imageUrl
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, item]
    })
  }

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const totalHarga = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Checkout Handling
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Create preview URL
      const previewUrl = URL.createObjectURL(selectedFile)
      setFilePreview(previewUrl)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return alert('Silakan unggah bukti transfer')
    if (!formData.event_id) return alert('Silakan pilih jadwal event')

    setSubmitting(true)
    setUploading(true)
    
    try {
      // Upload file
      const uploadData = new FormData()
      uploadData.append('file', file)
      const uploadRes = await api.post('/upload/payment-proof', uploadData)
      
      setUploading(false)
      
      if (!uploadRes.data.success) throw new Error('Gagal mengunggah bukti bayar')

      // Create order
      const orderData = {
        nama_lengkap: formData.nama_panggilan,
        kontak: formData.kontak,
        event_id: formData.event_id,
        items: cart,
        payment_proof_url: uploadRes.data.data.url
      }
      
      const orderRes = await api.post('/orders', orderData)
      if (orderRes.data.success) {
        setOrderSuccess(orderRes.data.order)
        setCart([])
        setFilePreview(null)
        setStep(3)
      }
    } catch (error) {
      console.error('Order failed:', error)
      alert('Terjadi kesalahan saat memesan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex items-center justify-center">
        <FaSpinner className="text-4xl text-[#079108] animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 text-gray-900 overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#079108]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl"></div>
      </div>

      <Header cartCount={cart.length} onCartClick={() => cart.length > 0 && setStep(1)} />
      
      <main className="relative pt-32 pb-40 container mx-auto max-w-7xl px-4">
        {step === 1 && (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-12">
            {/* LEFT COLUMN: Products */}
            <div className="lg:col-span-2 space-y-12">
                
                {/* Header */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                >
                   <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-3 bg-gradient-to-r from-gray-900 via-gray-700 to-[#079108] bg-clip-text text-transparent">
                     Shop Tickets
                   </h1>
                   <p className="text-gray-500 font-medium text-sm sm:text-base">Dapatkan tiket cheki eksklusif bersama member favoritmu!</p>
                   <div className="absolute -bottom-4 left-0 w-16 sm:w-24 h-1.5 bg-gradient-to-r from-[#079108] to-emerald-300 rounded-full"></div>
                </motion.div>

                {/* Group Cheki Hero Banner */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full h-56 sm:h-64 md:h-72 lg:h-96 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20 group cursor-pointer"
                    onClick={() => addToCart('group')}
                >
                    <div className="absolute inset-0">
                        <img 
                           src="/images/members/group.webp" 
                           alt="Group Cheki" 
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                        {/* Animated gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#079108]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    
                    <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center items-start z-10">
                        <motion.div 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="bg-gradient-to-r from-[#079108] to-emerald-500 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-lg shadow-[#079108]/30"
                        >
                           ✨ Best Value
                        </motion.div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black text-white uppercase tracking-tight mb-2 sm:mb-3 drop-shadow-2xl">
                           Group Cheki
                        </h2>
                        <p className="text-gray-300 font-medium max-w-md text-xs sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-8 hidden sm:block">
                           Foto eksklusif bersama seluruh member Refresh Breeze dalam satu frame.
                        </p>
                        <div className="flex items-center gap-4 sm:gap-8">
                           <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white">IDR {hargaGrup.toLocaleString()}</span>
                           <motion.button 
                             whileHover={{ scale: 1.1 }}
                             whileTap={{ scale: 0.95 }}
                             className="bg-white text-[#079108] w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-white/20 group-hover:bg-[#079108] group-hover:text-white transition-colors duration-300"
                           >
                              <FaPlus className="text-lg" />
                           </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Member Solo Cheki Section */}
                <div className="space-y-8">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#079108] to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-[#079108]/20">
                        <FaTicketAlt className="text-white" />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-wide">Member Solo Cheki</h3>
                   </div>
                   
                   {/* MEMBER GRID - Redesigned */}
                   <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                     {loading ? (
                        [...Array(6)].map((_, i) => (
                          <div key={i} className="aspect-[3/4] rounded-3xl bg-white/50 backdrop-blur-sm border border-white/50 p-4">
                             <Skeleton className="w-full h-full rounded-2xl" />
                          </div>
                        ))
                     ) : (
                        members.map((member, idx) => {
                          const accentColor = getMemberColor(member.nama_panggung)
                          return (
                            <motion.div 
                               key={member.id}
                               initial={{ opacity: 0, y: 30 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ delay: idx * 0.1 }}
                               whileHover={{ y: -8, scale: 1.02 }}
                               className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer"
                               onClick={() => addToCart('member', member)}
                               style={{
                                 boxShadow: `0 4px 30px ${accentColor}20`
                               }}
                            >
                              {/* Card background with glassmorphism */}
                              <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl transition-all duration-500 group-hover:bg-white/90 group-hover:border-white/80" 
                                style={{ 
                                  boxShadow: `0 0 0 0 ${accentColor}` 
                                }}
                              ></div>
                              
                              {/* Glow effect on hover */}
                              <div 
                                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                  boxShadow: `0 0 40px ${accentColor}40, inset 0 0 60px ${accentColor}10`
                                }}
                              ></div>

                              {/* Image container */}
                              <div className="absolute inset-3 top-3 bottom-24 rounded-2xl overflow-hidden bg-gray-100">
                                 <img 
                                    src={getMemberImage(member.nama_panggung)}
                                    alt={member.nama_panggung} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                 />
                                 {/* Gradient overlay */}
                                 <div 
                                   className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                   style={{
                                     background: `linear-gradient(to top, ${accentColor}40, transparent 50%)`
                                   }}
                                 ></div>
                              </div>

                              {/* Content */}
                              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1">
                                 <div className="flex items-center gap-2">
                                   <span 
                                     className="w-2 h-2 rounded-full"
                                     style={{ backgroundColor: accentColor }}
                                   ></span>
                                   <h4 className="text-lg font-black uppercase tracking-tight text-gray-900 truncate">{formatMemberName(member.nama_panggung)}</h4>
                                 </div>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">2-Shot Ticket</p>
                                 <div className="flex items-center justify-between pt-1">
                                    <span 
                                      className="text-base font-black"
                                      style={{ color: accentColor }}
                                    >
                                      IDR {hargaMember.toLocaleString()}
                                    </span>
                                    <motion.div 
                                      whileHover={{ scale: 1.2 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors duration-300"
                                      style={{ backgroundColor: accentColor }}
                                    >
                                       <FaPlus className="text-xs" />
                                    </motion.div>
                                 </div>
                              </div>
                           </motion.div>
                        )})
                     )}
                   </div>
                </div>

                {/* Info Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl flex gap-3 sm:gap-5 items-start shadow-lg shadow-blue-100/30"
                >
                   <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                     <FaInfoCircle className="text-white" />
                   </div>
                   <div>
                      <h4 className="font-bold text-blue-900 uppercase text-xs tracking-widest mb-1">Pre-Order System</h4>
                      <p className="text-sm text-blue-800/70 leading-relaxed">
                         Tiket yang dipesan adalah tiket digital (Pre-Order). Tunjukkan bukti pesanan Anda di booth merchandise saat event berlangsung untuk penukaran.
                      </p>
                   </div>
                </motion.div>
            </div>

            {/* RIGHT COLUMN: Cart Sticky - Hidden on mobile */}
            <div className="hidden lg:block lg:col-span-1">
               <div className="sticky top-32 space-y-6">
                  
                  {/* Cart - Glassmorphism */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-2xl shadow-gray-200/50"
                  >
                     <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <h3 className="text-base font-black uppercase tracking-widest flex items-center gap-3">
                           <FaShoppingCart className="text-[#079108]" /> Your Cart
                        </h3>
                        <motion.span 
                          key={cart.length}
                          initial={{ scale: 1.5 }}
                          animate={{ scale: 1 }}
                          className="bg-gradient-to-r from-[#079108] to-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-[#079108]/20"
                        >
                          {cart.length} Items
                        </motion.span>
                     </div>

                     <div className="space-y-4 mb-6 max-h-[35vh] overflow-y-auto custom-scrollbar pr-2">
                        <AnimatePresence>
                        {cart.length === 0 ? (
                           <motion.div 
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             className="text-center py-12"
                           >
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaTicketAlt className="text-2xl text-gray-300" />
                              </div>
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Cart is empty</p>
                              <p className="text-[10px] text-gray-400 mt-1">Click on a ticket to add</p>
                           </motion.div>
                        ) : (
                           cart.map(item => (
                              <motion.div 
                                key={item.id} 
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex gap-4 p-3 bg-white/80 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow"
                              >
                                 <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 shadow-md">
                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-black uppercase truncate">{item.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-bold mb-2">IDR {item.price.toLocaleString()}</p>
                                    <div className="flex items-center gap-3">
                                       <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1)}} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><FaMinus className="text-[8px]" /></button>
                                       <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                                       <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1)}} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><FaPlus className="text-[8px]" /></button>
                                    </div>
                                 </div>
                              </motion.div>
                           ))
                        )}
                        </AnimatePresence>
                     </div>

                     <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-5 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</span>
                           <span className="text-2xl font-black text-gray-900">IDR {totalHarga.toLocaleString()}</span>
                        </div>
                        <motion.button 
                           whileHover={{ scale: cart.length > 0 ? 1.02 : 1 }}
                           whileTap={{ scale: cart.length > 0 ? 0.98 : 1 }}
                           onClick={() => cart.length > 0 && setStep(2)}
                           disabled={cart.length === 0}
                           className="w-full bg-gradient-to-r from-[#079108] to-emerald-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:shadow-lg hover:shadow-[#079108]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                           Checkout
                        </motion.button>
                     </div>
                  </motion.div>

                  {/* Payment Info Card */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-2xl"
                  >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#079108] blur-[80px] opacity-40"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400 blur-[60px] opacity-20"></div>
                      
                      <div className="relative z-10">
                         <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-[#079108] rounded-lg flex items-center justify-center">
                              <FaUniversity className="text-sm text-white" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">{payment.bank}</span>
                         </div>
                         <motion.div 
                            whileHover={{ scale: 1.02 }}
                            onClick={() => {
                               navigator.clipboard.writeText(payment.rekening)
                               setCopied(true)
                               setTimeout(() => setCopied(false), 2000)
                            }}
                            className="flex items-center gap-4 cursor-pointer mb-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                            title="Click to copy"
                         >
                            <p className="text-2xl font-black tracking-wider flex-1">{payment.rekening}</p>
                            <div className="bg-emerald-500/20 p-2.5 rounded-lg text-emerald-400">
                               {copied ? <FaCheckCircle className="text-sm" /> : <FaRegCopy className="text-sm" />}
                            </div>
                         </motion.div>
                         <AnimatePresence>
                           {copied && (
                             <motion.span 
                               initial={{ opacity: 0, y: -10 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0 }}
                               className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest"
                             >
                               ✓ Copied to clipboard!
                             </motion.span>
                           )}
                         </AnimatePresence>
                         <div className="bg-white/5 inline-block px-4 py-2 rounded-lg mt-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{payment.atasNama}</p>
                         </div>
                      </div>
                  </motion.div>

               </div>
            </div>
          </div>

          {/* Mobile Cart Bottom Bar */}
          {cart.length > 0 && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <FaShoppingCart className="text-xl text-[#079108]" />
                    <span className="absolute -top-2 -right-2 bg-[#079108] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold">Total</p>
                    <p className="text-lg font-black text-gray-900">IDR {totalHarga.toLocaleString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 max-w-[180px] bg-gradient-to-r from-[#079108] to-emerald-500 text-white py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-[#079108]/30"
                >
                  Checkout
                </button>
              </div>
            </div>
          )}
          </>
        )}

        {/* STEP 2: CHECKOUT FORM */}
        {step === 2 && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="max-w-4xl mx-auto"
           >
              <button 
                onClick={() => setStep(1)}
                className="mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-[#079108] transition-colors"
              >
                <FaChevronRight className="rotate-180" /> Back to Shop
              </button>

              <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-2xl">
                 <h2 className="text-3xl font-black uppercase tracking-widest mb-10 text-center bg-gradient-to-r from-gray-900 to-[#079108] bg-clip-text text-transparent">Checkout Order</h2>
                 
                 <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
                    <div className="space-y-6">
                        {/* Nama */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-[#079108] ml-2">Nama</label>
                           <input 
                              required
                              value={formData.nama_panggilan}
                              onChange={e => setFormData({...formData, nama_panggilan: e.target.value})}
                              className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold text-sm sm:text-base focus:outline-none focus:border-[#079108] focus:bg-white transition-all"
                              placeholder="Nama kamu"
                           />
                        </div>
                        
                        {/* Kontak - Simple Input */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-[#079108] ml-2">Kontak (IG / WA)</label>
                           <input 
                              required
                              value={formData.kontak}
                              onChange={e => setFormData({...formData, kontak: e.target.value})}
                              className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold text-sm sm:text-base focus:outline-none focus:border-[#079108] focus:bg-white transition-all"
                              placeholder="@username atau 08xxx"
                           />
                        </div>
                        
                        {/* Pilih Event - Custom Dropdown */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-[#079108] ml-2">Pilih Event</label>
                           <div className="relative">
                              {/* Dropdown Trigger */}
                              <div 
                                 onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
                                 className={`w-full bg-gray-50/80 border-2 rounded-xl sm:rounded-2xl p-3 sm:p-4 pr-12 font-bold text-sm sm:text-base cursor-pointer transition-all flex items-center justify-between ${eventDropdownOpen ? 'border-[#079108] bg-white' : 'border-gray-100 hover:border-gray-200'}`}
                              >
                                 {formData.event_id && events.find(e => e.id === formData.event_id) ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                       <span className="text-[#079108]">📅</span>
                                       <span>{events.find(e => e.id === formData.event_id)?.nama}</span>
                                       {events.find(e => e.id === formData.event_id)?.is_special && (
                                          <span 
                                             className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                                             style={{ backgroundColor: events.find(e => e.id === formData.event_id)?.theme_color || '#FF6B9D' }}
                                          >
                                             {events.find(e => e.id === formData.event_id)?.theme_name || 'Special'}
                                          </span>
                                       )}
                                       <span className="text-gray-400">•</span>
                                       <span className="text-gray-500">{events.find(e => e.id === formData.event_id)?.tanggal} {events.find(e => e.id === formData.event_id)?.bulan}</span>
                                    </div>
                                 ) : (
                                    <span className="text-gray-400">— Pilih Jadwal Event —</span>
                                 )}
                                 <svg className={`w-5 h-5 text-[#079108] transition-transform ${eventDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                 </svg>
                              </div>
                              
                              {/* Dropdown Panel */}
                              <AnimatePresence>
                                 {eventDropdownOpen && (
                                    <motion.div
                                       initial={{ opacity: 0, y: -10 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       exit={{ opacity: 0, y: -10 }}
                                       transition={{ duration: 0.15 }}
                                       className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-100 rounded-2xl shadow-xl overflow-hidden"
                                    >
                                       <div className="max-h-48 overflow-y-auto">
                                          {events.length === 0 ? (
                                             <p className="text-sm text-gray-400 p-4 text-center">Tidak ada event tersedia</p>
                                          ) : (
                                             events.map(ev => {
                                                const isPast = isEventPast(ev)
                                                return (
                                                <div 
                                                   key={ev.id}
                                                   onClick={() => {
                                                      if (!isPast) {
                                                         setFormData({...formData, event_id: ev.id})
                                                         setEventDropdownOpen(false)
                                                      }
                                                   }}
                                                   className={`p-4 transition-all border-b border-gray-50 last:border-b-0 ${
                                                      formData.event_id === ev.id ? 'bg-[#079108]/10' : isPast ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
                                                   }`}
                                                >
                                                   <div className="flex items-center gap-3">
                                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                         formData.event_id === ev.id ? 'border-[#079108] bg-[#079108]' : 'border-gray-300'
                                                      }`}>
                                                         {formData.event_id === ev.id && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                                      </div>
                                                      <div className="flex-1">
                                                         <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-black text-sm">{ev.nama}</p>
                                                            {ev.is_special && (
                                                               <span 
                                                                  className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                                                                  style={{ backgroundColor: ev.theme_color || '#FF6B9D' }}
                                                               >
                                                                  {ev.theme_name || 'Special'}
                                                               </span>
                                                            )}
                                                            {isPast && (
                                                               <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                                                                  Closed
                                                               </span>
                                                            )}
                                                         </div>
                                                         <p className="text-xs text-gray-500">
                                                            {ev.tanggal} {ev.bulan} {ev.tahun} • 📍 {ev.lokasi}
                                                         </p>
                                                      </div>
                                                   </div>
                                                </div>
                                             )})
                                          )}
                                       </div>
                                    </motion.div>
                                 )}
                              </AnimatePresence>
                           </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                       {/* Upload Area with Preview */}
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#079108] ml-2">Bukti Transfer</label>
                          <div 
                             onClick={() => fileInputRef.current.click()}
                             className={`relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all ${file ? 'border-[#079108] bg-[#079108]/5' : 'border-gray-200 hover:border-[#079108]/50 hover:bg-gray-50'}`}
                             style={{ minHeight: '180px' }}
                          >
                             <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*" />
                             {filePreview ? (
                                <div className="relative">
                                   <img src={filePreview} alt="Preview" className="w-full h-48 object-cover" />
                                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                      <p className="text-white text-xs font-bold">Klik untuk ganti</p>
                                   </div>
                                   <div className="absolute top-2 right-2 bg-[#079108] text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                      <FaCheckCircle /> Uploaded
                                   </div>
                                </div>
                             ) : (
                                <div className="h-44 flex flex-col items-center justify-center">
                                   <FaCamera className="text-3xl text-gray-300 mb-2" />
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Upload Bukti Transfer</p>
                                   <p className="text-[10px] text-gray-300 mt-1">Klik atau drag file gambar</p>
                                </div>
                             )}
                          </div>
                          {file && (
                            <p className="text-[10px] text-gray-500 ml-2">
                              📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)
                            </p>
                          )}
                       </div>

                       {/* Total & Submit */}
                       <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                          <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                             <span>Total Bayar</span>
                             <span className="text-gray-900 text-lg font-black">IDR {totalHarga.toLocaleString()}</span>
                          </div>
                          <motion.button 
                             whileHover={{ scale: submitting ? 1 : 1.02 }}
                             whileTap={{ scale: submitting ? 1 : 0.98 }}
                             disabled={submitting}
                             className="w-full bg-gradient-to-r from-gray-900 to-gray-700 text-white py-3.5 sm:py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:from-[#079108] hover:to-emerald-600 transition-all disabled:opacity-70 flex items-center justify-center gap-3"
                          >
                             {submitting ? (
                               <>
                                 <FaSpinner className="animate-spin" />
                                 {uploading ? 'Mengupload...' : 'Memproses Order...'}
                               </>
                             ) : (
                               'Confirm Order'
                             )}
                          </motion.button>
                       </div>
                    </div>
                 </form>
              </div>
           </motion.div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && orderSuccess && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="max-w-xl mx-auto text-center"
           >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-28 h-28 bg-gradient-to-br from-[#079108] to-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#079108]/40"
              >
                 <FaCheckCircle className="text-5xl" />
              </motion.div>
              <h2 className="text-4xl font-black uppercase tracking-widest mb-4 bg-gradient-to-r from-gray-900 to-[#079108] bg-clip-text text-transparent">Order Success!</h2>
              <p className="text-gray-500 mb-8">Terima kasih! Pesananmu telah tersimpan.</p>
              
              <div className="bg-white/80 backdrop-blur-xl border-2 border-dashed border-[#079108]/30 p-8 rounded-3xl mb-8 shadow-lg">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Order ID</p>
                 <p className="text-3xl font-black text-[#079108] tracking-widest select-all">{orderSuccess.order_number}</p>
              </div>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="px-10 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-full font-black uppercase text-xs tracking-widest hover:from-[#079108] hover:to-emerald-600 transition-all shadow-xl"
              >
                 Return Home
              </motion.button>
           </motion.div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default ShopPage
