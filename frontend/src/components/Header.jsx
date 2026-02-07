import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaBars, FaTimes, FaShoppingCart, FaHome, FaUsers, FaMusic, FaCalendarAlt, FaCamera, FaStore, FaInfoCircle, FaInstagram, FaTwitter, FaYoutube, FaTiktok } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

const Header = ({ cartCount = 0, onCartClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { name: 'HOME', href: '/', icon: FaHome },
    { name: 'ABOUT US', href: '/#about', icon: FaInfoCircle },
    { name: 'MEMBERS', href: '/members', icon: FaUsers },
    { name: 'MUSIC', href: '/music', icon: FaMusic },
    { name: 'SCHEDULE', href: '/schedule', icon: FaCalendarAlt },
    { name: 'MEDIA', href: '/media', icon: FaCamera },
    { name: 'SHOP', href: '/shop', icon: FaStore },
  ]

  const socialLinks = [
    { icon: FaInstagram, href: 'https://instagram.com/refbreeze', label: '@refbreeze' },
    { icon: FaTwitter, href: 'https://twitter.com/ref_breeze' },
    { icon: FaYoutube, href: 'https://youtube.com/@RefreshBreeze' },
    { icon: FaTiktok, href: 'https://tiktok.com/@refbreeze' },
  ]

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href.split('#')[0])
  }

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b-2 border-[#079108]/20">
        <nav className="container mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 group"
          >
            <div data-aos="zoom-in-right" data-aos-duration="1000">
              <img src="/images/logos/logo.webp" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm" />
            </div>
            <span className="text-sm sm:text-xl font-black text-gray-900 tracking-widest group-hover:text-[#079108] transition-colors line-clamp-1">
              REFRESH BREEZE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`text-xs font-bold tracking-[0.2em] transition-colors relative group ${
                  isActive(link.href) ? 'text-[#079108]' : 'text-gray-500 hover:text-[#079108]'
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#079108] transition-all ${
                  isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Cart Icon */}
            <button
              onClick={onCartClick}
              className="relative p-2 text-gray-700 hover:text-[#079108] transition-colors group"
            >
              <div className="relative">
                <FaShoppingCart className="text-xl sm:text-2xl" />
                <span className="absolute -top-2 -right-2 bg-[#079108] text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-black shadow-lg">
                  {cartCount}
                </span>
              </div>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-gray-900 text-xl sm:text-2xl p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <FaBars />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Sheet Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] lg:hidden"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] z-[101] lg:hidden shadow-2xl"
              style={{ 
                paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
                maxHeight: '85vh'
              }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <img src="/images/logos/logo.webp" alt="Logo" className="w-8 h-8 object-contain" />
                  <span className="font-black text-sm tracking-widest text-gray-900">MENU</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="px-4 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
                {navLinks.map((link, idx) => {
                  const Icon = link.icon
                  const active = isActive(link.href)
                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                          active 
                            ? 'bg-[#079108] text-white shadow-lg shadow-[#079108]/30' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          active ? 'bg-white/20' : 'bg-gray-100'
                        }`}>
                          <Icon className={`text-lg ${active ? 'text-white' : 'text-[#079108]'}`} />
                        </div>
                        <span className="font-bold tracking-wider text-sm">{link.name}</span>
                        {active && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-white" />
                        )}
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {/* Social Links */}
              <div className="px-6 py-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Follow Us</p>
                <div className="flex items-center gap-3">
                  {socialLinks.map((social, idx) => {
                    const Icon = social.icon
                    return (
                      <motion.a
                        key={idx}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-[#079108] hover:text-white transition-all"
                      >
                        <Icon className="text-sm" />
                      </motion.a>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header

