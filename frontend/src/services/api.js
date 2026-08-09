const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = {
  // Health check
  async health() {
    const res = await fetch(`${API_BASE}/api/health`)
    return res.json()
  },

  // Search players via API
  async searchPlayers(query, limit = 10) {
    const res = await fetch(`${API_BASE}/api/players/search?q=${encodeURIComponent(query)}&limit=${limit}`)
    if (!res.ok) throw new Error('Search failed')
    return res.json()
  },

  // List players from database
  async listPlayers(params = {}) {
    const { q, position, teamId, page = 1, limit = 20 } = params
    let url = `${API_BASE}/api/players?page=${page}&limit=${limit}`
    if (q) url += `&q=${encodeURIComponent(q)}`
    if (position) url += `&position=${encodeURIComponent(position)}`
    if (teamId) url += `&team_id=${teamId}`

    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch players')
    return res.json()
  },

  // Get player details
  async getPlayer(id) {
    const res = await fetch(`${API_BASE}/api/players/${id}`)
    if (!res.ok) throw new Error('Player not found')
    return res.json()
  },

  // Get player stats
  async getPlayerStats(id, season) {
    let url = `${API_BASE}/api/players/${id}/stats`
    if (season) url += `?season=${season}`

    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch stats')
    return res.json()
  },

  // Compare players
  async comparePlayers(id1, id2) {
    const res = await fetch(`${API_BASE}/api/compare/${id1}/${id2}`)
    if (!res.ok) throw new Error('Comparison failed')
    return res.json()
  },

  // Generate scouting report
  async generateScoutReport(playerId) {
    const res = await fetch(`${API_BASE}/api/scout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId })
    })
    if (!res.ok) throw new Error('Failed to generate report')
    return res.json()
  },

  // Get cached scouting report
  async getScoutReport(playerId) {
    const res = await fetch(`${API_BASE}/api/scout/${playerId}`)
    if (!res.ok) return null
    return res.json()
  },

  // Save player to database
  async savePlayer(id, name) {
    const res = await fetch(`${API_BASE}/api/players/${id}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    if (!res.ok) throw new Error('Failed to save player')
    return res.json()
  },

  // List teams
  async listTeams(params = {}) {
    const { league, page = 1, limit = 20 } = params
    let url = `${API_BASE}/api/teams?page=${page}&limit=${limit}`
    if (league) url += `&league=${encodeURIComponent(league)}`

    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch teams')
    return res.json()
  }
}

export default api
