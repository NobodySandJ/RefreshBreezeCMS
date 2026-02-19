import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// GET: Fetch all events
router.get('/', async (req, res) => {
  try {
    const { is_past } = req.query

    let query = supabase
      .from('events')
      .select(`
        *,
        event_lineup (
          member_id,
          members (
            id,
            member_id,
            nama_panggung,
            image_url
          )
        ),
        event_gallery (
          id,
          tipe,
          path,
          kredit
        )
      `)
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })
      .order('tanggal', { ascending: false })

    if (is_past !== undefined) {
      query = query.eq('is_past', is_past === 'true')
    }

    const { data, error } = await query

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET: Fetch single event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_lineup (
          member_id,
          members (
            id,
            member_id,
            nama_panggung,
            image_url
          )
        ),
        event_gallery (
          id,
          tipe,
          path,
          kredit
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching event:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create new event (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nama, tanggal, bulan, tahun, lokasi, event_time, cheki_time, is_past, type, theme_name, theme_color, lineup } = req.body

    // Insert event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        nama,
        tanggal,
        bulan,
        tahun,
        lokasi,
        event_time,
        cheki_time,
        is_past,
        type: type || 'regular',
        is_special: type === 'special',
        theme_name: type === 'special' ? theme_name : null,
        theme_color: type === 'special' ? theme_color : null
      })
      .select()
      .single()

    if (eventError) throw eventError

    // Insert lineup if provided
    if (lineup && lineup.length > 0) {
      const lineupData = lineup.map(member_id => ({
        event_id: event.id,
        member_id
      }))

      const { error: lineupError } = await supabase
        .from('event_lineup')
        .insert(lineupData)

      if (lineupError) throw lineupError
    }

    res.json({ success: true, data: event })
  } catch (error) {
    console.error('Error creating event:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH: Update event
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { lineup, ...updates } = req.body

    // Sync is_special with type if type is updated
    if (updates.type) {
      updates.is_special = updates.type === 'special'
    }

    // Update event basic info
    const { data: event, error: eventError } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (eventError) throw eventError

    // Update lineup if provided
    if (lineup !== undefined) {
      // Delete existing lineup
      await supabase
        .from('event_lineup')
        .delete()
        .eq('event_id', id)

      // Insert new lineup
      if (lineup.length > 0) {
        const lineupData = lineup.map(member_id => ({
          event_id: id,
          member_id
        }))

        await supabase
          .from('event_lineup')
          .insert(lineupData)
      }
    }

    res.json({ success: true, data: event })
  } catch (error) {
    console.error('Error updating event:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE: Delete event
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Event deleted' })
  } catch (error) {
    console.error('Error deleting event:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
