import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaShoppingCart, FaPlus, FaMinus, FaChevronRight, FaCamera, FaCheckCircle, FaRegCopy, FaTicketAlt, FaInfoCircle, FaSpinner, FaUniversity, FaTrash, FaCopy, FaDownload, FaBox, FaBoxOpen, FaTimes } from 'react-icons/fa'
import { getAssetPath } from '../lib/pathUtils'
import api from '../lib/api'
import Skeleton from '../components/Skeleton'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getMemberColor, getMemberEmoji, formatMemberName } from '../lib/memberUtils'
import { toast } from 'react-toastify'

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
    catatan: '',
  })
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [receiptData, setReceiptData] = useState(null)
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false)
  const [lineupError, setLineupError] = useState(null)
  const fileInputRef = useRef(null)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  // Merch State
  const [merch, setMerch] = useState([])
  const [merchCart, setMerchCart] = useState([])
  const [merchForm, setMerchForm] = useState({ nama_lengkap: '', whatsapp: '', instagram: '', catatan: '' })
  const [merchFile, setMerchFile] = useState(null)
  const [merchFilePreview, setMerchFilePreview] = useState(null)
  const [merchSubmitting, setMerchSubmitting] = useState(false)
  const [merchUploading, setMerchUploading] = useState(false)
  const [merchOrderSuccess, setMerchOrderSuccess] = useState(null)
  const [merchReceiptData, setMerchReceiptData] = useState(null)
  const merchFileInputRef = useRef(null)
  const [selectedMerch, setSelectedMerch] = useState(null)

  // Helper functions
  const sanitizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

  const getMemberImage = (member) => {
    // Prefer member_id for mapping to simplified filenames
    const id = member.member_id || sanitizeName(member.nama_panggung)
    const clean = id.replace('aa', 'a') // normalize acaa to aca if needed, or keep as is
    
    // Check for aca/acaa specifically since we named it aca.webp
    if (clean === 'aca' || clean === 'acaa') return getAssetPath('/images/shop/aca.webp')
    
    return getAssetPath(`/images/shop/${clean}.webp`)
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

        // Merch fetched separately so it doesn't break page if table doesn't exist yet
        try {
          const merchRes = await api.get('/merchandise?available=true')
          if (merchRes.data.success) setMerch(merchRes.data.data)
        } catch (_) {
          // Table not created yet, ignore
        }
        
        if (configRes.data.success) setConfig(configRes.data.data)
        if (membersRes.data.success) {
           const heroOrder = ['cissi', 'acaa', 'channie', 'cally', 'sinta', 'piya']
           const sorted = membersRes.data.data
             .filter(m => m.member_id !== 'group' && m.member_id !== 'yanyee')
             .sort((a, b) => {
                const indexA = heroOrder.indexOf(a.member_id)
                const indexB = heroOrder.indexOf(b.member_id)
                return (indexA !== -1 ? indexA : 99) - (indexB !== -1 ? indexB : 99)
             })
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
    bank: "BCA",
    rekening: "0902683273",
    atasNama: "Natasya Angelina Putri"
  }

  // Cart Logic
  const addToCart = (type, member = null) => {
    const isGroup = type === 'group'
    const imageUrl = isGroup ? getAssetPath('/images/members/group.webp') : getMemberImage(member)
    
    const item = {
      id: isGroup ? 'group' : member.id,
      member_id: isGroup ? 'group' : member.id,
      name: isGroup ? 'Cheki Group' : `Cheki ${member.nama_panggung}`,
      price: isGroup ? hargaGrup : hargaMember,
      quantity: 1,
      image: imageUrl
    }

    // Toast Logic (Side Effect outside of setState)
    const existing = cart.find(i => i.id === item.id)
    const newQty = existing ? existing.quantity + 1 : 1
    
    const toastId = `cart-${item.id}`
    const toastContent = (
      <div className="flex items-center gap-4 px-6 py-3 bg-gray-900/95 backdrop-blur-xl rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-w-[280px]">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl shadow-inner border border-white/5">
          {isGroup ? '✨' : getMemberEmoji(member.id)}
        </div>
        <div className="flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 leading-none mb-1.5">Added to Cart</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-white whitespace-nowrap">{item.name}</p>
            <span className="text-white/40 text-[10px] font-bold">• {newQty}x</span>
          </div>
        </div>
      </div>
    )

    const toastOptions = {
      toastId,
      position: "bottom-center",
      autoClose: 2500,
      className: "!bg-transparent !p-0 !shadow-none min-h-0",
      bodyClassName: "!p-0 !m-0",
      closeButton: false,
    }

    if (toast.isActive(toastId)) {
      toast.update(toastId, { render: toastContent, ...toastOptions })
    } else {
      toast(toastContent, toastOptions)
    }

    setCart(prev => {
      const existingInPrev = prev.find(i => i.id === item.id)
      if (existingInPrev) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, item]
    })
  }

  const updateQuantity = (id, delta) => {
    // Check if removal is needed for toast
    const item = cart.find(i => i.id === id)
    if (item && item.quantity === 1 && delta === -1) {
      // Toast for removal
      toast(
        <div className="flex items-center gap-4 px-6 py-3 bg-red-900/90 backdrop-blur-xl rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-w-[280px]">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl shadow-inner border border-white/5">
            🗑️
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 leading-none mb-1.5">Removed from Cart</p>
            <p className="text-sm font-black text-white whitespace-nowrap">{item.name}</p>
          </div>
        </div>,
        {
          position: "bottom-center",
          autoClose: 2000,
          className: "!bg-transparent !p-0 !shadow-none min-h-0",
          bodyClassName: "!p-0 !m-0",
          closeButton: false,
        }
      )
    }

    setCart(prev => {
      const itemInPrev = prev.find(i => i.id === id)
      if (itemInPrev && itemInPrev.quantity === 1 && delta === -1) {
        return prev.filter(i => i.id !== id)
      }

      return prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta)
          return { ...item, quantity: newQty }
        }
        return item
      })
    })
  }

  const removeFromCart = (id) => {
    const item = cart.find(i => i.id === id)
    if (item) {
      toast(
        <div className="flex items-center gap-4 px-6 py-3 bg-red-900/90 backdrop-blur-xl rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-w-[280px]">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl shadow-inner border border-white/5">
            🗑️
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 leading-none mb-1.5">Removed from Cart</p>
            <p className="text-sm font-black text-white whitespace-nowrap">{item.name}</p>
          </div>
        </div>,
        {
          position: "bottom-center",
          autoClose: 2000,
          className: "!bg-transparent !p-0 !shadow-none min-h-0",
          bodyClassName: "!p-0 !m-0",
          closeButton: false,
        }
      )
    }
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const totalHarga = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // ”—€ Merch Cart Logic ”—————————————————————————————————————€
  const addToMerchCart = (item) => {
    const existing = merchCart.find(i => i.id === item.id)
    const newQty = existing ? existing.quantity + 1 : 1
    const toastId = `merch-${item.id}`
    const toastContent = (
      <div className="flex items-center gap-4 px-6 py-3 bg-gray-900/95 backdrop-blur-xl rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-w-[280px]">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl shadow-inner border border-white/5">🛍️</div>
        <div className="flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 leading-none mb-1.5">Added to Cart</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-white whitespace-nowrap">{item.nama}</p>
            <span className="text-white/40 text-[10px] font-bold">• {newQty}x</span>
          </div>
        </div>
      </div>
    )
    const toastOptions = { toastId, position: "bottom-center", autoClose: 2500, className: "!bg-transparent !p-0 !shadow-none min-h-0", bodyClassName: "!p-0 !m-0", closeButton: false }
    if (toast.isActive(toastId)) toast.update(toastId, { render: toastContent, ...toastOptions })
    else toast(toastContent, toastOptions)

    setMerchCart(prev => {
      const ex = prev.find(i => i.id === item.id)
      if (ex) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const updateMerchQuantity = (id, delta) => {
    setMerchCart(prev => {
      const item = prev.find(i => i.id === id)
      if (item && item.quantity === 1 && delta === -1) return prev.filter(i => i.id !== id)
      return prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    })
  }

  const removeFromMerchCart = (id) => setMerchCart(prev => prev.filter(i => i.id !== id))
  const totalMerchHarga = merchCart.reduce((sum, i) => sum + (i.harga * i.quantity), 0)

  const handleMerchFileChange = (e) => {
    const f = e.target.files[0]
    if (f) { setMerchFile(f); setMerchFilePreview(URL.createObjectURL(f)) }
  }

  const handleMerchSubmit = async (e) => {
    e.preventDefault()
    if (!merchForm.nama_lengkap.trim()) return alert('Silakan isi nama lengkap kamu')
    if (!merchFile) return alert('Silakan unggah bukti transfer')

    setMerchSubmitting(true)
    setMerchUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', merchFile)
      const uploadRes = await api.post('/upload/payment-proof', uploadData)
      setMerchUploading(false)

      if (!uploadRes.data.success) throw new Error('Gagal mengunggah bukti bayar')

      const orderData = {
        nama_lengkap: merchForm.nama_lengkap,
        whatsapp: merchForm.whatsapp,
        instagram: merchForm.instagram || null,
        catatan: merchForm.catatan || null,
        items: merchCart.map(i => ({ merchandise_id: i.id, nama: i.nama, harga: i.harga, quantity: i.quantity })),
        payment_proof_url: uploadRes.data.data.url
      }

      const orderRes = await api.post('/merch-orders', orderData)
      if (orderRes.data.success) {
        setMerchReceiptData({
          orderNumber: orderRes.data.order.order_number,
          items: merchCart.map(i => ({ name: i.nama, quantity: i.quantity, price: i.harga, image: i.gambar_url || null })),
          nama: merchForm.nama_lengkap,
          whatsapp: merchForm.whatsapp,
          instagram: merchForm.instagram || '-',
          catatan: merchForm.catatan || '',
          total: totalMerchHarga,
          createdAt: new Date().toLocaleString('id-ID')
        })
        setMerchOrderSuccess(orderRes.data.order)
        setMerchCart([])
        setMerchFilePreview(null)
        setMerchFile(null)
        setStep(5)
      }
    } catch (error) {
      console.error('Merch order failed:', error)
      alert('Terjadi kesalahan saat memesan. Silakan coba lagi.')
    } finally {
      setMerchSubmitting(false)
      setMerchUploading(false)
    }
  }

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

    // Validation: Check if cart items are allowed in the selected event (Lineup Check)
    const selectedEvent = events.find(e => e.id === formData.event_id)
    // Lineup validation only for SPECIAL events
    const isEventSpecial = selectedEvent?.is_special || selectedEvent?.type === 'special' || !!selectedEvent?.theme_name || !!selectedEvent?.theme_color
    if (selectedEvent && isEventSpecial && selectedEvent.event_lineup && selectedEvent.event_lineup.length > 0) {
     const allowedMemberIds = selectedEvent.event_lineup.map(l => l.member_id)
     const invalidItems = cart.filter(item => {
        if (item.member_id === 'group') return false
        return !allowedMemberIds.some(id => String(id) === String(item.member_id))
     })

     if (invalidItems.length > 0) {
        setLineupError({
           eventName: selectedEvent.nama,
           eventColor: selectedEvent.theme_color || '#FF6B9D',
           themeName: selectedEvent.theme_name || 'Special',
           items: invalidItems
        })
        return
     }
  }

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
        payment_proof_url: uploadRes.data.data.url,
        catatan: formData.catatan || null
      }
      
      const orderRes = await api.post('/orders', orderData)
      if (orderRes.data.success) {
        // Save receipt data before clearing cart
        const selectedEvent = events.find(e => e.id === formData.event_id)
        setReceiptData({
          orderNumber: orderRes.data.order.order_number,
          eventName: selectedEvent?.nama || '-',
          eventDate: selectedEvent ? `${selectedEvent.tanggal} ${selectedEvent.bulan} ${selectedEvent.tahun}` : '-',
          items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
          nama: formData.nama_panggilan,
          kontak: formData.kontak,
          catatan: formData.catatan || '',
          total: totalHarga,
          paymentProofName: file?.name || '-',
          createdAt: new Date().toLocaleString('id-ID')
        })
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

  // Derived Theme Color for UI
  const selectedEventForTheme = events.find(e => e.id === formData.event_id)
  const isSpecialEvent = selectedEventForTheme?.is_special || selectedEventForTheme?.type === 'special' || !!selectedEventForTheme?.theme_name || !!selectedEventForTheme?.theme_color
  const themeColor = isSpecialEvent ? (selectedEventForTheme.theme_color || '#FF6B9D') : '#079108'

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
                           src={getAssetPath('/images/members/group.webp')} 
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
                           œ¨ Best Value
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
                      <h3 className="text-2xl font-black uppercase tracking-wide">Member Cheki</h3>
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
                              <div className="absolute inset-3 top-3 bottom-24 rounded-2xl overflow-hidden bg-gradient-to-b from-white/20 to-white/40 backdrop-blur-sm border border-white/30">
                                 <img 
                                    src={getMemberImage(member)}
                                    alt={member.nama_panggung} 
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 p-2"
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

                {/* ”———€ OFFICIAL MERCH SECTION ”———€ */}
                {merch.length > 0 && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#079108] to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-[#079108]/20">
                      <FaBox className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-wide">Official Merch</h3>
                      <p className="text-xs text-gray-400 font-semibold mt-0.5">Merchandise resmi Refresh Breeze</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {merch.map((item, idx) => {
                      const inCart = merchCart.find(i => i.id === item.id)
                      const habis = item.stok > 0 && item.stok <= (inCart?.quantity || 0)
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          whileHover={!habis ? { y: -6, scale: 1.02 } : {}}
                          className={`group relative bg-white rounded-3xl overflow-hidden shadow-lg transition-all duration-300 border border-gray-100 ${habis ? 'opacity-60' : 'hover:shadow-2xl hover:shadow-emerald-200/40'}`}
                        >
                          {/* Image — click opens modal */}
                          <div
                            className="relative aspect-square overflow-hidden cursor-zoom-in"
                            onClick={() => setSelectedMerch(item)}
                          >
                            {item.gambar_url ? (
                              <img src={item.gambar_url} alt={item.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-gray-100 flex items-center justify-center">
                                <FaBox className="text-5xl text-emerald-200" />
                              </div>
                            )}
                            {/* Zoom hint overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full tracking-widest uppercase">” Lihat Detail</span>
                            </div>
                            {habis && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="bg-red-500 text-white text-xs font-black uppercase px-4 py-2 rounded-full tracking-widest">Habis</span>
                              </div>
                            )}
                            {!habis && inCart && (
                              <div className="absolute top-2 right-2 bg-[#079108] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                                {inCart.quantity}x
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-4 space-y-2">
                            <h4 className="font-black text-sm uppercase tracking-tight text-gray-900 leading-tight">{item.nama}</h4>
                            {item.deskripsi && <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{item.deskripsi}</p>}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-base font-black text-[#079108]">IDR {item.harga.toLocaleString()}</span>
                              {!habis && (
                                <motion.div
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="w-8 h-8 rounded-full bg-[#079108] flex items-center justify-center text-white shadow-md cursor-pointer"
                                  onClick={() => addToMerchCart(item)}
                                >
                                  <FaPlus className="text-xs" />
                                </motion.div>
                              )}
                            </div>
                            {(!item.stok || item.stok === 0) && (
                              <p className="text-[10px] text-emerald-600 font-bold">⏳ Pre-Order</p>
                            )}
                            {item.stok > 0 && item.stok <= 10 && !habis && (
                              <p className="text-[10px] text-orange-500 font-bold">⚠️ Sisa {item.stok} item</p>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
                )}
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
                                    <div className="flex items-start justify-between">
                                       <h4 className="text-xs font-black uppercase truncate">{item.name}</h4>
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); removeFromCart(item.id) }}
                                         className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                       >
                                          <FaTrash className="text-[10px]" />
                                       </button>
                                    </div>
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

                  {/* Payment Info Card - Blue Premium */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-[#4A90B5] to-[#2B5D7A] text-white p-6 rounded-3xl relative overflow-hidden shadow-2xl group border border-white/10"
                  >
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
                      
                      <div className="relative z-10">
                         <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 shadow-inner">
                              <FaUniversity className="text-sm text-white" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-blue-100">{payment.bank}</span>
                         </div>
                         <motion.div 
                            whileHover={{ scale: 1.02 }}
                            onClick={() => {
                               navigator.clipboard.writeText(payment.rekening)
                               setCopied(true)
                               setTimeout(() => setCopied(false), 2000)
                            }}
                            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center justify-between group/number hover:bg-white/20 transition-all cursor-pointer active:scale-95 shadow-lg mb-3"
                            title="Click to copy"
                         >
                            <p className="text-xl font-black tracking-wider flex-1 truncate">{payment.rekening}</p>
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover/number:bg-blue-500 transition-all">
                               {copied ? <FaCheckCircle className="text-xs" /> : <FaCopy className="text-xs" />}
                            </div>
                         </motion.div>
                         <AnimatePresence>
                           {copied && (
                             <motion.span 
                               initial={{ opacity: 0, y: -10 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0 }}
                               className="text-[10px] font-bold text-blue-200 uppercase tracking-widest"
                             >
                               œ“ Copied!
                             </motion.span>
                           )}
                         </AnimatePresence>
                         <div className="bg-black/20 backdrop-blur-md rounded-xl px-4 py-2 mt-2 border border-white/5">
                            <p className="text-[10px] font-bold text-blue-100/60 uppercase tracking-widest leading-tight">{payment.atasNama}</p>
                         </div>
                      </div>
                  </motion.div>

                  {/* Merch Cart */}
                  {merchCart.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/70 backdrop-blur-xl border border-emerald-200/50 rounded-3xl p-6 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                      <h3 className="text-base font-black uppercase tracking-widest flex items-center gap-3">
                        <FaBox className="text-[#079108]" /> Merch Cart
                      </h3>
                      <span className="bg-gradient-to-r from-[#079108] to-emerald-400 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                        {merchCart.length} Items
                      </span>
                    </div>

                    <div className="space-y-3 mb-5 max-h-[30vh] overflow-y-auto pr-1">
                      {merchCart.map(item => (
                        <div key={item.id} className="flex gap-3 p-3 bg-white/80 rounded-2xl border border-gray-100">
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {item.gambar_url ? <img src={item.gambar_url} alt="" className="max-w-full max-h-full object-contain p-1" /> : <FaBox className="text-emerald-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className="text-xs font-black uppercase truncate">{item.nama}</h4>
                              <button onClick={() => removeFromMerchCart(item.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                                <FaTrash className="text-[10px]" />
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold mb-1.5">IDR {item.harga.toLocaleString()}</p>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateMerchQuantity(item.id, -1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><FaMinus className="text-[8px]" /></button>
                              <span className="text-xs font-black w-5 text-center">{item.quantity}</span>
                              <button onClick={() => updateMerchQuantity(item.id, 1)} className="w-6 h-6 rounded-full bg-[#079108] flex items-center justify-center text-white hover:bg-green-700"><FaPlus className="text-[8px]" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Merch</span>
                        <span className="text-xl font-black text-[#079108]">IDR {totalMerchHarga.toLocaleString()}</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep(4)}
                        className="w-full bg-gradient-to-r from-[#079108] to-emerald-500 text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-widest hover:shadow-lg hover:shadow-[#079108]/30 transition-all"
                      >
                        Checkout Merch
                      </motion.button>
                    </div>
                  </motion.div>
                  )}

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
                 
                 {/* Order Review Section */}
                 <div className="mb-12 space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                          <FaShoppingCart className="text-white text-sm" />
                       </div>
                       <h3 className="text-lg font-black uppercase tracking-widest">Review Items</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <AnimatePresence mode="popLayout">
                       {cart.map(item => (
                          <motion.div 
                            key={item.id} 
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex gap-4 p-4 bg-gray-50/50 backdrop-blur-sm rounded-2xl border border-gray-100 hover:border-blue-200 transition-all group"
                          >
                             <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0 shadow-inner">
                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                   <h4 className="text-xs font-black uppercase truncate pr-2">{item.name}</h4>
                                   <button 
                                     type="button"
                                     onClick={() => removeFromCart(item.id)}
                                     className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                   >
                                      <FaTrash className="text-[10px]" />
                                   </button>
                                </div>
                                <p className="text-[10px] text-gray-500 font-bold mb-3">IDR {item.price.toLocaleString()}</p>
                                <div className="flex items-center gap-3">
                                   <button 
                                     type="button"
                                     onClick={() => updateQuantity(item.id, -1)}
                                     className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                                   >
                                      <FaMinus className="text-[8px]" />
                                   </button>
                                   <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                                   <button 
                                     type="button"
                                     onClick={() => updateQuantity(item.id, 1)}
                                     className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white hover:bg-black transition-colors shadow-md"
                                   >
                                      <FaPlus className="text-[8px]" />
                                   </button>
                                </div>
                             </div>
                          </motion.div>
                       ))}
                       </AnimatePresence>
                    </div>
                    {cart.length === 0 && (
                       <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cart is empty</p>
                          <button type="button" onClick={() => setStep(1)} className="text-[#079108] text-[10px] font-black uppercase mt-2 hover:underline">Go back to shop</button>
                       </div>
                    )}
                 </div>

                 {/* Form Section with Dynamic Theme */}
                 <form 
                    onSubmit={handleSubmit} 
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 pt-10 border-t-2 border-dashed border-gray-100 relative"
                    style={{ '--theme-color': themeColor }}
                 >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-6">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Form Pemesanan</span>
                    </div>

                    <div className="space-y-6">
                        {/* Nama */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-color)] ml-2">Nama</label>
                           <input 
                               required
                               value={formData.nama_panggilan}
                               onChange={e => setFormData({...formData, nama_panggilan: e.target.value})}
                               className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold text-sm sm:text-base focus:outline-none focus:border-[var(--theme-color)] focus:bg-white transition-all"
                               placeholder="Nama kamu"
                            />
                        </div>
                        
                        {/* Kontak */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-color)] ml-2">Kontak (IG / WA)</label>
                           <input 
                               required
                               value={formData.kontak}
                               onChange={e => setFormData({...formData, kontak: e.target.value})}
                               className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold text-sm sm:text-base focus:outline-none focus:border-[var(--theme-color)] focus:bg-white transition-all"
                               placeholder="@username atau 08xxx"
                            />
                        </div>
                        
                        {/* Pilih Event */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-color)] ml-2">Pilih Event</label>
                           <div className="relative">
                              <div 
                                 onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
                                 className={`w-full bg-gray-50/80 border-2 rounded-xl sm:rounded-2xl p-3 sm:p-4 pr-12 font-bold text-sm sm:text-base cursor-pointer transition-all flex items-center justify-between ${eventDropdownOpen ? 'border-[var(--theme-color)] bg-white' : 'border-gray-100 hover:border-gray-200'}`}
                              >
                                 {formData.event_id && events.find(e => e.id === formData.event_id) ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                       <span className="text-[var(--theme-color)]">“…</span>
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
                                  <svg className={`w-5 h-5 text-[var(--theme-color)] transition-transform ${eventDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                 </svg>
                              </div>
                              
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
                                                     formData.event_id === ev.id ? 'bg-gray-100' : isPast ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
                                                   }`}
                                                   style={formData.event_id === ev.id ? { backgroundColor: `${ev.theme_color || '#079108'}10` } : {}}
                                                >
                                                   <div className="flex items-center gap-3">
                                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                         formData.event_id === ev.id ? 'border-[var(--theme-color)] bg-[var(--theme-color)]' : 'border-gray-300'
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

                        {/* Catatan */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Catatan <span className="normal-case font-semibold tracking-normal">(opsional)</span></label>
                           <textarea 
                              value={formData.catatan}
                              onChange={e => setFormData({...formData, catatan: e.target.value})}
                              className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold text-sm sm:text-base focus:outline-none focus:border-[var(--theme-color)] focus:bg-white transition-all resize-none"
                              placeholder="Contoh: saya tidak bisa hadir, tolong dikirim ya / ambil di event (COD)"
                              rows={3}
                           />
                           <p className="text-[10px] text-gray-400 ml-2 italic">NB: Catatan bersifat opsional. Bisa diisi jika kamu tidak bisa hadir di event, ingin cheki dikirim, atau ambil langsung (COD) di lokasi.</p>
                        </div>
                    </div>
                     
                    <div className="space-y-6">
                        {/* Payment Information Card */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 ml-2">Pembayaran via BCA</label>
                           <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-gradient-to-br from-[#4A90B5] to-[#2B5D7A] p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group border border-white/10"
                           >
                              {/* Abstract Shapes */}
                              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
                              
                              <div className="relative z-10 space-y-5">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                                          <FaUniversity className="text-lg" />
                                       </div>
                                       <span className="font-black tracking-[0.3em] text-[10px] uppercase opacity-90">BCA TRANSFER</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                                       <span className="text-[8px] font-black tracking-widest uppercase">Verified</span>
                                    </div>
                                 </div>

                                 <div 
                                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex items-center justify-between group/number hover:bg-white/20 transition-all cursor-pointer active:scale-95 shadow-lg"
                                    onClick={() => {
                                       navigator.clipboard.writeText('0902683273');
                                       toast.info(
                                          <div className="flex items-center gap-3">
                                             <FaCopy className="text-blue-400" />
                                             <span className="font-bold text-xs uppercase tracking-widest">Account Copied!</span>
                                          </div>,
                                          { 
                                            position: "bottom-center", 
                                            autoClose: 2000, 
                                            className: "!bg-gray-900 !text-white !rounded-full !border !border-white/10",
                                            hideProgressBar: true,
                                            closeButton: false
                                          }
                                       );
                                    }}
                                 >
                                    <div>
                                       <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Account Number</p>
                                       <p className="text-2xl sm:text-3xl font-black tracking-widest">0902683273</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover/number:bg-blue-500 group-hover/number:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all">
                                       <FaCopy className="text-sm" />
                                    </div>
                                 </div>

                                 <div className="inline-block px-5 py-3 bg-black/20 backdrop-blur-md rounded-2xl border border-white/5">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Account Holder</p>
                                    <p className="text-xs sm:text-sm font-black uppercase tracking-[0.1em] text-blue-100">NATASYA ANGELINA PUTRI</p>
                                 </div>
                              </div>
                           </motion.div>
                        </div>

                        {/* Upload */}
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-color)] ml-2">Bukti Transfer</label>
                          <div 
                             onClick={() => fileInputRef.current.click()}
                             className={`relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all ${file ? 'border-[var(--theme-color)] bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}
                             style={{ minHeight: '180px' }}
                          >
                             <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*" />
                             {filePreview ? (
                                <div className="relative">
                                   <img src={filePreview} alt="Preview" className="w-full h-48 object-cover" />
                                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                      <p className="text-white text-xs font-bold">Klik untuk ganti</p>
                                   </div>
                                    <div className="absolute top-2 right-2 bg-[var(--theme-color)] text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
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
                              “Ž {file.name} ({(file.size / 1024).toFixed(0)} KB)
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
                             className="w-full bg-[var(--theme-color)] text-white py-3.5 sm:py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all disabled:opacity-70 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                             style={{ background: isSpecialEvent ? 'var(--theme-color)' : 'linear-gradient(to right, #4A90B5, #3B7A9E)' }}
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
              <p className="text-gray-500 mb-8">Terima kasih! Berikut adalah nota pemesananmu:</p>
              
              {/* Receipt Preview */}
              {receiptData && (
                <div className="mb-8 flex flex-col items-center">
                   <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                      <canvas 
                        id="receipt-canvas"
                        className="max-w-full h-auto bg-white"
                        style={{ maxWidth: '350px' }}
                      />
                   </div>
                   <p className="text-[10px] text-gray-400 mt-2 italic">Preview nota otomatis di-generate</p>
                   
                   {/* Draw Canvas Effect */}
                   <ReceiptDrawer receiptData={receiptData} />
                </div>
              )}

              {/* IGS Callout */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8 text-center"
              >
                <p className="text-[11px] text-gray-400 mb-2">
                  Bagikan notamu ke IGS dan tag{' '}
                  <a href="https://www.instagram.com/refreshbreeze" target="_blank" rel="noopener noreferrer" className="font-black text-pink-400 hover:text-pink-500 transition-colors">@refreshbreeze</a>
                  {' '}— bantu Refresh Breeze makin dikenal! 💚
                </p>
              </motion.div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {receiptData && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                       const canvas = document.getElementById('receipt-canvas')
                       if (canvas) {
                          const link = document.createElement('a')
                          link.download = `Nota_${receiptData.orderNumber}.png`
                          link.href = canvas.toDataURL('image/png')
                          link.click()
                       }
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-[#079108] to-emerald-500 text-white rounded-full font-black uppercase text-xs tracking-widest hover:shadow-xl hover:shadow-[#079108]/30 transition-all flex items-center gap-3"
                  >
                    <FaDownload /> Download Nota
                  </motion.button>
                )}

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="px-10 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-full font-black uppercase text-xs tracking-widest hover:from-gray-700 hover:to-gray-600 transition-all shadow-xl"
                >
                   Return Home
                </motion.button>
              </div>
           </motion.div>
        )}

        {/* STEP 4: MERCH CHECKOUT */}
        {step === 4 && (
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
              <h2 className="text-3xl font-black uppercase tracking-widest mb-10 text-center bg-gradient-to-r from-gray-900 to-[#079108] bg-clip-text text-transparent">Checkout Merch</h2>

              {/* Review Merch Items */}
              <div className="mb-10 space-y-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-[#079108] rounded-xl flex items-center justify-center">
                    <FaBox className="text-white text-sm" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-widest">Review Items</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {merchCart.map(item => (
                    <div key={item.id} className="flex gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="w-16 h-16 rounded-xl bg-emerald-50 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                        {item.gambar_url ? <img src={item.gambar_url} alt="" className="max-w-full max-h-full object-contain" /> : <FaBox className="text-2xl text-emerald-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-black uppercase truncate pr-2">{item.nama}</h4>
                          <button type="button" onClick={() => removeFromMerchCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                            <FaTrash className="text-[10px]" />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold mb-2">IDR {item.harga.toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => updateMerchQuantity(item.id, -1)} className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 shadow-sm"><FaMinus className="text-[8px]" /></button>
                          <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                          <button type="button" onClick={() => updateMerchQuantity(item.id, 1)} className="w-7 h-7 rounded-lg bg-[#079108] flex items-center justify-center text-white hover:bg-green-700"><FaPlus className="text-[8px]" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {merchCart.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cart is empty</p>
                    <button type="button" onClick={() => setStep(1)} className="text-[#079108] text-[10px] font-black uppercase mt-2 hover:underline">Go back to shop</button>
                  </div>
                )}
              </div>

              {/* Merch Order Form */}
              <form onSubmit={handleMerchSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t-2 border-dashed border-gray-100 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Form Pemesanan Merch</span>
                </div>

                {/* LEFT: Form Fields */}
                <div className="space-y-6">
                  {/* Nama Lengkap */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#079108] ml-2">Nama Lengkap</label>
                    <input
                      required
                      value={merchForm.nama_lengkap}
                      onChange={e => setMerchForm({...merchForm, nama_lengkap: e.target.value})}
                      className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-2xl p-4 font-bold text-sm focus:outline-none focus:border-[#079108] focus:bg-white transition-all"
                      placeholder="Nama lengkap kamu *"
                    />
                    <p className="text-[9px] text-gray-400 ml-1">Wajib diisi</p>
                  </div>

                  {/* No WA & Instagram (side by side) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#079108] ml-2">Kontak</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <input
                          required
                          value={merchForm.whatsapp}
                          onChange={e => setMerchForm({...merchForm, whatsapp: e.target.value})}
                          className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-2xl p-4 font-bold text-sm focus:outline-none focus:border-[#079108] focus:bg-white transition-all"
                          placeholder="No. WhatsApp *"
                          type="tel"
                        />
                        <p className="text-[9px] text-gray-400 ml-1">Wajib diisi</p>
                      </div>
                      <div className="space-y-1">
                        <input
                          value={merchForm.instagram}
                          onChange={e => setMerchForm({...merchForm, instagram: e.target.value})}
                          className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-2xl p-4 font-bold text-sm focus:outline-none focus:border-[#079108] focus:bg-white transition-all"
                          placeholder="@instagram"
                        />
                        <p className="text-[9px] text-gray-400 ml-1">Opsional</p>
                      </div>
                    </div>
                  </div>

                  {/* Catatan */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#079108] ml-2">Catatan Pengiriman</label>
                    <textarea
                      value={merchForm.catatan}
                      onChange={e => setMerchForm({...merchForm, catatan: e.target.value})}
                      className="w-full bg-gray-50/80 border-2 border-gray-100 rounded-2xl p-4 font-bold text-sm focus:outline-none focus:border-[#079108] focus:bg-white transition-all resize-none"
                      placeholder="Tulis alamat lengkap jika ingin dikirim. Ketik COD jika ingin ambil di event."
                      rows={4}
                    />
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
                      <span className="text-orange-500 text-sm mt-0.5">⚠️</span>
                      <p className="text-[10px] text-orange-700 font-semibold leading-relaxed">
                        <strong>Ongkos kirim ditanggung pembeli.</strong> Jika memilih pengiriman, pastikan alamat lengkap agar merch sampai tepat waktu. Untuk COD, ambil langsung di lokasi event.
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Payment + Upload */}
                <div className="space-y-6">
                  {/* BCA Payment Info */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 ml-2">Pembayaran via BCA</label>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-[#4A90B5] to-[#2B5D7A] p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group border border-white/10"
                    >
                      <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>
                      <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
                            <FaUniversity className="text-sm" />
                          </div>
                          <span className="font-black tracking-[0.3em] text-[10px] uppercase opacity-90">BCA TRANSFER</span>
                        </div>
                        <div
                          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/20 transition-all active:scale-95"
                          onClick={() => {
                            navigator.clipboard.writeText('0902683273')
                            toast.info(
                              <div className="flex items-center gap-3"><FaCopy className="text-blue-400" /><span className="font-bold text-xs uppercase tracking-widest">Account Copied!</span></div>,
                              { position: "bottom-center", autoClose: 2000, className: "!bg-gray-900 !text-white !rounded-full !border !border-white/10", hideProgressBar: true, closeButton: false }
                            )
                          }}
                        >
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Account Number</p>
                            <p className="text-2xl font-black tracking-widest">0902683273</p>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-blue-500 transition-all">
                            <FaCopy className="text-sm" />
                          </div>
                        </div>
                        <div className="px-4 py-2 bg-black/20 rounded-xl border border-white/5">
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 mb-0.5">Account Holder</p>
                          <p className="text-xs font-black uppercase tracking-wide text-blue-100">NATASYA ANGELINA PUTRI</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Upload Bukti Transfer */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#079108] ml-2">Bukti Transfer</label>
                    <div
                      onClick={() => merchFileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all ${merchFile ? 'border-[#079108] bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}
                      style={{ minHeight: '160px' }}
                    >
                      <input type="file" ref={merchFileInputRef} hidden onChange={handleMerchFileChange} accept="image/*" />
                      {merchFilePreview ? (
                        <div className="relative">
                          <img src={merchFilePreview} alt="Preview" className="w-full h-44 object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs font-bold">Klik untuk ganti</p>
                          </div>
                          <div className="absolute top-2 right-2 bg-[#079108] text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <FaCheckCircle /> Uploaded
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 flex flex-col items-center justify-center">
                          <FaCamera className="text-3xl text-gray-300 mb-2" />
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Upload Bukti Transfer</p>
                          <p className="text-[10px] text-gray-300 mt-1">Klik atau drag file gambar</p>
                        </div>
                      )}
                    </div>
                    {merchFile && <p className="text-[10px] text-gray-500 ml-2">“Ž {merchFile.name} ({(merchFile.size / 1024).toFixed(0)} KB)</p>}
                  </div>

                  {/* Total & Submit */}
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                      <span>Total Bayar</span>
                      <span className="text-gray-900 text-lg font-black">IDR {totalMerchHarga.toLocaleString()}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: merchSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: merchSubmitting ? 1 : 0.98 }}
                      disabled={merchSubmitting || merchCart.length === 0}
                      className="w-full bg-gradient-to-r from-[#079108] to-emerald-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all disabled:opacity-70 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                    >
                      {merchSubmitting ? (
                        <><FaSpinner className="animate-spin" />{merchUploading ? 'Mengupload...' : 'Memproses...'}</>
                      ) : 'Confirm Order Merch'}
                    </motion.button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* STEP 5: MERCH SUCCESS */}
        {step === 5 && merchOrderSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-28 h-28 bg-gradient-to-br from-[#079108] to-emerald-400 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#079108]/40"
            >
              <FaCheckCircle className="text-5xl" />
            </motion.div>
            <h2 className="text-4xl font-black uppercase tracking-widest mb-4 bg-gradient-to-r from-gray-900 to-[#079108] bg-clip-text text-transparent">Order Merch Berhasil!</h2>
            <p className="text-gray-500 mb-8 font-medium">Terima kasih sudah memesan! Tim kami akan segera memproses pesananmu.</p>

            {/* Receipt Preview */}
            {merchReceiptData && (
              <div className="mb-8 flex flex-col items-center">
                <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                  <canvas
                    id="merch-receipt-canvas"
                    className="max-w-full h-auto bg-white"
                    style={{ maxWidth: '350px' }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic">Preview nota otomatis di-generate</p>
                <MerchReceiptDrawer merchReceiptData={merchReceiptData} />
              </div>
            )}

            {/* IGS Callout */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8 text-center"
            >
              <p className="text-[11px] text-gray-400 mb-2">
                Bagikan notamu ke IGS dan tag{' '}
                <a href="https://www.instagram.com/refreshbreeze" target="_blank" rel="noopener noreferrer" className="font-black text-pink-400 hover:text-pink-500 transition-colors">@refreshbreeze</a>
                {' '}— bantu Refresh Breeze makin dikenal! 💚
              </p>
            </motion.div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {merchReceiptData && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const canvas = document.getElementById('merch-receipt-canvas')
                    if (canvas) {
                      const link = document.createElement('a')
                      link.download = `Nota_${merchReceiptData.orderNumber}.png`
                      link.href = canvas.toDataURL('image/png')
                      link.click()
                    }
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-[#079108] to-emerald-500 text-white rounded-full font-black uppercase text-xs tracking-widest hover:shadow-xl hover:shadow-[#079108]/30 transition-all flex items-center gap-3"
                >
                  <FaDownload /> Download Nota
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setStep(1); setMerchOrderSuccess(null); setMerchReceiptData(null); setMerchForm({ nama_lengkap: '', whatsapp: '', instagram: '', catatan: '' }) }}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-[#079108] text-white rounded-full font-black uppercase text-xs tracking-widest hover:shadow-xl hover:shadow-[#079108]/30 transition-all"
              >
                Belanja Lagi
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="px-10 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-full font-black uppercase text-xs tracking-widest hover:from-gray-700 hover:to-gray-600 transition-all shadow-xl"
              >
                Return Home
              </motion.button>
            </div>
          </motion.div>
        )}
      </main>

      {/* MERCH DETAIL MODAL */}
      <AnimatePresence>
        {selectedMerch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedMerch(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 20 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-2xl flex flex-col sm:flex-row"
              onClick={e => e.stopPropagation()}
            >
              {/* LEFT — Image */}
              <div className="relative bg-gray-50 sm:w-[45%] flex-shrink-0 aspect-square sm:aspect-auto sm:min-h-[380px]">
                {selectedMerch.gambar_url ? (
                  <img
                    src={selectedMerch.gambar_url}
                    alt={selectedMerch.nama}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaBox className="text-7xl text-emerald-200" />
                  </div>
                )}
                {(!selectedMerch.stok || selectedMerch.stok === 0) && (
                  <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Pre-Order</span>
                )}
              </div>

              {/* RIGHT — Info */}
              <div className="flex-1 flex flex-col p-6 gap-4 relative">
                {/* Close */}
                <button
                  onClick={() => setSelectedMerch(null)}
                  className="absolute top-3 right-3 w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-all"
                >
                  <FaTimes />
                </button>

                {/* Name + desc */}
                <div className="pt-2 pr-8">
                  <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 leading-tight">{selectedMerch.nama}</h3>
                  {selectedMerch.deskripsi && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{selectedMerch.deskripsi}</p>
                  )}
                </div>

                {/* Price + stok warning */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-2xl font-black text-[#079108]">IDR {selectedMerch.harga.toLocaleString()}</span>
                  {selectedMerch.stok > 0 && selectedMerch.stok <= 10 && (
                    <span className="text-xs text-orange-500 font-bold">⚠️ Sisa {selectedMerch.stok}</span>
                  )}
                </div>

                {/* Cart quantity indicator */}
                {(() => {
                  const inCart = merchCart.find(i => i.id === selectedMerch.id)
                  return inCart ? (
                    <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl p-3">
                      <span className="text-xs font-bold text-emerald-700">Di cart: {inCart.quantity}x</span>
                      <div className="flex items-center gap-2 ml-auto">
                        <button onClick={() => updateMerchQuantity(selectedMerch.id, -1)} className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50"><FaMinus className="text-[9px]" /></button>
                        <span className="text-sm font-black w-5 text-center">{inCart.quantity}</span>
                        <button onClick={() => updateMerchQuantity(selectedMerch.id, 1)} className="w-7 h-7 rounded-full bg-[#079108] flex items-center justify-center text-white hover:bg-green-700"><FaPlus className="text-[9px]" /></button>
                      </div>
                    </div>
                  ) : null
                })()}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Buttons */}
                <div className="flex flex-col gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { addToMerchCart(selectedMerch); setSelectedMerch(null) }}
                    className="w-full bg-[#079108] text-white py-3 rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg shadow-[#079108]/20 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaPlus /> Tambah ke Cart
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      addToMerchCart(selectedMerch)
                      setSelectedMerch(null)
                      setStep(4)
                    }}
                    className="w-full border-2 border-[#079108] text-[#079108] py-3 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaShoppingCart /> Langsung Checkout
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LINEUP ERROR MODAL - Centered */}
      {lineupError && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setLineupError(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8 max-w-sm w-[90vw] mx-auto space-y-4"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${lineupError.eventColor}15` }}>
                <span className="text-lg">⚠️</span>
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-wider text-gray-900">Member Tidak Tersedia</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: lineupError.eventColor }}>Special Event</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 leading-relaxed">
              Event <strong className="text-gray-800">{lineupError.eventName}</strong> hanya tersedia untuk lineup tertentu. Hapus item berikut dari keranjang untuk melanjutkan.
            </p>

            {/* Invalid Items List */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <p className="font-black uppercase text-[9px] tracking-[0.2em] text-gray-400">Item yang harus dihapus</p>
              {lineupError.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-gray-50">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: lineupError.eventColor }}></span>
                  <span className="font-bold text-sm text-gray-700">{item.name}</span>
                  <span className="text-gray-400 ml-auto text-xs font-mono">Ã—{item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLineupError(null)}
              className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all"
              style={{ backgroundColor: lineupError.eventColor }}
            >
              Mengerti
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// Helper component to handle canvas drawing
const MerchReceiptDrawer = ({ merchReceiptData }) => {
  useEffect(() => {
    const canvas = document.getElementById('merch-receipt-canvas')
    if (!canvas || !merchReceiptData) return

    const ctx = canvas.getContext('2d')
    const W = 500
    const pad = 30
    const lineH = 22
    const imgSize = 72
    const imgPad = 10
    const rd = merchReceiptData

    // Load logo + all item images in parallel
    const loadImage = (src) => new Promise((resolve) => {
      if (!src) return resolve(null)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = src
    })

    Promise.all([
      loadImage('/images/logos/logo.webp'),
      ...rd.items.map(i => loadImage(i.image))
    ]).then(([logo, ...itemImgs]) => {
      // Calculate height
      const itemBlockH = imgSize + imgPad * 2
      let fixedLines = 0
      fixedLines += 6  // header
      fixedLines += 2  // date row + sep
      fixedLines += 3  // total QTY + sub + TOTAL
      fixedLines += 4  // payment info
      fixedLines += 4  // customer info
      if (rd.catatan) fixedLines += 3
      fixedLines += 4  // ongkir note + footer

      const H = 120 + (pad * 2) + (fixedLines * lineH) + (rd.items.length * itemBlockH) + 80
      canvas.width = W
      canvas.height = H

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, W, H)

      let y = pad + 20

      const drawText = (text, x, size, color = '#000000', align = 'left', weight = 'normal', font = 'Courier New') => {
        ctx.fillStyle = color
        ctx.font = `${weight} ${size}px ${font}`
        ctx.textAlign = align
        ctx.fillText(text, x, y)
      }

      const drawDashedLine = () => {
        ctx.setLineDash([5, 5])
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(pad, y)
        ctx.lineTo(W - pad, y)
        ctx.stroke()
        ctx.setLineDash([])
        y += lineH
      }

      // LOGO & HEADER
      if (logo) {
        const logoW = 80
        const logoH = 80 * (logo.height / logo.width)
        ctx.drawImage(logo, (W - logoW) / 2, y, logoW, logoH)
        y += logoH + 20
      } else {
        y += 100
      }

      drawText('REFRESH BREEZE', W / 2, 24, '#000000', 'center', 'bold')
      y += lineH + 5
      drawText('Official Merch Store', W / 2, 14, '#000000', 'center', 'normal')
      y += lineH + 5

      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.strokeRect((W - 320) / 2, y, 320, 34)
      y += 24
      drawText(rd.orderNumber, W / 2, 16, '#000000', 'center', 'bold')
      y += lineH + 10

      drawDashedLine()

      drawText(rd.createdAt, pad, 12, '#000000', 'left', 'normal')
      drawText('Admin', W - pad, 12, '#000000', 'right', 'normal')
      y += lineH

      drawDashedLine()

      // ITEMS WITH IMAGES
      rd.items.forEach((item, idx) => {
        const itemImg = itemImgs[idx]
        const itemStartY = y
        const blockH = itemBlockH

        // Image box background
        ctx.fillStyle = '#f0fdf4'
        ctx.beginPath()
        ctx.roundRect(pad, itemStartY, imgSize, imgSize, 8)
        ctx.fill()
        ctx.strokeStyle = '#d1fae5'
        ctx.lineWidth = 1
        ctx.stroke()

        if (itemImg) {
          // Draw image fit inside square
          const scale = Math.min(imgSize / itemImg.width, imgSize / itemImg.height)
          const dw = itemImg.width * scale
          const dh = itemImg.height * scale
          const dx = pad + (imgSize - dw) / 2
          const dy = itemStartY + (imgSize - dh) / 2
          ctx.save()
          ctx.beginPath()
          ctx.roundRect(pad, itemStartY, imgSize, imgSize, 8)
          ctx.clip()
          ctx.drawImage(itemImg, dx, dy, dw, dh)
          ctx.restore()
        } else {
          // Placeholder icon
          ctx.fillStyle = '#86efac'
          ctx.font = `bold 28px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText('›', pad + imgSize / 2, itemStartY + imgSize / 2 + 10)
        }

        // Text to the right of image
        const textX = pad + imgSize + 14
        const textMaxW = W - textX - pad

        y = itemStartY + 18
        ctx.fillStyle = '#111111'
        ctx.font = `bold 13px Courier New`
        ctx.textAlign = 'left'
        // Truncate name if too long
        let itemName = item.name
        while (ctx.measureText(itemName).width > textMaxW && itemName.length > 3) {
          itemName = itemName.slice(0, -1)
        }
        if (itemName !== item.name) itemName += '...'
        ctx.fillText(itemName, textX, y)

        y += lineH - 2
        ctx.fillStyle = '#555555'
        ctx.font = `normal 11px Courier New`
        ctx.fillText(`${item.quantity} x Rp ${item.price.toLocaleString('id-ID')}`, textX, y)

        y += lineH - 2
        ctx.fillStyle = '#000000'
        ctx.font = `bold 13px Courier New`
        ctx.textAlign = 'right'
        ctx.fillText(`Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`, W - pad, y)

        // Ensure y advances past full image block
        y = itemStartY + blockH

        // Light divider between items
        if (idx < rd.items.length - 1) {
          ctx.setLineDash([3, 3])
          ctx.strokeStyle = '#e5e7eb'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(pad + imgSize + 14, y - 4)
          ctx.lineTo(W - pad, y - 4)
          ctx.stroke()
          ctx.setLineDash([])
        }
      })

      drawDashedLine()

      // TOTAL
      drawText('Total QTY:', pad, 12, '#000000', 'left', 'normal')
      drawText(rd.items.reduce((acc, i) => acc + i.quantity, 0).toString(), W - pad, 12, '#000000', 'right', 'normal')
      y += lineH
      drawText('Sub Total', pad, 12, '#000000', 'left', 'normal')
      drawText(`Rp ${rd.total.toLocaleString('id-ID')}`, W - pad, 12, '#000000', 'right', 'normal')
      y += lineH + 5
      drawText('TOTAL', pad, 20, '#000000', 'left', 'bold')
      drawText(`Rp ${rd.total.toLocaleString('id-ID')}`, W - pad, 20, '#000000', 'right', 'bold')
      y += lineH + 10

      // PAYMENT INFO
      drawText('Metode Bayar', pad, 12, '#000000', 'left', 'normal')
      drawText('Transfer', W - pad, 12, '#000000', 'right', 'normal')
      y += lineH
      drawText('Bank', pad, 12, '#000000', 'left', 'normal')
      drawText('BCA', W - pad, 12, '#000000', 'right', 'normal')
      y += lineH
      drawText('No. Rek', pad, 12, '#000000', 'left', 'normal')
      drawText('0902683273', W - pad, 12, '#000000', 'right', 'normal')
      y += lineH
      drawText('A/n', pad, 12, '#000000', 'left', 'normal')
      drawText('NATASYA ANGELINA PUTRI', W - pad, 12, '#000000', 'right', 'normal')
      y += lineH

      drawDashedLine()

      // CUSTOMER INFO
      drawText('Nama    :', pad, 12, '#000000', 'left', 'normal')
      drawText(rd.nama || '-', pad + 90, 12, '#000000', 'left', 'bold')
      y += lineH
      drawText('WhatsApp:', pad, 12, '#000000', 'left', 'normal')
      drawText(rd.whatsapp || '-', pad + 90, 12, '#000000', 'left', 'normal')
      y += lineH
      drawText('Instagram:', pad, 12, '#000000', 'left', 'normal')
      drawText(rd.instagram || '-', pad + 90, 12, '#000000', 'left', 'normal')
      y += lineH

      if (rd.catatan) {
        drawText('Catatan  :', pad, 12, '#000000', 'left', 'normal')
        y += lineH
        const words = rd.catatan.split(' ')
        let line = ''
        words.forEach(word => {
          if (ctx.measureText(line + word).width > W - (pad * 2)) {
            drawText(line, pad, 12, '#000000', 'left', 'italic')
            line = word + ' '
            y += lineH
          } else {
            line += word + ' '
          }
        })
        drawText(line, pad, 12, '#000000', 'left', 'italic')
        y += lineH
      }

      // ONGKIR NOTE
      drawDashedLine()
      drawText('⚠️ Ongkos kirim ditanggung pembeli.', W / 2, 11, '#b45309', 'center', 'bold')
      y += lineH
      drawText('Admin konfirmasi ongkir via WA/IG.', W / 2, 11, '#b45309', 'center', 'normal')
      y += lineH

      drawDashedLine()

      // FOOTER
      y += 10
      drawText('Terima kasih telah berbelanja', W / 2, 14, '#000000', 'center', 'normal')
      y += lineH
      drawText('IG: @refreshbreeze', W / 2, 14, '#000000', 'center', 'bold')
      y += lineH
    })
  }, [merchReceiptData])

  return null
}

const ReceiptDrawer = ({ receiptData }) => {
  useEffect(() => {
    const canvas = document.getElementById('receipt-canvas')
    if (!canvas || !receiptData) return

    const ctx = canvas.getContext('2d')
    const W = 500
    const pad = 30
    const lineH = 22
    const rd = receiptData
    
    // Load logo first
    const logo = new Image()
    logo.src = '/images/logos/logo.webp'
    
    // Draw logic function
    const draw = () => {
        // Pre-calculate height
        let totalLines = 0
        totalLines += 8 // header info
        totalLines += 1 // separator
        totalLines += rd.items.length // items
        totalLines += 2 // separator + total
        totalLines += 6 // payment info (Method + Bank + Rek + An)
        if (rd.catatan) totalLines += 2
        totalLines += 2 // footer padding
        totalLines += 3 // thank you + IG

        const H = 100 + (pad * 2) + (totalLines * lineH) + 100 
        canvas.width = W
        canvas.height = H

        // Background
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, W, H)

        let y = pad + 20

        // Helper functions
        const drawText = (text, x, size, color = '#000000', align = 'left', weight = 'normal', font = 'Courier New') => {
          ctx.fillStyle = color
          ctx.font = `${weight} ${size}px ${font}`
          ctx.textAlign = align
          ctx.fillText(text, x, y)
        }

        const drawDashedLine = () => {
          ctx.setLineDash([5, 5])
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(pad, y)
          ctx.lineTo(W - pad, y)
          ctx.stroke()
          ctx.setLineDash([])
          y += lineH
        }

        // ====== LOGO & HEADER ======
        const logoW = 80
        const logoH = 80 * (logo.height / logo.width)
        ctx.drawImage(logo, (W - logoW) / 2, y, logoW, logoH)
        y += logoH + 20

        drawText('REFRESH BREEZE', W / 2, 24, '#000000', 'center', 'bold')
        y += lineH + 5
        drawText('Official Store', W / 2, 14, '#000000', 'center', 'normal')
        y += lineH + 5
        
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        const boxW = 280
        const boxH = 34
        ctx.strokeRect((W - boxW) / 2, y, boxW, boxH)
        y += 24
        drawText(rd.orderNumber, W / 2, 16, '#000000', 'center', 'bold')
        y += lineH + 10

        drawDashedLine()
        
        // ====== INFO ======
        drawText(rd.createdAt, pad, 12, '#000000', 'left', 'normal')
        drawText('Admin', W - pad, 12, '#000000', 'right', 'normal')
        y += lineH
        drawText(`Event: ${rd.eventName}`, pad, 12, '#000000', 'left', 'normal')
        y += lineH

        drawDashedLine()

        // ====== ITEMS ======
        rd.items.forEach(item => {
          drawText(item.name, pad, 12, '#000000', 'left', 'bold')
          y += lineH - 4
          drawText(`${item.quantity} x ${item.price.toLocaleString('id-ID')}`, pad + 20, 12, '#000000', 'left', 'normal')
          drawText(`Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`, W - pad, 12, '#000000', 'right', 'normal')
          y += lineH + 4
        })

        drawDashedLine()

        // ====== TOTAL ======
        drawText('Total QTY:', pad, 12, '#000000', 'left', 'normal')
        drawText(rd.items.reduce((acc, i) => acc + i.quantity, 0).toString(), W - pad, 12, '#000000', 'right', 'normal')
        y += lineH
        
        drawText('Sub Total', pad, 12, '#000000', 'left', 'normal')
        drawText(`Rp ${rd.total.toLocaleString('id-ID')}`, W - pad, 12, '#000000', 'right', 'normal')
        y += lineH + 5
        
        drawText('TOTAL', pad, 20, '#000000', 'left', 'bold')
        drawText(`Rp ${rd.total.toLocaleString('id-ID')}`, W - pad, 20, '#000000', 'right', 'bold')
        y += lineH + 10
        
        drawText('Metode Bayar', pad, 12, '#000000', 'left', 'normal')
        drawText('Transfer', W - pad, 12, '#000000', 'right', 'normal')
        y += lineH

        // Transfer Details
        drawText('Bank', pad, 12, '#000000', 'left', 'normal')
        drawText('BCA', W - pad, 12, '#000000', 'right', 'normal')
        y += lineH
        drawText('No. Rek', pad, 12, '#000000', 'left', 'normal')
        drawText('0902683273', W - pad, 12, '#000000', 'right', 'normal')
        y += lineH
        drawText('A/n', pad, 12, '#000000', 'left', 'normal')
        drawText('NATASYA ANGELINA PUTRI', W - pad, 12, '#000000', 'right', 'normal')
        y += lineH

        drawDashedLine()

        // ====== CUSTOMER ======
        drawText('Nama  :', pad, 12, '#000000', 'left', 'normal')
        drawText(rd.nama || '-', pad + 80, 12, '#000000', 'left', 'bold')
        y += lineH
        drawText('Kontak:', pad, 12, '#000000', 'left', 'normal')
        drawText(rd.kontak || '-', pad + 80, 12, '#000000', 'left', 'normal')
        y += lineH
        
        if (rd.catatan) {
           drawText('Catatan:', pad, 12, '#000000', 'left', 'normal')
           y += lineH
           const words = rd.catatan.split(' ')
           let line = ''
           words.forEach(word => {
             if (ctx.measureText(line + word).width > W - (pad * 2)) {
               drawText(line, pad, 12, '#000000', 'left', 'italic')
               line = word + ' '
               y += lineH
             } else {
               line += word + ' '
             }
           })
           drawText(line, pad, 12, '#000000', 'left', 'italic')
           y += lineH
        }
        
        drawDashedLine()
        
        // ====== FOOTER ======
        y += 10
        drawText('Terima kasih telah berbelanja', W / 2, 14, '#000000', 'center', 'normal')
        y += lineH
        drawText('IG: @refreshbreeze', W / 2, 14, '#000000', 'center', 'bold')
        y += lineH
    }

    logo.onload = draw
    // Fallback if logo fails or is cached? Just draw anyway
    if (logo.complete) draw()

  }, [receiptData])

  return null
}

export default ShopPage
