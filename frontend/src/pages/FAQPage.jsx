import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaMinus, FaQuestionCircle, FaChevronLeft } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import api from '../lib/api'

const FAQPage = () => {
  const navigate = useNavigate()
  const [faqs, setFaqs] = useState([])
  const [openFaq, setOpenFaq] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await api.get('/faqs')
        if (response.data.success) {
          setFaqs(response.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch FAQs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFaqs()
  }, [])

  return (
    <div className="min-h-screen bg-white text-dark overflow-x-hidden">
      <Header />
      
      <main className="pt-32 pb-40 container mx-auto max-w-4xl px-4">
        {/* Breadcrumb / Back */}
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[#079108] transition-colors mb-16 group"
        >
          <FaChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Previous
        </motion.button>

        <div className="text-center mb-24 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl md:text-9xl font-black text-gray-50 select-none -z-10 tracking-[0.2em] opacity-40 uppercase">
            FAQ
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black tracking-tight mb-6 uppercase"
          >
            HELP CENTER
          </motion.h1>
          <div className="w-32 h-1.5 bg-[#079108] mx-auto mb-8 shadow-[0_0_15px_rgba(7,145,8,0.3)]"></div>
          <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px]">
             Pertanyaan yang Sering Diajukan • Refresh Breeze
          </p>
        </div>

        <div className="space-y-6">
          {loading ? (
             [1, 2, 3, 4, 5].map(i => (
               <div key={i} className="h-24 w-full bg-gray-50 animate-pulse rounded-[2.5rem]"></div>
             ))
          ) : (
            faqs.map((faq, idx) => (
              <motion.div 
                key={faq.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`border-2 rounded-[2.5rem] overflow-hidden transition-all duration-500 ${openFaq === idx ? 'border-[#079108]/20 bg-[#079108]/[0.02] shadow-xl shadow-[#079108]/5' : 'border-gray-50 bg-white'}`}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-10 text-left flex items-center justify-between gap-8 group"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${openFaq === idx ? 'bg-[#079108] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-[#079108]/10 group-hover:text-[#079108]'}`}>
                      <FaQuestionCircle className="text-xl" />
                    </div>
                    <span className="text-lg md:text-xl font-black text-gray-800 leading-tight tracking-tight uppercase">{faq.tanya}</span>
                  </div>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${openFaq === idx ? 'bg-dark text-white rotate-180' : 'bg-gray-50 text-gray-300'}`}>
                    {openFaq === idx ? <FaMinus /> : <FaPlus />}
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-10 pb-10 pt-2 text-gray-500 font-medium leading-relaxed md:text-lg pl-28">
                        <div className="w-10 h-px bg-gray-200 mb-6"></div>
                        {faq.jawab}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>

        <div className="mt-32 p-12 bg-dark rounded-[3.5rem] text-center space-y-8 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-40 h-40 bg-[#079108]/20 rounded-full blur-3xl -ml-20 -mt-20"></div>
           <h3 className="text-2xl font-black text-white tracking-widest uppercase">Masih Bingung?</h3>
           <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]">Hubungi tim kami melalui Instagram atau Email resmi.</p>
           <div className="flex justify-center gap-6">
              <a href="https://instagram.com/refresh.breeze" target="_blank" className="px-12 py-5 bg-[#079108] text-white rounded-full font-black tracking-widest text-[10px] uppercase hover:scale-105 transition-all shadow-xl">Contact Instagram</a>
           </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default FAQPage
