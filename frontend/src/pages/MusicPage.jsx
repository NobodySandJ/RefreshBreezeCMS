import { motion } from 'framer-motion'
import { FaMusic, FaSpotify, FaApple, FaYoutube, FaInstagram, FaTwitter } from 'react-icons/fa'
import Header from '../components/Header'
import Footer from '../components/Footer'

const MusicPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      
      <main className="container mx-auto max-w-7xl px-4 py-32 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          {/* Animated Icon */}
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 bg-[#079108]/10 rounded-full flex items-center justify-center mx-auto text-[#079108] mb-8 shadow-[0_0_30px_rgba(7,145,8,0.2)]"
          >
            <FaMusic className="text-4xl" />
          </motion.div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-widest text-dark uppercase">
              DISKOGRAFI
            </h1>
            <div className="w-32 h-1.5 bg-[#079108] mx-auto rounded-full shadow-[0_0_15px_rgba(7,145,8,0.4)]"></div>
          </div>

          <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">COMING SOON</h2>
            <p className="text-gray-500 text-lg leading-relaxed font-light">
              Sesuatu yang spesial sedang disiapkan. Nantikan kejutan besar dari kami segera.
            </p>
          </div>

          {/* Social Links to stay updated */}
          <div className="pt-12 space-y-8">
            <h3 className="text-xs font-black tracking-[0.4em] text-gray-400 uppercase">Stay Updated</h3>
            <div className="flex justify-center gap-8">
              {[
                { icon: <FaInstagram />, href: '#', label: 'Instagram' },
                { icon: <FaTwitter />, href: '#', label: 'Twitter' },
                { icon: <FaYoutube />, href: '#', label: 'YouTube' },
                { icon: <FaSpotify />, href: '#', label: 'Spotify' },
              ].map((social, idx) => (
                <motion.a
                  key={idx}
                  href={social.href}
                  whileHover={{ y: -5, scale: 1.1 }}
                  className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-xl text-gray-400 hover:text-[#079108] hover:bg-[#079108]/5 transition-all shadow-sm hover:shadow-lg"
                  aria-label={social.label}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="fixed top-1/2 left-0 w-64 h-64 bg-[#079108] rounded-full blur-[120px] opacity-5 -translate-x-1/2 pointer-events-none"></div>
        <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#079108] rounded-full blur-[150px] opacity-5 translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
      </main>

      <Footer />
    </div>
  )
}

export default MusicPage
