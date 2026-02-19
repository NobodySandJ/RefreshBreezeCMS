import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlay, FaImage, FaYoutube, FaInstagram, FaTwitter, FaTiktok, FaExpand } from 'react-icons/fa'
import Header from '../components/Header'
import { getAssetPath } from '../lib/pathUtils'

const SafeYouTubeThumbnail = ({ youtubeId, title }) => {
  const [thumbUrl, setThumbUrl] = useState(`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`);

  useEffect(() => {
    const img = new Image();
    const maxResUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    
    img.onload = () => {
      // YouTube returns a 120x90 image if maxresdefault doesn't exist
      if (img.width > 120) {
        setThumbUrl(maxResUrl);
      }
    };
    img.src = maxResUrl;
  }, [youtubeId]);

  return (
    <img 
      src={thumbUrl}
      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
      alt={title}
    />
  );
};

const MediaPage = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const PHOTOS = [
    { id: 1, src: '/images/members/gallery/group/group (1).webp', title: 'Breeze Bonding', category: 'onstage', aspect: 'portrait' },
    { id: 2, src: '/images/members/gallery/group/group (2).webp', title: 'Together as One', category: 'onstage', aspect: 'landscape' },
    { id: 3, src: '/images/members/gallery/group/group (3).webp', title: 'Shared Smiles', category: 'onstage', aspect: 'landscape' },
    { id: 4, src: '/images/members/gallery/group/group (4).webp', title: 'Our Connection', category: 'onstage', aspect: 'portrait' },
    { id: 5, src: '/images/members/gallery/group/group (5).webp', title: 'Stronger Together', category: 'onstage', aspect: 'landscape' },
    { id: 6, src: '/images/members/gallery/group/lucu (1).webp', title: 'Fun Times 1', category: 'onstage', aspect: 'portrait' },
    { id: 7, src: '/images/members/gallery/group/lucu (2).webp', title: 'Fun Times 2', category: 'onstage', aspect: 'landscape' },
    { id: 8, src: '/images/members/gallery/group/lucu (3).webp', title: 'Fun Times 3', category: 'onstage', aspect: 'portrait' },
    { id: 9, src: '/images/members/gallery/group/lucu (4).webp', title: 'Fun Times 4', category: 'onstage', aspect: 'landscape' },
    { id: 10, src: '/images/members/gallery/group/lucu (5).webp', title: 'Fun Times 5', category: 'onstage', aspect: 'portrait' },
    { id: 11, src: '/images/members/gallery/group/lucu (6).webp', title: 'Fun Times 6', category: 'onstage', aspect: 'landscape' },
    { id: 12, src: '/images/members/gallery/group/lucu (7).webp', title: 'Fun Times 7', category: 'onstage', aspect: 'portrait' },
    { id: 13, src: '/images/members/gallery/group/lucu (8).webp', title: 'Fun Times 8', category: 'onstage', aspect: 'landscape' },
    { id: 14, src: '/images/members/gallery/group/lucu (9).webp', title: 'Fun Times 9', category: 'onstage', aspect: 'portrait' },
  ]

  const VIDEOS = [
    { id: 1, title: 'Refresh Breeze Live Performance 1', youtubeId: 'jfKfPfyJRdk' },
    { id: 2, title: 'Refresh Breeze Live Performance 2', youtubeId: 'jfKfPfyJRdk' },
    { id: 3, title: 'Refresh Breeze Official Content', youtubeId: 'jfKfPfyJRdk' },
  ]

  return (
    <div className="min-h-screen bg-white text-dark overflow-x-hidden relative">
      <div className="noise-bg opacity-10"></div>
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 container mx-auto max-w-7xl px-4 relative z-10">
        <div className="flex flex-col items-center text-center space-y-6">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="w-16 h-16 bg-[#079108]/10 rounded-2xl flex items-center justify-center text-[#079108] text-2xl shadow-lg"
           >
             <FaImage />
           </motion.div>
           <div className="space-y-2">
              <span className="text-[#079108] font-black tracking-[0.5em] text-[10px] uppercase">GROUP MOMENTS</span>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-dark uppercase leading-none">
                OUR <span className="text-[#079108]">TOGETHERNESS</span>
              </h1>
           </div>
           <p className="text-gray-400 font-medium max-w-lg tracking-widest text-[10px] uppercase">
              Momen kebersamaan dan keceriaan kami di balik layar maupun di atas panggung
           </p>
        </div>
      </section>

      {/* Photo Grid (Masonry Style using columns) */}
      <section className="container mx-auto max-w-7xl px-4 pb-24">
         <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 sm:gap-8 space-y-6 sm:space-y-8">
            {PHOTOS.map((photo, idx) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onClick={() => setSelectedImage(photo)}
                className="group relative break-inside-avoid rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-gray-50 cursor-pointer"
              >
                 <img 
                    src={getAssetPath(photo.src)} 
                    alt={photo.title}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                       <h3 className="text-white font-black text-lg uppercase tracking-tight">{photo.title}</h3>
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-dark text-lg hover:scale-110 transition-transform">
                          <FaExpand />
                       </div>
                    </div>
                 </div>
              </motion.div>
            ))}
         </div>
      </section>

      {/* Video Section */}
      <section className="py-24 bg-dark relative overflow-hidden rounded-[4rem] sm:rounded-[6rem] mx-4 mb-24">
         <div className="absolute top-0 right-0 w-96 h-96 bg-[#079108] blur-[150px] opacity-20"></div>
         <div className="container mx-auto max-w-7xl px-4 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
               <div className="space-y-2 text-center md:text-left">
                  <span className="text-[#079108] font-black tracking-[0.5em] text-[10px] uppercase">YOUTUBE CONTENT</span>
                  <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight italic leading-none">
                     PERFORMANCE <span className="text-[#079108]">VIDEOS</span>
                  </h2>
               </div>
               <motion.a 
                 href="https://youtube.com/@RefreshBreeze" 
                 target="_blank"
                 whileHover={{ scale: 1.05 }}
                 className="flex items-center gap-4 px-10 py-4 bg-red-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20"
               >
                  <FaYoutube className="text-xl" /> Official Channel
               </motion.a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
               {VIDEOS.map((video) => (
                  <motion.div 
                    key={video.id}
                    whileHover={{ y: -10 }}
                    onClick={() => window.open(`https://youtube.com/watch?v=${video.youtubeId}`, '_blank')}
                    className="group relative aspect-video rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border-2 border-white/10 bg-white/5 cursor-pointer shadow-2xl"
                  >
                     <SafeYouTubeThumbnail youtubeId={video.youtubeId} title={video.title} />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-[#079108] text-white rounded-full flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(7,145,8,0.5)] group-hover:scale-110 transition-transform">
                           <FaPlay className="ml-1" />
                        </div>
                     </div>
                     <div className="absolute inset-x-0 bottom-0 p-5 pt-12 bg-gradient-to-t from-dark to-transparent">
                        <h4 className="text-white font-black text-sm uppercase tracking-tighter italic line-clamp-2">{video.title}</h4>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* Social Call to Action */}
      <section className="pb-32 container mx-auto max-w-4xl px-4 text-center">
         <div className="space-y-12">
            <h3 className="text-[10px] font-black tracking-[0.5em] text-gray-300 uppercase">Check Our Latest Stories</h3>
            <div className="flex justify-center gap-6">
              {[
                { icon: <FaInstagram />, href: 'https://instagram.com/refbreeze' },
                { icon: <FaTwitter />, href: 'https://twitter.com/ref_breeze' },
                { icon: <FaYoutube />, href: 'https://youtube.com/@RefreshBreeze' },
                { icon: <FaTiktok />, href: 'https://tiktok.com/@refbreeze' },
              ].map((social, idx) => (
                <motion.a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -5, rotate: 5 }}
                  className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-xl text-gray-400 hover:text-white hover:bg-dark hover:border-dark transition-all shadow-sm hover:shadow-2xl"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
         </div>
      </section>

      {/* Lightbox / Image Preview */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button
              className="absolute top-8 right-8 text-white text-4xl font-light hover:rotate-90 transition-transform"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </motion.button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative group w-full h-full flex items-center justify-center">
                 <img 
                    src={getAssetPath(selectedImage.src)} 
                    alt={selectedImage.title}
                    className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border-4 border-white/10"
                 />
              </div>
              <div className="text-center space-y-2">
                 <p className="text-[#079108] font-black tracking-[0.4em] text-[10px] uppercase">PROJECT REBREEZE</p>
                 <h3 className="text-white text-3xl md:text-5xl font-black uppercase tracking-tighter italic">{selectedImage.title}</h3>
                 <button 
                   onClick={() => setSelectedImage(null)}
                   className="mt-4 px-8 py-2 bg-white/10 hover:bg-white/20 text-white/50 hover:text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                 >
                   Close Preview
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MediaPage
