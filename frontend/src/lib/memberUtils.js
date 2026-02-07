// Shared member data for consistent emoji and color usage across all pages

export const memberData = {
    'yanyee': {
        color: '#F97316',
        emoji: '🍪',
        name: 'YanYee',
        gradient: 'from-orange-400 to-amber-500',
    },
    'sinta': {
        color: '#10B981',
        emoji: '🍃',
        name: 'Sinta',
        gradient: 'from-green-400 to-emerald-500',
    },
    'cissi': {
        color: '#F472B6',
        emoji: '👑',
        name: 'Cissi',
        gradient: 'from-pink-400 to-rose-500',
    },
    'channie': {
        color: '#34D399',
        emoji: '✨',
        name: 'Channie',
        gradient: 'from-emerald-400 to-green-500',
    },
    'acaa': {
        color: '#3B82F6',
        emoji: '💙',
        name: 'Acaa',
        gradient: 'from-blue-500 to-blue-600',
    },
    'cally': {
        color: '#A78BFA',
        emoji: '🪼',
        name: 'Cally',
        gradient: 'from-violet-400 to-purple-500',
    },
    'piya': {
        color: '#FBBF24',
        emoji: '🐰',
        name: 'Piya',
        gradient: 'from-amber-400 to-yellow-500',
    },
    'group': {
        color: '#079108',
        emoji: '💚',
        name: 'Group',
        gradient: 'from-green-500 to-emerald-600',
    }
}

// Sanitize name for lookup
export const sanitizeName = (name) => {
    if (!name) return ''
    return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Get member emoji by name
export const getMemberEmoji = (name) => {
    const clean = sanitizeName(name)
    // Handle 'aca' vs 'acaa' mismatch
    if (clean === 'aca') return memberData['acaa']?.emoji || '💚'
    return memberData[clean]?.emoji || '💚'
}

// Get member color by name
export const getMemberColor = (name) => {
    const clean = sanitizeName(name)
    if (clean === 'aca') return memberData['acaa']?.color || '#079108'
    return memberData[clean]?.color || '#079108'
}

// Get member data by name
export const getMemberData = (name) => {
    const clean = sanitizeName(name)
    if (clean === 'aca') return memberData['acaa']
    return memberData[clean] || memberData['group']
}

// Get clean member display name
export const getMemberDisplayName = (name) => {
    const clean = sanitizeName(name)
    if (clean === 'aca') return memberData['acaa']?.name || 'Unknown'
    return memberData[clean]?.name || name
}

// Format member name with emoji
export const formatMemberName = (name) => {
    const cleanName = getMemberDisplayName(name)
    const emoji = getMemberEmoji(name)
    return `${cleanName} ${emoji}`
}
