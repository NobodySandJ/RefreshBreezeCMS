import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { supabase } from '../lib/supabase'
import { getMemberEmoji, formatMemberName } from '../lib/memberUtils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Swal from 'sweetalert2'
import ExportModal from '../components/ExportModal'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

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
  FaImage,
  FaChartBar
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
  
  // Export State
  const [showExportModal, setShowExportModal] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [otsFilter, setOtsFilter] = useState('all') // 'all', 'true', 'false'
  const [eventFilter, setEventFilter] = useState('all') // New: filter by event
  const [recapEventFilter, setRecapEventFilter] = useState('all') // New: filter by event specifically for recap
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

    // Realtime Subscription for Orders
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('🔔 Realtime update:', payload)
        fetchOrders()
        
        // Optional: Show toast notification
        if (payload.eventType === 'INSERT') {
           const newOrder = payload.new
           if (newOrder.created_by === 'customer') {
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Order Baru Masuk!',
                text: `${newOrder.nama_lengkap} (${newOrder.order_number})`,
                showConfirmButton: false,
                timer: 5000
              })
           }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
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

  const handleExportClick = () => {
    setShowExportModal(true)
  }

  const handleExport = async ({ format, scope, value }) => {
     if (format === 'excel') {
       await generateExcel({ scope, value })
     } else if (format === 'pdf') {
       await generatePDF({ scope, value })
     }
  }

  const generateExcel = async ({ scope, value }) => {
    try {
      const params = {}
      
      // Use current filters if scope is 'current', otherwise fetch all by event/month
      if (scope === 'current') {
         if (statusFilter !== 'all') params.status = statusFilter
         if (otsFilter !== 'all') params.is_ots = otsFilter
         if (eventFilter !== 'all') params.event_id = eventFilter
         if (searchQuery) params.search = searchQuery
         if (dateFilter === 'custom' && dateFrom) {
            params.dateFrom = new Date(dateFrom).toISOString()
            if (dateTo) params.dateTo = new Date(dateTo).toISOString()
         }
      } else if (scope === 'event') {
         params.event_id = value
      } else if (scope === 'month') {
         // month value is YYYY-MM
         const date = new Date(value)
         const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
         const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
         params.dateFrom = firstDay.toISOString()
         params.dateTo = lastDay.toISOString()
      }

      const queryString = new URLSearchParams(params).toString()
      const token = localStorage.getItem('admin_token')
      const apiUrl = import.meta.env.MODE === 'production' ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
      
      Swal.fire({ title: 'Downloading Excel...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })

      const response = await fetch(`${apiUrl}/orders/export/excel?${queryString}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Export gagal')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const suffix = scope === 'event' ? `Event_${value}` : scope === 'month' ? `Month_${value}` : 'Filtered'
      a.download = `RefreshBreeze_Orders_${suffix}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      Swal.fire({ icon: 'success', title: 'Excel berhasil didownload!', timer: 2000, showConfirmButton: false })
    } catch (error) {
      console.error('Error exporting:', error)
      Swal.fire({ icon: 'error', title: 'Export Gagal', text: error.message })
    }
  }

  const generatePDF = async ({ scope, value }) => {
    try {
      Swal.fire({ title: 'Generating PDF...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
      
      const params = {}
      if (scope === 'current') {
         if (statusFilter !== 'all') params.status = statusFilter
         if (otsFilter !== 'all') params.is_ots = otsFilter
         if (eventFilter !== 'all') params.event_id = eventFilter
         if (searchQuery) params.search = searchQuery
      } else if (scope === 'event') {
         params.event_id = value
      } else if (scope === 'month') {
         const date = new Date(value)
         const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
         const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
         params.dateFrom = firstDay.toISOString()
         params.dateTo = lastDay.toISOString()
      }

      // Fetch Data Manually for PDF
      const res = await api.get('/orders', { params })
      const orders = res.data.data
      
      if (!orders || orders.length === 0) {
        throw new Error('Tidak ada data untuk diexport.')
      }

      // Helper to strip emojis (cause PDF encoding issues)
      const stripEmoji = (text) => String(text || '').replace(/[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()

      // Get Event Name if exporting by event
      let eventName = ''
      if (scope === 'event' && value) {
        const foundEvent = events.find(e => e.id === value)
        eventName = foundEvent ? `${foundEvent.nama} - ${foundEvent.bulan} ${foundEvent.tahun}` : 'Event'
      }

      // Only count CHECKED/COMPLETED orders for revenue
      const paidOrders = orders.filter(o => o.status === 'checked' || o.status === 'completed')
      
      // Calculate Stats (from paid orders only)
      let totalRevenue = 0
      let totalItems = 0
      const memberStats = {}

      paidOrders.forEach(order => {
        totalRevenue += order.total_harga || 0
        order.order_items?.forEach(item => {
          totalItems += item.quantity || 0
          
          let name = stripEmoji(item.item_name.replace('Cheki ', '').replace(' (Pre-Order)', ''))
          if (name.toLowerCase().includes('all member') || name.toLowerCase().includes('group')) name = 'Group'
          
          if (!memberStats[name]) memberStats[name] = 0
          memberStats[name] += item.quantity || 0
        })
      })

      // Generate PDF
      const doc = new jsPDF()
      
      // Header
      doc.setFillColor(7, 145, 8) // Green
      doc.rect(0, 0, 210, 24, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('REFRESH BREEZE - LAPORAN PENJUALAN', 105, 16, { align: 'center' })
      
      // Info
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 35)
      
      let scopeLabel = 'Sesuai Filter Aktif'
      if (scope === 'event') {
        scopeLabel = eventName
      } else if (scope === 'month') {
        const [y, m] = value.split('-')
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        scopeLabel = `${monthNames[parseInt(m) - 1]} ${y}`
      }
      doc.text(`Cakupan Data: ${scopeLabel}`, 14, 40)

      // Summary Box
      doc.setFillColor(240, 253, 244)
      doc.roundedRect(14, 45, 182, 35, 3, 3, 'F')
      doc.setDrawColor(34, 197, 94)
      doc.roundedRect(14, 45, 182, 35, 3, 3, 'S')
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(22, 101, 52)
      doc.text('RINGKASAN (Checked/Completed Orders)', 20, 55)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(`Total Omzet: Rp ${totalRevenue.toLocaleString('id-ID')}`, 20, 65)
      doc.text(`Order Terbayar: ${paidOrders.length} dari ${orders.length}`, 100, 65)
      doc.text(`Total Cheki: ${totalItems} pcs`, 20, 72)
      
      // Member Stats Table
      const memberBody = Object.entries(memberStats)
        .sort((a, b) => b[1] - a[1])
        .map(([name, qty]) => [stripEmoji(name), `${qty} pcs`])
      
      autoTable(doc, {
        startY: 85,
        head: [['Member', 'Qty Terjual']],
        body: memberBody,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 30 } },
        tableWidth: 100,
        margin: { left: 14 }
      })

      // Main Table
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 120
      
      const tableBody = orders.map((order, index) => {
        const itemsText = order.order_items?.map(i => `${stripEmoji(i.item_name)} x${i.quantity}`).join(', ') || '-'
        const statusLabel = order.status === 'pending' ? 'Unchecked' : order.status === 'checked' ? 'Checked' : 'Completed'
        const totalText = order.status === 'pending' ? '-' : `Rp ${(order.total_harga || 0).toLocaleString('id-ID')}`
        
        return [
          index + 1,
          order.order_number,
          stripEmoji(order.nama_lengkap || ''),
          order.is_ots ? 'OTS' : 'PO',
          itemsText,
          totalText,
          statusLabel
        ]
      })

      autoTable(doc, {
        startY: finalY + 10,
        head: [['#', 'Order ID', 'Nama', 'Tipe', 'Items', 'Total', 'Status']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [7, 145, 8], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: { 
          0: { cellWidth: 10 },
          1: { cellWidth: 32 },
          2: { cellWidth: 28 },
          3: { cellWidth: 12 },
          4: { cellWidth: 55 },
          5: { cellWidth: 25 },
          6: { cellWidth: 20 }
        }
      })

      // Save with readable name
      const safeName = scopeLabel.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '_')
      doc.save(`Laporan_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`)

      Swal.fire({ icon: 'success', title: 'PDF Berhasil Dibuat!', timer: 1500, showConfirmButton: false })
      
    } catch (error) {
       console.error(error)
       Swal.fire({ icon: 'error', title: 'Gagal Membuat PDF', text: error.message })
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

  const renderOrders = () => {
    const otsOrders = orders.filter(o => o.is_ots)
    const poOrders = orders.filter(o => !o.is_ots)
    


    return (
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

        {/* Status Legend */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center text-sm text-blue-800">
            <span className="font-bold whitespace-nowrap">Panduan Status:</span>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white border border-gray-300"></span>
                <span><strong>Unchecked:</strong> Order baru (Belum dicek/verifikasi)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-400"></span>
                <span><strong>Checked:</strong> Pembayaran valid (Lunas)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-100 border border-green-400"></span>
                <span><strong>Completed:</strong> Selesai (Tiket diambil/Done)</span>
              </div>
            </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Cari nama atau order number..."
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
              <option value="pending">Unchecked</option>
              <option value="checked">Checked</option>
              <option value="completed">Completed</option>
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
          </div>
  
          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
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
  
          {/* Global Actions */}
          <div className="flex gap-3 justify-end border-t pt-4">
             <button
              onClick={async () => {
                // Step 1: Choose Format
                const { value: format } = await Swal.fire({
                  title: 'Export Data',
                  input: 'radio',
                  inputOptions: {
                    'excel': '📊 Excel (.xlsx)',
                    'pdf': '📄 PDF Document'
                  },
                  inputValidator: (value) => {
                    if (!value) return 'Pilih format export!'
                  },
                  confirmButtonText: 'Lanjut →',
                  confirmButtonColor: '#079108',
                  showCancelButton: true,
                  cancelButtonText: 'Batal'
                })

                if (!format) return

                // Step 2: Choose Scope
                const eventOptions = { 'current': '📋 Sesuai Filter di Layar' }
                events.forEach(ev => {
                  eventOptions[`event_${ev.id}`] = `🎫 ${ev.nama} (${ev.bulan} ${ev.tahun})`
                })

                const { value: scope } = await Swal.fire({
                  title: 'Pilih Cakupan Data',
                  input: 'radio',
                  inputOptions: eventOptions,
                  inputValidator: (value) => {
                    if (!value) return 'Pilih cakupan data!'
                  },
                  confirmButtonText: format === 'excel' ? '📊 Download Excel' : '📄 Download PDF',
                  confirmButtonColor: format === 'excel' ? '#079108' : '#EF4444',
                  showCancelButton: true,
                  cancelButtonText: 'Batal'
                })

                if (!scope) return

                // Process export
                const isEvent = scope.startsWith('event_')
                const eventId = isEvent ? scope.replace('event_', '') : null

                if (format === 'excel') {
                  await generateExcel({ scope: isEvent ? 'event' : 'current', value: eventId })
                } else {
                  await generatePDF({ scope: isEvent ? 'event' : 'current', value: eventId })
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all text-sm font-bold active:scale-95"
            >
              <FaFileExcel /> Export Data
            </button>
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <FaTrash /> Hapus Data
            </button>
          </div>
        </div>
  
        {/* Orders Tables */}
        {(orderSubTab === 'all' || orderSubTab === 'ots') && (
          <RenderTable 
            data={otsOrders} 
            title="Order OTS (On The Spot)" 
            icon={<span className="text-xl">🏪</span>}
            emptyMessage="Tidak ada data OTS"
            loading={loading}
            onView={viewOrderDetail}
            onDelete={handleDeleteOrder}
            onStatusChange={handleStatusChange}
            action={
              <button
                onClick={() => setShowOTSModal(true)}
                className="bg-custom-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              >
                <FaPlus /> Order OTS
              </button>
            }
          />
        )}
  
        {(orderSubTab === 'all' || orderSubTab === 'po') && (
          <RenderTable 
            data={poOrders} 
            title="Pre-Order (Online)" 
            icon={<span className="text-xl">📦</span>}
            emptyMessage="Tidak ada data Pre-Order"
            loading={loading}
            onView={viewOrderDetail}
            onDelete={handleDeleteOrder}
            onStatusChange={handleStatusChange}
          />
        )}
  
      </div>
    )
  }

  const renderRecap = () => {
    // 0. Filter by Event for Recap
    const filteredRecapOrders = recapEventFilter === 'all' 
      ? orders 
      : orders.filter(o => o.event_id === recapEventFilter)

    // 1. Calculate Statistics
    const totalRevenue = filteredRecapOrders.reduce((sum, order) => sum + (order.total_harga || 0), 0)
    
    // Process Member Sales (Quantity & Revenue)
    const memberStats = {}
    
    filteredRecapOrders.forEach(order => {
      // Only count completed/checked orders for revenue? Usually yes, but user said "Total Penjualan".
      // Let's include everything or maybe filter by status if requested. For now, all orders.
      // Actually strictly "Penjualan" implies successful ones. Let's use all for now to match "Total Orders" count.
      
      order.order_items?.forEach(item => {
        // Try to identify member from item name if unique ID not available directly
        // But since we have consistent naming "Cheki [Name]", we can use that.
        // Or if we have member_id in item (from OTS). PO items might not have it.
        // Let's rely on item.name cleaning.
        let memberName = item.item_name.replace('Cheki ', '').replace(' (Pre-Order)', '').trim()
        
        // Handle "All Member" group
        if (memberName.toLowerCase().includes('all member') || memberName.toLowerCase().includes('group')) {
          memberName = 'All Member (Group)'
        }

        if (!memberStats[memberName]) {
          memberStats[memberName] = { quantity: 0, revenue: 0 }
        }
        
        memberStats[memberName].quantity += item.quantity || 0
        memberStats[memberName].revenue += (item.price || 0) * (item.quantity || 0)
        
        // Fallback if price is not in item (older POs might rely on order total)
        // ideally item.price should exist.
      })
    })

    const labels = Object.keys(memberStats)
    const quantityData = labels.map(name => memberStats[name].quantity)
    const revenueData = labels.map(name => memberStats[name].revenue)

    // Chart Options
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Statistik Penjualan per Member' },
      },
      scales: {
        x: { beginAtZero: true }
      }
    }

    const quantityChartData = {
      labels,
      datasets: [
        {
          label: 'Jumlah Cheki Terjual',
          data: quantityData,
          backgroundColor: 'rgba(53, 162, 235, 0.7)',
          borderColor: 'rgb(53, 162, 235)',
          borderWidth: 1,
        }
      ]
    }

    const revenueChartData = {
      labels,
      datasets: [
        {
          label: 'Total Pendapatan (Rp)',
          data: revenueData,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
        }
      ]
    }

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Rekapitulasi Penjualan</h2>
          
          {/* Event Filter for Recap */}
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" />
            <select
              value={recapEventFilter}
              onChange={(e) => setRecapEventFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-green bg-white"
            >
              <option value="all">Semua Event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.nama} - {event.bulan} {event.tahun}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Orders', value: filteredRecapOrders.length, color: 'bg-blue-500', icon: <FaShoppingCart /> },
            { label: 'Order OTS', value: filteredRecapOrders.filter(o => o.is_ots).length, color: 'bg-orange-500', icon: <span className="text-xl">🏪</span> },
            { label: 'Pre-Order', value: filteredRecapOrders.filter(o => !o.is_ots).length, color: 'bg-blue-600', icon: <span className="text-xl">📦</span> },
            { label: 'Unchecked', value: filteredRecapOrders.filter(o => o.status === 'pending').length, color: 'bg-gray-400', icon: <span className="text-xl">⏳</span> },
            { label: 'Completed', value: filteredRecapOrders.filter(o => o.status === 'completed').length, color: 'bg-green-600', icon: <FaCheck /> },
            { label: 'Total Pemasukan', value: `Rp ${totalRevenue.toLocaleString('id-ID')}`, color: 'bg-custom-green', icon: <span className="text-xl font-bold">Rp</span>, wide: true }
          ].map((stat, index) => (
            <div key={index} className={`bg-white p-4 rounded-xl shadow-md ${stat.wide ? 'col-span-2 md:col-span-1 lg:col-span-1' : ''}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 ${stat.color} rounded-full flex items-center justify-center text-white`}>
                  {stat.icon}
                </div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
              <div className={`${typeof stat.value === 'string' && stat.value.length > 10 ? 'text-xl' : 'text-3xl'} font-bold text-gray-800`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quantity Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-gray-700 mb-4 text-center">Total Cheki per Member</h3>
            <Bar options={chartOptions} data={quantityChartData} />
          </div>

          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-gray-700 mb-4 text-center">Total Rupiah per Member</h3>
            <Bar 
              options={{
                ...chartOptions,
                plugins: { ...chartOptions.plugins, title: { display: false } }
              }} 
              data={revenueChartData} 
            />
          </div>
        </div>
      </div>
    )
  }


  // Toggle event past status
  const handleTogglePast = async (eventId, currentStatus) => {
    try {
      await api.patch(`/events/${eventId}`, { is_past: !currentStatus })
      fetchEvents()
      Swal.fire({
        icon: 'success',
        title: !currentStatus ? 'Event ditandai selesai!' : 'Event diaktifkan kembali!',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.message })
    }
  }

  const renderEvents = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Event Management</h2>
        <button
          onClick={() => { setEditingEvent(null); setShowEventModal(true) }}
          className="bg-custom-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <FaPlus /> Tambah Event
        </button>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Event</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Lokasi</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Lineup</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">Belum ada event</td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{event.nama}</span>
                        {event.is_special && (
                          <span 
                            className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                            style={{ backgroundColor: event.theme_color || '#FF6B9D' }}
                          >
                            {event.theme_name || 'Special'}
                          </span>
                        )}
                      </div>
                      {event.event_time && <p className="text-xs text-gray-500">{event.event_time}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {event.tanggal} {event.bulan} {event.tahun}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{event.lokasi}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{event.event_lineup?.length || 0} member</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleTogglePast(event.id, event.is_past)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          event.is_past 
                            ? 'bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-700' 
                            : 'bg-green-100 text-green-700 hover:bg-gray-200 hover:text-gray-600'
                        }`}
                        title={event.is_past ? 'Klik untuk aktifkan' : 'Klik untuk tandai selesai'}
                      >
                        {event.is_past ? '✓ Selesai' : '● Aktif'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id, event.nama)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
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
          <h1 className="text-lg md:text-2xl font-extrabold text-custom-green">
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
        <div className="container mx-auto px-4 overflow-x-auto">
          <div className="flex gap-4">
            {[
              { id: 'orders', label: 'Orders', icon: FaShoppingCart },
              { id: 'recap', label: 'Rekap', icon: FaChartBar },
              { id: 'events', label: 'Events', icon: FaCalendar },
              { id: 'settings', label: 'Settings', icon: FaEdit }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 md:px-6 md:py-4 font-semibold transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
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
      <main className="container mx-auto px-4 py-8 pb-20">
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'recap' && renderRecap()}
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

// RenderTable Component - Extracted for stability and hook usage
const RenderTable = ({ data, title, icon, emptyMessage, action, loading, onView, onDelete, onStatusChange }) => {
  const scrollContainerRef = React.useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Sync Slider -> Table
  const handleSliderChange = (e) => {
    if (scrollContainerRef.current) {
      const value = e.target.value
      const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth
      scrollContainerRef.current.scrollLeft = (value / 100) * maxScroll
      setScrollProgress(value)
    }
  }

  // Sync Table -> Slider
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      const maxScroll = scrollWidth - clientWidth
      if (maxScroll > 0) {
        setScrollProgress((scrollLeft / maxScroll) * 100)
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          {icon} {title} 
          <span className="text-sm font-normal text-gray-500 ml-2">({data.length} items)</span>
        </h3>
        {action}
      </div>
      
      <div className="relative">
        {/* Scroll Slider - Visible on Mobile/Tablet */}
        <div className="md:hidden px-4 py-2 bg-gray-50 border-b">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
             <span>Geser untuk melihat detail</span>
             <span className="flex-1 border-t border-gray-300"></span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={scrollProgress} 
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-custom-green"
          />
        </div>

        <div 
          ref={scrollContainerRef} 
          className="overflow-x-auto"
          onScroll={handleScroll}
        >
          <table className="w-full min-w-[1000px]">
            <thead className="bg-custom-green text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold">Order #</th>
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
                  <td colSpan="8" className="text-center py-8">
                    <i className="fas fa-spinner animate-spin text-3xl text-custom-green"></i>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-400">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((order) => (
                  <tr 
                    key={order.id} 
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-semibold">{order.nama_lengkap}</div>
                      <div className="text-xs text-blue-600 font-medium">{order.whatsapp && order.whatsapp !== '-' ? `WA: ${order.whatsapp}` : order.instagram && order.instagram !== '-' ? `IG: ${order.instagram}` : ''}</div>
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
                      ) : order.is_ots ? (
                         <span className={`text-xs font-bold px-2 py-1 rounded ${
                           order.payment_proof_url === 'QR' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                         }`}>
                           {order.payment_proof_url || 'Cash'}
                         </span>
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
                        onChange={(e) => onStatusChange(order.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border-2 cursor-pointer ${
                          order.status === 'pending' ? 'bg-white text-gray-600 border-gray-300' :
                          order.status === 'checked' ? 'bg-blue-100 text-blue-700 border-blue-400' :
                          'bg-green-100 text-green-700 border-green-400'
                        }`}
                      >
                        <option value="pending">Unchecked</option>
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
                          onClick={() => onView(order)}
                          className="text-blue-600 hover:text-blue-800 p-2"
                          title="Detail"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => onDelete(order.id)}
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
              <p className="text-sm text-gray-500">Instagram</p>
              <p className="font-semibold">{order.instagram || '-'}</p>
            </div>
            <div>
              {/* Email space removed or can be replaced with something else */}
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
          name: `Cheki ${formatMemberName(member.nama_panggung)}`,
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
                {/* Filter out special events - they are PO-only */}
                {events.filter(e => !e.is_special).map(event => (
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
                    {/* Scrollable Items Container - Max 3 items visible (approx 120px) */}
                    <div className="max-h-[120px] overflow-y-auto space-y-2 pr-2">
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
                    </div>
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
                    <div className="text-sm font-semibold">{formatMemberName(member.nama_panggung)}</div>
                    <div className="text-xs text-gray-500">
                      Rp {(member.member_id === 'group' ? 30000 : 25000).toLocaleString('id-ID')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse md:flex-row gap-3">
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

// Event Modal Component - Tabbed Version
const EventModal = ({ members, onClose, onSuccess, editingEvent }) => {
  const [eventType, setEventType] = useState(editingEvent?.is_special ? 'special' : 'regular')
  const [formData, setFormData] = useState(() => {
    if (editingEvent) {
      const existingLineup = editingEvent.event_lineup?.map(el => el.member_id) || []
      return {
        ...editingEvent,
        lineup: existingLineup,
        is_special: editingEvent.is_special || false,
        theme_name: editingEvent.theme_name || '',
        theme_color: editingEvent.theme_color || '#FF6B9D'
      }
    }
    return {
      nama: '', tanggal: '', bulan: '', tahun: new Date().getFullYear(),
      lokasi: '', event_time: '', cheki_time: '', is_past: false,
      is_special: false, theme_name: '', theme_color: '#FF6B9D', lineup: []
    }
  })
  const [submitting, setSubmitting] = useState(false)
  
  const presetColors = [
    '#FF6B9D', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'
  ]

  const toggleMemberInLineup = (memberId) => {
    setFormData(prev => ({
      ...prev,
      lineup: prev.lineup.includes(memberId) 
        ? prev.lineup.filter(id => id !== memberId)
        : [...prev.lineup, memberId]
    }))
  }

  // Sync eventType with is_special
  useEffect(() => {
    setFormData(prev => ({ ...prev, is_special: eventType === 'special' }))
  }, [eventType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingEvent) {
        const payload = { ...formData }
        delete payload.event_gallery
        delete payload.event_lineup
        delete payload.created_at
        delete payload.id
        
        await api.patch(`/events/${editingEvent.id}`, payload)
        Swal.fire({ icon: 'success', title: 'Event Updated!', timer: 1500, showConfirmButton: false })
      } else {
        await api.post('/events', formData)
        Swal.fire({ icon: 'success', title: 'Event Created!', timer: 1500, showConfirmButton: false })
      }
      onSuccess()
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.error || error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-custom-green text-white">
          <h3 className="text-lg font-bold">{editingEvent ? 'Edit Event' : 'Tambah Event'}</h3>
          <button onClick={onClose} className="text-xl hover:text-gray-200"><FaTimes /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            type="button"
            onClick={() => setEventType('regular')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${eventType === 'regular' ? 'bg-white border-b-2 border-custom-green text-custom-green' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📅 Event Regular
          </button>
          <button
            type="button"
            onClick={() => setEventType('special')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${eventType === 'special' ? 'bg-white border-b-2 border-pink-500 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🎀 Event Spesial
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Common Fields */}
          <input
            type="text"
            placeholder="Nama Event *"
            value={formData.nama}
            onChange={(e) => setFormData({...formData, nama: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            required
          />

          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              placeholder="Tgl"
              value={formData.tanggal}
              onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              min="1" max="31" required
            />
            <select
              value={formData.bulan}
              onChange={(e) => setFormData({...formData, bulan: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            >
              <option value="">Bulan</option>
              {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((m, i) => (
                <option key={m} value={['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][i]}>{m}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Tahun"
              value={formData.tahun}
              onChange={(e) => setFormData({...formData, tahun: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            />
          </div>

          {/* Lokasi dan Jam - hanya untuk event regular */}
          {eventType === 'regular' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Lokasi *"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Jam Event (14:00 WIB)"
                  value={formData.event_time}
                  onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Jam Cheki (15:00 - 17:00 WIB)"
                value={formData.cheki_time}
                onChange={(e) => setFormData({...formData, cheki_time: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </>
          )}

          {/* Special Event Fields */}
          {eventType === 'special' && (
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 space-y-2">
              <input
                type="text"
                placeholder="Nama Tema (Valentine Edition)"
                value={formData.theme_name}
                onChange={(e) => setFormData({...formData, theme_name: e.target.value})}
                className="w-full px-3 py-2 border border-pink-200 rounded-lg text-sm"
                required
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600 mr-1">Warna:</span>
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, theme_color: color})}
                    className={`w-6 h-6 rounded-full ${formData.theme_color === color ? 'ring-2 ring-offset-1 ring-gray-800' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-xs text-pink-600">⚠️ Event spesial hanya tersedia untuk Pre-Order</p>
            </div>
          )}

          {/* Lineup */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Lineup ({formData.lineup?.length || 0})</label>
            <div className="grid grid-cols-4 gap-1 max-h-20 overflow-y-auto border rounded-lg p-2 bg-gray-50">
              {members.filter(m => m.member_id !== 'group').map((member) => (
                <label key={member.id} className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.lineup?.includes(member.id) || false}
                    onChange={() => toggleMemberInLineup(member.id)}
                    className="w-3 h-3"
                  />
                  {formatMemberName(member.nama_panggung)}
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300">
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:bg-gray-400 ${eventType === 'special' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-custom-green hover:bg-green-700'}`}
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
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
      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        events={events}
      />
    </div>
  )
}

export default AdminPage
