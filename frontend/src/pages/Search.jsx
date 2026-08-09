import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError(null)
    setHasSearched(true)
    setSearchParams({ q: searchQuery })

    try {
      // Try API search first
      let data
      try {
        data = await api.searchPlayers(searchQuery, 20)
      } catch (apiErr) {
        console.log('API search failed, trying local search:', apiErr)
        // Fallback to local database search
        data = await api.localSearchPlayers(searchQuery, 20)
      }

      // Extract players from response
      let players = []
      if (data.response) {
        players = Array.isArray(data.response) ? data.response : []
      } else if (data.results) {
        players = Array.isArray(data.results) ? data.results : []
      } else if (Array.isArray(data)) {
        players = data
      } else if (data.players) {
        players = Array.isArray(data.players) ? data.players : []
      }

      // Normalize player objects to have consistent structure
      players = players.map((p, idx) => ({
        id: p.id || p.player_id || idx,
        name: p.name || p.full_name || `Player ${idx}`,
        position: p.position || p.position_group || 'Unknown',
        age: p.age,
        nationality: p.nationality || p.country,
        market_value: p.market_value,
        market_value_display: p.market_value_display || p.market_value,
        image_url: p.image_url || p.photo,
        team_name: p.team_name || p.team?.name || (p.team ? (typeof p.team === 'string' ? p.team : p.team.name) : null)
      }))

      setResults(players)
    } catch (err) {
      console.error('Search failed:', err)
      setError('Failed to search players. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    performSearch(query)
  }

  const handleSavePlayer = async (player) => {
    try {
      await api.savePlayer(player.id, player.name)
      alert(`Saved ${player.name} to database!`)
    } catch (err) {
      alert(`Failed to save: ${err.message}`)
    }
  }

  const handleCompare = (player) => {
    navigate(`/compare?add=${player.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Search Header */}
      <section className="bg-slate-800 border-b border-slate-700 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Search Players</h1>
          <form onSubmit={handleSearch} className="relative">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by player name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Search Tips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-slate-400 text-sm">Popular:</span>
            {['Haaland', 'Bellingham', 'Vinicius', 'Saka', 'Pedri'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion)
                  performSearch(suggestion)
                }}
                className="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Loading State */}
          {loading && (
            <div className="py-20">
              <LoadingSpinner size="lg" text="Searching players..." />
            </div>
          )}

          {/* Error State */}
          {error && (
            <EmptyState
              icon="❌"
              title="Search Failed"
              description={error}
              action="Try Again"
              onAction={() => performSearch(query)}
            />
          )}

          {/* No Results */}
          {!loading && !error && hasSearched && results.length === 0 && (
            <EmptyState
              icon="🔍"
              title="No Players Found"
              description={`No players found matching "${query}". Try a different search term.`}
            />
          )}

          {/* Initial State */}
          {!loading && !error && !hasSearched && (
            <EmptyState
              icon="⚽"
              title="Start Your Search"
              description="Enter a player name above to search our database."
            />
          )}

          {/* Results Grid */}
          {!loading && results.length > 0 && (
            <>
              <p className="text-slate-400 mb-6">
                Found <span className="text-white font-semibold">{results.length}</span> players for "{query}"
              </p>
              <div className="space-y-4">
                {results.map((player, index) => (
                  <div key={`${player.id}-${index}`} className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-start gap-4">
                      {/* Player Image */}
                      {player.image_url ? (
                        <img
                          src={player.image_url}
                          alt={player.name}
                          className="w-16 h-16 rounded-xl object-cover bg-slate-700"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400">
                          {player.name?.charAt(0) || '?'}
                        </div>
                      )}

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{player.name}</h3>
                            <p className="text-slate-400 text-sm">{player.position || 'Unknown position'}</p>
                          </div>
                          {player.market_value && (
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">
                              {player.market_value}
                            </span>
                          )}
                        </div>

                        {/* Additional Info */}
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                          {player.age && <span>Age: {player.age}</span>}
                          {player.nationality && <span>🇺🇳 {player.nationality}</span>}
                          {player.team_name && <span>🏟️ {player.team_name}</span>}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleSavePlayer(player)}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            Save to DB
                          </button>
                          <button
                            onClick={() => handleCompare(player)}
                            className="px-4 py-2 bg-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors"
                          >
                            Add to Compare
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Search
