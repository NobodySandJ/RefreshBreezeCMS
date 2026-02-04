import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import api from '../lib/api'

const AdminLogin = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/auth/login', formData)
      
      if (response.data.success) {
        localStorage.setItem('admin_token', response.data.token)
        localStorage.setItem('admin_user', JSON.stringify(response.data.user))
        
        Swal.fire({
          icon: 'success',
          title: 'Login Berhasil!',
          text: `Selamat datang, ${response.data.user.full_name || response.data.user.username}`,
          confirmButtonColor: '#079108',
          timer: 2000
        }).then(() => {
          navigate('/admin')
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal',
        text: error.response?.data?.error || 'Username atau password salah',
        confirmButtonColor: '#079108'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-custom-mint to-custom-green flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-custom-mint rounded-full flex items-center justify-center">
            <i className="fas fa-user-shield text-4xl text-custom-green"></i>
          </div>
          <h1 className="text-3xl font-extrabold text-custom-green">Login Staff</h1>
          <p className="text-gray-500 mt-2">Refresh Breeze CMS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-green focus:border-custom-green transition-all"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-green focus:border-custom-green transition-all"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-custom-green transition-colors"
                tabIndex="-1"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-custom-green text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-lg flex justify-center items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner animate-spin"></i>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-400">
            Username: <span className="font-mono">admin@breeze:superadmin</span>
          </p>
          <p className="text-xs text-center text-gray-400 mt-1">
            Password: <span className="font-mono">hijausegar</span>
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-custom-green hover:text-green-700 font-semibold text-sm"
          >
            ← Kembali ke Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
