import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import ExcelJS from 'exceljs'

const router = express.Router()

// GET: Fetch all orders with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, dateFrom, dateTo, search, is_ots, event_id } = req.query

    console.log('📊 Orders filter params:', { status, is_ots, event_id, search, dateFrom, dateTo })

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          item_name,
          price,
          quantity,
          member_id
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Filter by OTS
    if (is_ots !== undefined && is_ots !== 'all') {
      query = query.eq('is_ots', is_ots === 'true')
    }

    // Filter by event_id
    if (event_id && event_id !== 'all') {
      console.log('🎯 Filtering by event_id:', event_id)
      query = query.eq('event_id', event_id)
    }

    // Filter by date range
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Search by name, email, or order number
    if (search) {
      query = query.or(`nama_lengkap.ilike.%${search}%,email.ilike.%${search}%,order_number.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    console.log('✅ Orders fetched:', data?.length || 0, 'orders')

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET: Fetch single order by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          item_name,
          price,
          quantity,
          member_id
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create new order (from customer)
router.post('/', async (req, res) => {
  try {
    const { event_id, nama_lengkap, kontak, items, payment_proof_url } = req.body

    // Validate event_id
    if (!event_id) {
      return res.status(400).json({ error: 'Event ID is required' })
    }

    // Generate order number
    const orderNumber = `RB${Date.now()}`

    // Generate auto email from timestamp
    const autoEmail = `order-${Date.now()}@refreshbreeze.com`

    // Determine if kontak is phone or instagram
    const isPhone = /^[0-9+\-\s()]+$/.test(kontak)
    const whatsapp = isPhone ? kontak : '-'
    const instagram = !isPhone ? kontak : '-'

    // Calculate total
    const total_harga = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        event_id,
        nama_lengkap,
        whatsapp,
        email: autoEmail,
        instagram,
        total_harga,
        payment_proof_url,
        status: 'pending',
        created_by: 'customer'
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items
    const orderItems = items.map(item => {
      // Handle group member (member_id is string "group" not UUID)
      const memberId = (item.member_id === 'group' || typeof item.member_id === 'string' && !item.member_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))
        ? null
        : item.member_id

      return {
        order_id: order.id,
        member_id: memberId,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    res.json({ success: true, order })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create OTS (On The Spot) order by admin
router.post('/ots', authMiddleware, async (req, res) => {
  try {
    const { event_id, nama_lengkap, whatsapp, email, instagram, items, payment_method } = req.body

    if (!event_id) {
      return res.status(400).json({ error: 'Event ID is required' })
    }

    const orderNumber = `RB-OTS${Date.now()}`
    const total_harga = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        event_id,
        nama_lengkap,
        whatsapp: whatsapp || '-',
        email: email || `ots-${Date.now()}@refreshbreeze.com`,
        instagram: instagram || '-',
        total_harga,
        status: 'completed',
        is_ots: true,
        created_by: 'admin',
        payment_proof_url: payment_method || 'Cash' // Store Cash/QR here
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Handle group member ID (convert to NULL if not valid UUID)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const orderItems = items.map(item => {
      const memberId = (item.member_id === 'group' || !UUID_REGEX.test(item.member_id))
        ? null
        : item.member_id

      return {
        order_id: order.id,
        member_id: memberId,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    res.json({ success: true, order })
  } catch (error) {
    console.error('Error creating OTS order:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH: Update order status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['pending', 'checked', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET: Export orders to Excel
router.get('/export/excel', authMiddleware, async (req, res) => {
  try {
    const { dateFrom, dateTo, status, is_ots, search, event_id } = req.query

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          item_name,
          price,
          quantity
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') query = query.eq('status', status)
    if (is_ots !== undefined && is_ots !== 'all') query = query.eq('is_ots', is_ots === 'true')
    if (event_id && event_id !== 'all') query = query.eq('event_id', event_id)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo)
    if (search) query = query.or(`nama_lengkap.ilike.%${search}%,email.ilike.%${search}%,order_number.ilike.%${search}%`)

    const { data: orders, error } = await query

    if (error) throw error

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Orders')

    // Define columns (shared structure)
    worksheet.columns = [
      { header: 'Order Number', key: 'order_number', width: 22 },
      { header: 'Tipe', key: 'tipe', width: 12 },
      { header: 'Nama Lengkap', key: 'nama_lengkap', width: 25 },
      { header: 'WhatsApp', key: 'whatsapp', width: 16 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Instagram', key: 'instagram', width: 20 },
      { header: 'Items', key: 'items', width: 45 },
      { header: 'Total Harga', key: 'total_harga', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Tanggal Order', key: 'created_at', width: 20 },
      // Extra columns for summary if needed, but we'll specific cells
    ]

    // Style Header
    const styleHeader = (row) => {
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF079108' } } // Green
      row.alignment = { vertical: 'middle', horizontal: 'center' }
    }

    styleHeader(worksheet.getRow(1))

    // Helper to add orders
    const addOrderRows = (orderList) => {
      orderList.forEach(order => {
        const itemsText = order.order_items
          .map(item => `${item.item_name} (${item.quantity}x)`)
          .join(', ')

        const row = worksheet.addRow({
          order_number: order.order_number,
          tipe: order.is_ots ? 'OTS' : 'Pre-Order',
          nama_lengkap: order.nama_lengkap,
          whatsapp: order.whatsapp,
          email: order.email,
          instagram: order.instagram || '-',
          items: itemsText,
          total_harga: order.total_harga,
          status: order.status,
          created_at: new Date(order.created_at).toLocaleString('id-ID'),
        })

        // Style borders
        row.eachCell((cell) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
        })
      })
    }

    // 1. Separate Orders
    const poOrders = orders.filter(o => !o.is_ots)
    const otsOrders = orders.filter(o => o.is_ots)

    // 2. Add PO Orders
    addOrderRows(poOrders)

    // 3. Add Spacer & OTS Header
    if (otsOrders.length > 0) {
      worksheet.addRow([])
      worksheet.addRow([])
      const otsHeaderRow = worksheet.addRow(['ORDER OTS (ON THE SPOT)', '', '', '', '', '', '', '', '', ''])
      otsHeaderRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
      otsHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } } // Orange

      // Re-add column headers for clarity? Or just continue list? 
      // User said "bawah nya ots semua dan atas full po jadi kasih space". 
      // Let's just create a separator header is enough.

      addOrderRows(otsOrders)
    }

    // 4. Calculate Stats (Member Sales) - Only from PAID orders (checked/completed)
    const memberStats = {}
    const paidOrders = orders.filter(o => o.status === 'checked' || o.status === 'completed')

    paidOrders.forEach(order => {
      order.order_items.forEach(item => {
        let name = item.item_name
          .replace('Cheki ', '')
          .replace(' (Pre-Order)', '')
          .trim()

        if (name.toLowerCase().includes('all member') || name.toLowerCase().includes('group')) {
          name = 'All Member (Group)'
        }

        if (!memberStats[name]) memberStats[name] = { qty: 0, revenue: 0 }

        memberStats[name].qty += item.quantity
        memberStats[name].revenue += (item.price * item.quantity)
      })
    })

    // 5. Add Summary Section
    worksheet.addRow([])
    worksheet.addRow([])

    const summaryStartRow = worksheet.rowCount + 1
    const titleRow = worksheet.addRow(['RINGKASAN PENJUALAN', '', '', '', '', '', '', '', '', ''])
    titleRow.font = { bold: true, size: 14 }
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } } // Slate-800
    titleRow.eachCell(cell => cell.font = { bold: true, color: { argb: 'FFFFFFFF' } })

    // Summary Headers
    const summaryHeader = worksheet.addRow(['Member / Item', 'Total Qty', 'Total Rupiah', '', '', '', '', '', '', ''])
    summaryHeader.font = { bold: true }
    summaryHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    summaryHeader.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    summaryHeader.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }

    let totalQty = 0
    let totalRev = 0

    // Sort stats: Group last, others alpha or by value? Let's do alphabetical for members
    const sortedKeys = Object.keys(memberStats).sort()

    sortedKeys.forEach(key => {
      const { qty, revenue } = memberStats[key]
      totalQty += qty
      totalRev += revenue

      const row = worksheet.addRow([key, qty, `Rp ${revenue.toLocaleString('id-ID')}`, '', '', '', '', '', '', ''])
      row.getCell(1).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      row.getCell(2).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      row.getCell(3).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })

    // Grand Total Row
    const grandTotalRow = worksheet.addRow(['GRAND TOTAL', totalQty, `Rp ${totalRev.toLocaleString('id-ID')}`, '', '', '', '', '', '', ''])
    grandTotalRow.font = { bold: true }
    grandTotalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } } // Light green
    grandTotalRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }
    grandTotalRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=RefreshBreeze_Orders_${Date.now()}.xlsx`)

    await workbook.xlsx.write(res)
    res.end()

  } catch (error) {
    console.error('Error exporting to Excel:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE: Delete order
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Order deleted' })
  } catch (error) {
    console.error('Error deleting order:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE: Bulk delete orders with filters
router.post('/bulk-delete', authMiddleware, async (req, res) => {
  try {
    const { deleteType, eventId, weeks, months } = req.body

    console.log('🗑️ Bulk delete request:', { deleteType, eventId, weeks, months })

    let query = supabase.from('orders').select('id')

    // Apply filters based on delete type
    if (deleteType === 'event' && eventId) {
      query = query.eq('event_id', eventId)
    } else if (deleteType === 'weeks' && weeks) {
      const weeksAgo = new Date()
      weeksAgo.setDate(weeksAgo.getDate() - (weeks * 7))
      query = query.gte('created_at', weeksAgo.toISOString())
    } else if (deleteType === 'months' && months) {
      const monthsAgo = new Date()
      monthsAgo.setMonth(monthsAgo.getMonth() - months)
      query = query.gte('created_at', monthsAgo.toISOString())
    } else if (deleteType !== 'all') {
      return res.status(400).json({ error: 'Invalid delete type' })
    }

    // Get orders to delete
    const { data: ordersToDelete, error: selectError } = await query

    if (selectError) throw selectError

    if (!ordersToDelete || ordersToDelete.length === 0) {
      return res.json({ success: true, message: 'No orders to delete', count: 0 })
    }

    const orderIds = ordersToDelete.map(o => o.id)

    // Delete order_items first (foreign key constraint)
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .in('order_id', orderIds)

    if (itemsError) throw itemsError

    // Delete orders
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .in('id', orderIds)

    if (ordersError) throw ordersError

    console.log(`✅ Deleted ${ordersToDelete.length} orders`)

    res.json({
      success: true,
      message: `Successfully deleted ${ordersToDelete.length} orders`,
      count: ordersToDelete.length
    })
  } catch (error) {
    console.error('Error bulk deleting orders:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
