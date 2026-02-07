import { motion } from 'framer-motion'
import { useState } from 'react'
import { FaPlay, FaImage, FaExternalLinkAlt } from 'react-icons/fa'
import Header from '../components/Header'
import Footer from '../components/Footer'

const MediaPage = () => {
  const [activeTab, setActiveTab] = useState('all')

  const mediaItems = [
    { 
      type: 'video', 
      title: 'JEWEL KISS - 恋華 (Lovers Flower)', 
      thumbnail: 'https://img.youtube.com/vi/77iP-nJ4b8Q/maxresdefault.jpg', 
      category: 'Live Performance',
      url: 'https://youtu.be/77iP-nJ4b8Q?si=CfZ3haCys12C7ONg'
    },
    { 
      type: 'video', 
      title: 'FRUiTY - LOVE SONG FOR YOU', 
      thumbnail: 'https://img.youtube.com/vi/Twin7LVhnHI/maxresdefault.jpg', 
      category: 'Live Performance',
      url: 'https://youtu.be/Twin7LVhnHI?si=r-REpbjFgJkvrv7r'
    },
    { 
      type: 'video', 
      title: 'MARY ANGEL - LIKE A ANGEL', 
      thumbnail: 'https://img.youtube.com/vi/dKcq3tR69sM/maxresdefault.jpg', 
      category: 'Live Performance',
      url: 'https://youtu.be/dKcq3tR69sM?si=DnheTptSVN-FK-cl'
    },
    { 
      type: 'photo', 
      title: 'TIERRA HALLOWEEN FEST (1)', 
      thumbnail: '/foto/dokumentasi/1.webp', 
      category: 'Photography',
      credit: '@yoga_arfi' 
    },
    { 
      type: 'photo', 
      title: 'TIERRA HALLOWEEN FEST (2)', 
      thumbnail: '/foto/dokumentasi/2.webp', 
      category: 'Photography',
      credit: '@ikifer' 
    },
    { 
      type: 'photo', 
      title: 'TIERRA HALLOWEEN FEST (3)', 
      thumbnail: '/foto/dokumentasi/3.webp', 
      category: 'Photography',
      credit: '@wannphotography' 
    }
  ]

  const filteredMedia = activeTab === 'all' ? mediaItems : mediaItems.filter(item => {
    if (activeTab === 'video') return item.type === 'video'
    if (activeTab === 'photo') return item.type === 'photo'
    return true
  })

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Header />
      
      <main className="container mx-auto max-w-7xl px-4 py-32">
        <div className="text-center mb-32 relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl md:text-9xl font-black text-gray-50 select-none -z-10 tracking-[0.2em] opacity-40 uppercase">
             MEDIA
           </div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black tracking-widest mb-6"
          >
            GALLERY
          </motion.h1>
          <div className="w-32 h-1.5 bg-[#079108] mx-auto mb-8 shadow-[0_0_15px_rgba(7,145,8,0.3)]"></div>
          
          <div className="flex justify-center gap-12 mb-16">
            {[
              { id: 'all', label: 'All' },
              { id: 'video', label: 'Videos' },
              { id: 'photo', label: 'Photos' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs font-black tracking-[0.4em] uppercase transition-all relative pb-4 ${activeTab === tab.id ? 'text-[#079108]' : 'text-gray-300 hover:text-gray-500'}`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="mediaTab" className="absolute bottom-0 left-0 w-full h-1 bg-[#079108] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredMedia.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.8 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className="aspect-video relative rounded-[2rem] overflow-hidden bg-gray-100 border-4 border-white shadow-xl group-hover:shadow-2xl group-hover:shadow-[#079108]/20 transition-all duration-700">
                <img 
                  src={item.thumbnail} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 grayscale group-hover:grayscale-0"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&q=80' }}
                />
                
                {/* Overlay Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-dark/20 backdrop-blur-[2px]">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#079108] shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-500">
                     {item.type === 'video' ? <FaPlay className="ml-1" /> : <FaImage />}
                   </div>
                </div>

                {/* Badge */}
                <div className="absolute top-6 left-6">
                   <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-black tracking-widest text-[#079108] uppercase">
                     {item.type}
                   </span>
                </div>
              </div>
              
              <div className="mt-8 px-2">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] text-[#079108] font-black tracking-[0.3em] uppercase opacity-60 decoration-[#079108] decoration-2 underline underline-offset-4">{item.category}</span>
                    <h3 className="text-xl font-black mt-3 text-dark leading-tight group-hover:text-[#079108] transition-colors">{item.title}</h3>
                    {item.credit && <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Credit: {item.credit}</p>}
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:bg-[#079108] hover:text-white transition-all">
                      <FaExternalLinkAlt className="text-sm" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default MediaPage
