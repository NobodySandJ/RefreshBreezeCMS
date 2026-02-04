import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import api from '../lib/api'
import { 
  FaSignOutAlt, 
  FaShoppingCart, 
  FaFilter, 
  FaFileExcel, 
  FaPlus, 
  FaCalendar,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaImage
} from 'react-icons/fa'

const AdminPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('orders')
  const [orderSubTab, setOrderSubTab] = useState('all') // 'all', 'ots', 'po'
  const [orders, setOrders] = useState([])
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState({})
  const [configLoading, setConfigLoading] = useState(false)
  const [hargaPerMember, setHargaPerMember] = useState('25000')
  const [hargaGrup, setHargaGrup] = useState('30000')
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [otsFilter, setOtsFilter] = useState('all') // 'all', 'true', 'false'
  const [eventFilter, setEventFilter] = useState('all') // New: filter by event
  const [dateFilter, setDateFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Modals
  const [showOTSModal, setShowOTSModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null) // For edit mode

  useEffect(() => {
    checkAuth()
    fetchOrders()
    fetchMembers()
    fetchEvents()
    fetchConfig()
  }, [])

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders()
    }
  }, [statusFilter, otsFilter, eventFilter, dateFilter, searchQuery, activeTab, orderSubTab])

  const checkAuth = () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/admin/login')
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = {}
      
      if (statusFilter !== 'all') params.status = statusFilter
      
      // Apply sub-tab filter
      if (orderSubTab === 'ots') {
        params.is_ots = 'true'
      } else if (orderSubTab === 'po') {
        params.is_ots = 'false'
      } else if (otsFilter !== 'all') {
        params.is_ots = otsFilter
      }
      
      if (eventFilter !== 'all') params.event_id = eventFilter
      if (searchQuery) params.search = searchQuery
      
      console.log('Fetch orders params:', params)
      
      if (dateFilter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        params.dateFrom = weekAgo.toISOString()
      } else if (dateFilter === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        params.dateFrom = monthAgo.toISOString()
      } else if (dateFilter === 'custom' && dateFrom) {
        params.dateFrom = new Date(dateFrom).toISOString()
        if (dateTo) params.dateTo = new Date(dateTo).toISOString()
      }

      const response = await api.get('/orders', { params })
      setOrders(response.data.data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      if (error.response?.status === 401) {
        navigate('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members')
      setMembers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events')
      console.log('Events fetched:', response.data)
      setEvents(response.data.data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchConfig = async () => {
    try {
      const response = await api.get('/config')
      const configData = response.data.data || {}
      setConfig(configData)
      
      // Update form values
      if (configData.harga_cheki_per_member) {
        setHargaPerMember(configData.harga_cheki_per_member)
      }
      if (configData.harga_cheki_grup) {
        setHargaGrup(configData.harga_cheki_grup)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    }
  }

  const updateConfig = async (updates) => {
    try {
      setConfigLoading(true)
      await api.patch('/config', updates)
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Konfigurasi berhasil diupdate',
        confirmButtonColor: '#079108'
      })
      
      fetchConfig()
    } catch (error) {
      console.error('Error updating config:', error)
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: error.response?.data?.error || 'Gagal update konfigurasi',
        confirmButtonColor: '#079108'
      })
    } finally {
      setConfigLoading(false)
    }
  }

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      text: 'Anda yakin ingin keluar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#079108',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Logout',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        navigate('/admin/login')
      }
    })
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus })
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Status updated!',
        showConfirmButton: false,
        timer: 1500
      })
      
      fetchOrders()
    } catch (error) {
      console.error('Error updating status:', error)
      Swal.fire({
        icon: 'error',
        title: 'Gagal Update Status',
        text: error.response?.data?.error || error.message,
        confirmButtonColor: '#079108'
      })
    }
  }

  const handleDeleteOrder = async (orderId) => {
    Swal.fire({
      title: 'Hapus Order?',
      text: 'Data tidak bisa dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/orders/${orderId}`)
          Swal.fire('Deleted!', 'Order telah dihapus.', 'success')
          fetchOrders()
        } catch (error) {
          Swal.fire('Error!', error.message, 'error')
        }
      }
    })
  }

  const handleBulkDelete = async (deleteType, params = {}) => {
    try {
      const response = await api.post('/orders/bulk-delete', {
        deleteType,
        ...params
      })

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: response.data.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      })

      fetchOrders()
      setShowBulkDeleteModal(false)
    } catch (error) {
      Swal.fire('Error!', error.response?.data?.error || error.message, 'error')
    }
  }

  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setShowEventModal(true)
  }

  const handleDeleteEvent = async (eventId, eventName) => {
    Swal.fire({
      title: 'Hapus Event?',
      text: `Apakah Anda yakin ingin menghapus event "${eventName}"? Semua order terkait akan kehilangan referensi event.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/events/${eventId}`)
          
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Event berhasil dihapus',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          })
          
          fetchEvents()
        } catch (error) {
          Swal.fire('Error!', error.response?.data?.error || error.message, 'error')
        }
      }
    })
  }

  const viewOrderDetail = (order) => {
    setSelectedOrder(order)
    setShowOrderDetailModal(true)
  }

  const handleExportExcel = async () => {
    try {
      const params = {}
      
      if (statusFilter !== 'all') params.status = statusFilter
      if (otsFilter !== 'all') params.is_ots = otsFilter
      if (eventFilter !== 'all') params.event_id = eventFilter
      if (searchQuery) params.search = searchQuery
      
      if (dateFilter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        params.dateFrom = weekAgo.toISOString()
      } else if (dateFilter === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        params.dateFrom = monthAgo.toISOString()
      } else if (dateFilter === 'custom' && dateFrom) {
        params.dateFrom = new Date(dateFrom).toISOString()
        if (dateTo) params.dateTo = new Date(dateTo).toISOString()
      }

      const queryString = new URLSearchParams(params).toString()
      const token = localStorage.getItem('admin_token')
      
      // Construct API URL - use relative path in production
      const apiUrl = import.meta.env.MODE === 'production' 
        ? '/api' 
        : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
      
      // Fetch with authorization header
      const response = await fetch(`${apiUrl}/orders/export/excel?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Export gagal')

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `RefreshBreeze_Orders_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Excel berhasil didownload!',
        showConfirmButton: false,
        timer: 2000
      })
    } catch (error) {
      console.error('Error exporting:', error)
      Swal.fire({
        icon: 'error',
        title: 'Export Gagal',
        text: error.message,
        confirmButtonColor: '#079108'
      })
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-white text-gray-600 border-2 border-gray-300',
      checked: 'bg-blue-100 text-blue-700 border-2 border-blue-400',
      completed: 'bg-green-100 text-green-700 border-2 border-green-400'
    }
    
    const labels = {
      pending: 'Pending',
      checked: 'Checked',
      completed: 'Completed'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const renderOrders = () => (
    <div className="space-y-6">
      {/* Sub-tabs for OTS / PO */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setOrderSubTab('all')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              orderSubTab === 'all'
                ? 'bg-custom-green text-white border-b-4 border-green-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <FaShoppingCart />
              Semua Order
            </span>
          </button>
          <button
            onClick={() => setOrderSubTab('ots')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              orderSubTab === 'ots'
                ? 'bg-orange-500 text-white border-b-4 border-orange-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              🏪 Order OTS
            </span>
          </button>
          <button
            onClick={() => setOrderSubTab('po')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              orderSubTab === 'po'
                ? 'bg-blue-500 text-white border-b-4 border-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              📦 Pre-Order
            </span>
          </button>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Cari nama, email, order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-green"
          />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-green"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending (Putih)</option>
            <option value="checked">Checked (Biru)</option>
            <option value="completed">Completed (Hijau)</option>
          </select>

          {/* OTS Filter */}
          <select
            value={otsFilter}
            onChange={(e) => setOtsFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-green bg-white"
          >
            <option value="all">Semua Tipe</option>
            <option value="true">OTS (On The Spot)</option>
            <option value="false">Pre-Order</option>
          </select>

          {/* Event Filter */}
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-green bg-white"
          >
            <option value="all">Semua Event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.nama} - {event.bulan} {event.tahun}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-green"
          >
            <option value="all">Semua Waktu</option>
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="custom">Custom Range</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <FaFileExcel /> Export Excel
          </button>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setShowOTSModal(true)}
            className="bg-custom-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FaPlus /> Order OTS
          </button>
          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FaTrash /> Hapus Data
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-custom-green text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold">Order #</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Tipe</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Nama</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Items</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Bukti Bayar</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Total</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Tanggal</th>
                <th className="px-4 py-3 text-center text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8">
                    <i className="fas fa-spinner animate-spin text-3xl text-custom-green"></i>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        order.is_ots 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.is_ots ? 'OTS' : 'Pre-Order'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-semibold">{order.nama_lengkap}</div>
                      <div className="text-xs text-gray-500">{order.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="space-y-1">
                        {order.order_items?.map((item, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-medium">{item.item_name}</span>
                            <span className="text-gray-500"> x{item.quantity}</span>
                          </div>
                        )) || <span className="text-gray-400">No items</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {!order.is_ots && order.payment_proof_url ? (
                        <a 
                          href={order.payment_proof_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                        >
                          <FaImage /> Lihat
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-custom-green">
                      Rp {order.total_harga?.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border-2 cursor-pointer ${
                          order.status === 'pending' ? 'bg-white text-gray-600 border-gray-300' :
                          order.status === 'checked' ? 'bg-blue-100 text-blue-700 border-blue-400' :
                          'bg-green-100 text-green-700 border-green-400'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="checked">Checked</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => viewOrderDetail(order)}
                          className="text-blue-600 hover:text-blue-800 p-2"
                          title="Detail"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-600 hover:text-red-800 p-2"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, color: 'bg-blue-500', icon: '🛒' },
          { label: 'Order OTS', value: orders.filter(o => o.is_ots).length, color: 'bg-orange-500', icon: '🏪' },
          { label: 'Pre-Order', value: orders.filter(o => !o.is_ots).length, color: 'bg-blue-600', icon: '📦' },
          { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: 'bg-gray-400', icon: '⏳' },
          { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: 'bg-green-600', icon: '✅' }
        ].map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-md">
            <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center text-white text-2xl mb-3`}>
              {stat.icon}
            </div>
            <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Event Management</h2>
        <button
          onClick={() => setShowEventModal(true)}
          className="bg-custom-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <FaPlus /> Tambah Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-custom-green">{event.nama}</h3>
                <p className="text-sm text-gray-500">
                  {event.tanggal} {event.bulan} {event.tahun}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                event.is_past ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'
              }`}>
                {event.is_past ? 'Past' : 'Upcoming'}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Lokasi:</strong> {event.lokasi}</p>
              <p><strong>Event Time:</strong> {event.event_time}</p>
              {event.cheki_time && <p><strong>Cheki Time:</strong> {event.cheki_time}</p>}
              <p><strong>Lineup:</strong> {event.event_lineup?.length || 0} member(s)</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => handleEditEvent(event)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <FaEdit /> Edit
              </button>
              <button 
                onClick={() => handleDeleteEvent(event.id, event.nama)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSettings = () => {
    const handleSaveSettings = () => {
      updateConfig({
        harga_cheki_per_member: hargaPerMember,
        harga_cheki_grup: hargaGrup
      })
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan Harga</h2>
          
          <div className="space-y-6">
            {/* Harga Per Member */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Harga Cheki Per Member
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  Rp
                </span>
                <input
                  type="number"
                  value={hargaPerMember}
                  onChange={(e) => setHargaPerMember(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-custom-green focus:outline-none transition-colors"
                  placeholder="25000"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Harga untuk cheki per member individual
              </p>
            </div>

            {/* Harga Grup */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Harga Cheki Grup (All Member)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  Rp
                </span>
                <input
                  type="number"
                  value={hargaGrup}
                  onChange={(e) => setHargaGrup(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-custom-green focus:outline-none transition-colors"
                  placeholder="30000"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Harga untuk cheki grup (semua member)
              </p>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Preview Harga:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Per Member:</span>
                  <span className="font-bold text-custom-green">
                    {parseInt(hargaPerMember || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Grup:</span>
                  <span className="font-bold text-custom-green">
                    {parseInt(hargaGrup || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              disabled={configLoading}
              className="w-full bg-gradient-to-r from-custom-green to-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {configLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-custom-green">
            REFRESH BREEZE - Admin CMS
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-4">
            {[
              { id: 'orders', label: 'Orders', icon: FaShoppingCart },
              { id: 'events', label: 'Events', icon: FaCalendar },
              { id: 'settings', label: 'Settings', icon: FaEdit }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 border-b-2 ${
                  activeTab === tab.id
                    ? 'text-custom-green border-custom-green'
                    : 'text-gray-500 border-transparent hover:text-custom-green'
                }`}
              >
                <tab.icon /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      {/* Order Detail Modal */}
      {showOrderDetailModal && selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => {
            setShowOrderDetailModal(false)
            setSelectedOrder(null)
          }} 
        />
      )}

      {/* OTS Order Modal */}
      {showOTSModal && (
        <OTSOrderModal
          members={members}
          events={events}
          onClose={() => setShowOTSModal(false)}
          onSuccess={() => {
            setShowOTSModal(false)
            fetchOrders()
          }}
        />
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <BulkDeleteModal
          events={events}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={handleBulkDelete}
        />
      )}

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          members={members}
          editingEvent={editingEvent}
          onClose={() => {
            setShowEventModal(false)
            setEditingEvent(null) // Reset editing state
          }}
          onSuccess={() => {
            setShowEventModal(false)
            setEditingEvent(null) // Reset editing state
            fetchEvents()
          }}
        />
      )}
    </div>
  )
}

// Order Detail Modal Component
const OrderDetailModal = ({ order, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center bg-custom-green text-white">
          <h3 className="text-xl font-bold">Detail Order - {order.order_number}</h3>
          <button onClick={onClose} className="text-2xl hover:text-gray-200">
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nama Lengkap</p>
              <p className="font-semibold">{order.nama_lengkap}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">WhatsApp</p>
              <p className="font-semibold">{order.whatsapp}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold">{order.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Instagram</p>
              <p className="font-semibold">{order.instagram || '-'}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-bold mb-2">Order Items:</h4>
            <div className="space-y-2">
              {order.order_items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <span>{item.item_name} x {item.quantity}</span>
                  <span className="font-bold text-custom-green">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-extrabold text-2xl text-custom-green">
                Rp {order.total_harga?.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {order.payment_proof_url && (
            <div className="border-t pt-4">
              <h4 className="font-bold mb-2">Bukti Transfer:</h4>
              <a
                href={order.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={order.payment_proof_url}
                  alt="Payment Proof"
                  className="w-full max-w-md mx-auto rounded-lg border shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                />
              </a>
              <a
                href={order.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-blue-600 hover:text-blue-800 text-sm"
              >
                <FaEye className="inline mr-1" /> Lihat di Google Drive
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// OTS Order Modal Component
const OTSOrderModal = ({ members, events, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    event_id: '',
    payment_method: 'Cash', // Cash atau QR
    items: []
  })
  const [submitting, setSubmitting] = useState(false)

  const addItem = (member) => {
    const isGroup = member.member_id === 'group'
    const price = isGroup ? 30000 : 25000
    
    const existing = formData.items.find(item => item.member_id === member.id)
    if (existing) {
      setFormData({
        ...formData,
        items: formData.items.map(item =>
          item.member_id === member.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      })
    } else {
      setFormData({
        ...formData,
        items: [...formData.items, {
          member_id: member.id,
          name: `Cheki ${member.nama_panggung}`,
          price: price,
          quantity: 1
        }]
      })
    }
  }

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await api.post('/orders/ots', formData)
      Swal.fire({
        icon: 'success',
        title: 'Order OTS Berhasil!',
        confirmButtonColor: '#079108'
      })
      onSuccess()
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: error.response?.data?.error || error.message,
        confirmButtonColor: '#079108'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const totalPrice = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center bg-custom-green text-white">
          <h3 className="text-xl font-bold">Order OTS (On The Spot)</h3>
          <button onClick={onClose} className="text-2xl hover:text-gray-200">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Inputs */}
            <div className="space-y-4">
              <select
                value={formData.event_id}
                onChange={(e) => setFormData({...formData, event_id: e.target.value})}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-custom-green"
                required
              >
                <option value="">-- Pilih Event *--</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.nama} - {event.tanggal} {event.bulan} {event.tahun}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Nama Lengkap *"
                value={formData.nama_lengkap}
                onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-custom-green"
                required
              />
              
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold mb-2">Metode Pembayaran *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, payment_method: 'Cash'})}
                    className={`px-4 py-3 rounded-lg font-semibold border-2 transition-all ${
                      formData.payment_method === 'Cash'
                        ? 'bg-custom-green text-white border-custom-green'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-custom-green'
                    }`}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, payment_method: 'QR'})}
                    className={`px-4 py-3 rounded-lg font-semibold border-2 transition-all ${
                      formData.payment_method === 'QR'
                        ? 'bg-custom-green text-white border-custom-green'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-custom-green'
                    }`}
                  >
                    📱 QR Code
                  </button>
                </div>
              </div>

              {/* Cart */}
              <div className="border-t pt-4">
                <h4 className="font-bold mb-2">Items:</h4>
                {formData.items.length === 0 ? (
                  <p className="text-gray-400 text-sm">Pilih member di sebelah kanan</p>
                ) : (
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-sm">{item.name} x {item.quantity}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-custom-green">Rp {totalPrice.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Member Selection */}
            <div className="border-l pl-6">
              <h4 className="font-bold mb-4">Pilih Member:</h4>
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => addItem(member)}
                    className="p-3 border rounded-lg hover:border-custom-green hover:bg-custom-mint/20 transition-colors text-left"
                  >
                    <div className="text-sm font-semibold">{member.nama_panggung}</div>
                    <div className="text-xs text-gray-500">
                      Rp {(member.member_id === 'group' ? 30000 : 25000).toLocaleString('id-ID')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || formData.items.length === 0}
              className="flex-1 bg-custom-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Event Modal Component (Simplified)
const EventModal = ({ members, onClose, onSuccess, editingEvent }) => {
  const [formData, setFormData] = useState(
    editingEvent || {
      nama: '',
      tanggal: '',
      bulan: '',
      tahun: new Date().getFullYear(),
      lokasi: '',
      event_time: '',
      cheki_time: '',
      is_past: false,
      lineup: []
    }
  )
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingEvent) {
        // Update existing event
        await api.put(`/events/${editingEvent.id}`, formData)
        Swal.fire({
          icon: 'success',
          title: 'Event Updated!',
          confirmButtonColor: '#079108'
        })
      } else {
        // Create new event
        await api.post('/events', formData)
        Swal.fire({
          icon: 'success',
          title: 'Event Created!',
          confirmButtonColor: '#079108'
        })
      }
      onSuccess()
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: error.response?.data?.error || error.message,
        confirmButtonColor: '#079108'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center bg-custom-green text-white">
          <h3 className="text-xl font-bold">
            {editingEvent ? 'Edit Event' : 'Tambah Event Baru'}
          </h3>
          <button onClick={onClose} className="text-2xl hover:text-gray-200">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            type="text"
            placeholder="Nama Event *"
            value={formData.nama}
            onChange={(e) => setFormData({...formData, nama: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="Tanggal (1-31)"
              value={formData.tanggal}
              onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              min="1"
              max="31"
              required
            />
            <select
              value={formData.bulan}
              onChange={(e) => setFormData({...formData, bulan: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              required
            >
              <option value="">Pilih Bulan</option>
              {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Tahun"
              value={formData.tahun}
              onChange={(e) => setFormData({...formData, tahun: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <input
            type="text"
            placeholder="Lokasi *"
            value={formData.lokasi}
            onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />

          <input
            type="text"
            placeholder="Event Time (e.g. 14:00 WIB)"
            value={formData.event_time}
            onChange={(e) => setFormData({...formData, event_time: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />

          <input
            type="text"
            placeholder="Cheki Time (opsional)"
            value={formData.cheki_time}
            onChange={(e) => setFormData({...formData, cheki_time: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_past}
              onChange={(e) => setFormData({...formData, is_past: e.target.checked})}
              className="w-5 h-5"
            />
            <span className="text-sm">Event sudah selesai (Past Event)</span>
          </label>

          <div className="border-t pt-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 mb-2"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-custom-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Bulk Delete Modal Component
const BulkDeleteModal = ({ events, onClose, onConfirm }) => {
  const [deleteType, setDeleteType] = useState('all')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [weeks, setWeeks] = useState(1)
  const [months, setMonths] = useState(1)

  const handleSubmit = () => {
    let confirmText = ''
    let params = {}

    switch(deleteType) {
      case 'all':
        confirmText = 'Hapus SEMUA data pembelian? Ini akan menghapus seluruh orders dan tidak bisa dikembalikan!'
        break
      case 'event':
        if (!selectedEventId) {
          Swal.fire('Error', 'Pilih event terlebih dahulu', 'error')
          return
        }
        const event = events.find(e => e.id === selectedEventId)
        confirmText = `Hapus semua data pembelian dari event "${event?.nama}"?`
        params = { eventId: selectedEventId }
        break
      case 'weeks':
        confirmText = `Hapus data pembelian ${weeks} minggu terakhir?`
        params = { weeks }
        break
      case 'months':
        confirmText = `Hapus data pembelian ${months} bulan terakhir?`
        params = { months }
        break
    }

    Swal.fire({
      title: 'Konfirmasi Hapus',
      text: confirmText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        onConfirm(deleteType, params)
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Hapus Data Pembelian</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FaTimes size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">
              ⚠️ <strong>Perhatian:</strong> Data yang dihapus tidak bisa dikembalikan!
            </p>
          </div>

          {/* Delete Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pilih Jenis Hapus
            </label>
            <select
              value={deleteType}
              onChange={(e) => setDeleteType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Hapus Semua Data</option>
              <option value="event">Hapus Per Event</option>
              <option value="weeks">Hapus Per Minggu</option>
              <option value="months">Hapus Per Bulan</option>
            </select>
          </div>

          {/* Event Selection */}
          {deleteType === 'event' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pilih Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">-- Pilih Event --</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.nama} - {event.bulan} {event.tahun}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Weeks Selection */}
          {deleteType === 'weeks' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Jumlah Minggu Terakhir
              </label>
              <input
                type="number"
                min="1"
                max="52"
                value={weeks}
                onChange={(e) => setWeeks(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Akan menghapus data {weeks} minggu terakhir
              </p>
            </div>
          )}

          {/* Months Selection */}
          {deleteType === 'months' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Jumlah Bulan Terakhir
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={months}
                onChange={(e) => setMonths(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Akan menghapus data {months} bulan terakhir
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <FaTrash /> Hapus Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage
