// Use relative paths for development proxy
// For production, set VITE_API_URL to full backend URL
const API_BASE = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== ''
  ? import.meta.env.VITE_API_URL
  : ''

// Frontend-side cache for session
const localCache = {
  _cache: new Map(),
  _maxAge: 5 * 60 * 1000, // 5 minutes

  get(key) {
    const item = this._cache.get(key)
    if (!item) return null
    if (Date.now() - item.timestamp > this._maxAge) {
      this._cache.delete(key)
      return null
    }
    return item.data
  },

  set(key, data) {
    this._cache.set(key, { data, timestamp: Date.now() })
  },

  clear() {
    this._cache.clear()
  }
}

const api = {
  // Health check
  async health() {
    const res = await fetch(`${API_BASE}/api/health`)
    return res.json()
  },

  // Get API usage stats
  async getApiUsage() {
    const res = await fetch(`${API_BASE}/api/stats`)
    if (!res.ok) return null
    return res.json()
  },

  // ==========================================
  // PLAYER ENDPOINTS
  // ==========================================

  // Search players via API-Football
  async searchPlayers(query, options = {}) {
    const { league, season = 2024, limit = 20 } = options
    const cacheKey = `search:${query}:${league}:${season}`

    // Check local cache first
    const cached = localCache.get(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    let url = `${API_BASE}/api/players/search?q=${encodeURIComponent(query)}&limit=${limit}&season=${season}`
    if (league) url += `&league=${league}`

    const res = await fetch(url)
    if (!res.ok) throw new Error('Search failed')
    const data = await res.json()

    // Cache locally
    localCache.set(cacheKey, data)

    return { ...data, cached: false }
  },

  // List players from database
  async listPlayers(params = {}) {
    const { q, position, teamId, league, season = 2024, page = 1, limit = 20 } = params
    let url = `${API_BASE}/api/players?page=${page}&limit=${limit}&season=${season}`
    if (q) url += `&q=${encodeURIComponent(q)}`
    if (position) url += `&position=${encodeURIComponent(position)}`
    if (teamId) url += `&team_id=${teamId}`
    if (league) url += `&league=${league}`

    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch players')
    return res.json()
  },

  // Get player details
  async getPlayer(id, season = 2024) {
    const cacheKey = `player:${id}:${season}`

    // Check local cache
    const cached = localCache.get(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    const res = await fetch(`${API_BASE}/api/players/${id}?season=${season}`)
    if (!res.ok) throw new Error('Player not found')
    const data = await res.json()

    // Cache locally
    localCache.set(cacheKey, data)

    return { ...data, cached: false }
  },

  // Get player stats
  async getPlayerStats(id, season = 2024) {
    const cacheKey = `stats:${id}:${season}`

    // Check local cache
    const cached = localCache.get(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    const res = await fetch(`${API_BASE}/api/players/${id}/stats?season=${season}`)
    if (!res.ok) throw new Error('Failed to fetch stats')
    const data = await res.json()

    // Cache locally
    localCache.set(cacheKey, data)

    return { ...data, cached: false }
  },

  // Get available seasons for a player
  async getPlayerSeasons(id) {
    const cacheKey = `seasons:${id}`

    // Check local cache
    const cached = localCache.get(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    const res = await fetch(`${API_BASE}/api/players/${id}/seasons`)
    if (!res.ok) throw new Error('Failed to fetch seasons')
    const data = await res.json()

    // Cache locally
    localCache.set(cacheKey, data)

    return { ...data, cached: false }
  },

  // Clear local cache
  clearCache() {
    localCache.clear()
  },

  // ==========================================
  // TEAM ENDPOINTS
  // ==========================================

  // Search teams
  async searchTeams(query) {
    const res = await fetch(`${API_BASE}/api/teams/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error('Search failed')
    return res.json()
  },

  // Get team details
  async getTeam(id) {
    const res = await fetch(`${API_BASE}/api/teams/${id}`)
    if (!res.ok) throw new Error('Team not found')
    return res.json()
  },

  // Get team squad
  async getTeamSquad(id, season = 2024) {
    const res = await fetch(`${API_BASE}/api/teams/${id}/squad?season=${season}`)
    if (!res.ok) throw new Error('Failed to fetch squad')
    return res.json()
  },

  // ==========================================
  // LEAGUE ENDPOINTS
  // ==========================================

  // List leagues
  async listLeagues(params = {}) {
    const { season = 2024, country } = params
    let url = `${API_BASE}/api/leagues?season=${season}`
    if (country) url += `&country=${encodeURIComponent(country)}`

    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch leagues')
    return res.json()
  },

  // Get league standings
  async getLeagueStandings(id, season = 2024) {
    const res = await fetch(`${API_BASE}/api/leagues/${id}/standings?season=${season}`)
    if (!res.ok) throw new Error('Failed to fetch standings')
    return res.json()
  },

  // ==========================================
  // COMPARE & SCOUT ENDPOINTS
  // ==========================================

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
  }
}

export default api
