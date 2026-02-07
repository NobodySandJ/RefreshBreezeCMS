import { Link } from 'react-router-dom'
import Tilt from 'react-parallax-tilt'
import { FaInstagram, FaTwitter, FaYoutube, FaMapMarkerAlt, FaEnvelope, FaTiktok } from 'react-icons/fa'

const Footer = () => {
  return (
    <footer className="bg-gray-50 text-gray-900 py-12 sm:py-16 px-4 border-t border-gray-200 font-sans">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 lg:gap-20">
          
          {/* COL 1: IDENTITY */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black tracking-widest uppercase text-dark">
              REFRESH BREEZE
            </h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-md">
              Membawa gelombang energi baru melalui penampilan idola gaya Jepang yang unik di Tulungagung.
            </p>
            <p className="text-[#079108] font-bold text-xs tracking-widest">
              リフレッシュ・ブリーズ
            </p>
          </div>

          {/* COL 2: QUICK LINKS */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-dark">Quick Links</h4>
            <ul className="space-y-4">
              {[
                { name: 'About Us', href: '/#about' },
                { name: 'Members', href: '/members' },
                { name: 'Discography', href: '/music' },
                { name: 'Schedule', href: '/schedule' },
                { name: 'Shop', href: '/shop' }
              ].map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="text-gray-500 hover:text-[#079108] text-sm font-medium transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COL 3: GET IN TOUCH */}
          <div className="space-y-6">
             <h4 className="text-lg font-bold text-dark">Get in Touch</h4>
             <div className="space-y-4">
                <div className="flex items-start gap-4 text-gray-500 text-sm">
                   <div className="mt-1 min-w-[1rem]"><FaMapMarkerAlt /></div>
                   <span>Tulungagung, Jawa Timur, Indonesia</span>
                </div>
                <div className="flex items-center gap-4 text-gray-500 text-sm">
                   <div className="min-w-[1rem]"><FaEnvelope /></div>
                   <a href="mailto:official.refreshbreeze@gmail.com" className="hover:text-[#079108] transition-colors">official.refreshbreeze@gmail.com</a>
                </div>
             </div>

             <div className="flex gap-4 pt-2">
                {[
                  { icon: <FaInstagram />, href: 'https://instagram.com/refbreeze' },
                  { icon: <FaTwitter />, href: 'https://twitter.com/ref_breeze' },
                  { icon: <FaYoutube />, href: 'https://youtube.com/@RefreshBreeze' },
                  { icon: <FaTiktok />, href: 'https://tiktok.com/@refbreeze' },
                ].map((social, idx) => (
                  <a 
                    key={idx}
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-[#079108] hover:border-[#079108] hover:text-white transition-all duration-300"
                  >
                    {social.icon}
                  </a>
                ))}
             </div>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-400 font-medium">
          <p>© 2026 REFRESH BREEZE. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-8">
             <Link to="/admin/login" className="hover:text-[#079108] transition-colors">Staff Login</Link>
             <a href="#" className="hover:text-[#079108] transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
