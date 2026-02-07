import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import AOS from 'aos'
import { ToastContainer, Zoom } from 'react-toastify'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy Load Pages
const HomePage = lazy(() => import('./pages/HomePage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const MembersPage = lazy(() => import('./pages/MembersPage'))
const MusicPage = lazy(() => import('./pages/MusicPage'))
const MediaPage = lazy(() => import('./pages/MediaPage'))
const SchedulePage = lazy(() => import('./pages/SchedulePage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const StoryPage = lazy(() => import('./pages/StoryPage'))

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      easing: 'ease-out-cubic',
      offset: 100,
    })
  }, [])

  return (
    <Router basename="/RefreshBreezeCMS">
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Zoom}
        style={{ zIndex: 99999 }}
      />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
