import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
    inputRef.current?.focus()
  }, [])

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError(null)
    setHasSearched(true)
    setSearchParams({ q: searchQuery })

    try {
      const data = await api.searchPlayers(searchQuery, 20)

      let players = []
      if (data.response) {
        players = Array.isArray(data.response) ? data.response : []
      } else if (data.results) {
        players = Array.isArray(data.results) ? data.results : []
      } else if (Array.isArray(data)) {
        players = data
      }

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

  const handleCompare = (player) => {
    navigate(`/compare?add=${player.id}`)
  }

  const getPositionColor = (position) => {
    const colors = {
      GK: 'bg-amber-500/20 text-amber-400',
      CB: 'bg-blue-500/20 text-blue-400',
      LB: 'bg-blue-500/20 text-blue-400',
      RB: 'bg-blue-500/20 text-blue-400',
      CM: 'bg-emerald-500/20 text-emerald-400',
      CDM: 'bg-emerald-500/20 text-emerald-400',
      CAM: 'bg-purple-500/20 text-purple-400',
      LM: 'bg-emerald-500/20 text-emerald-400',
      RM: 'bg-emerald-500/20 text-emerald-400',
      LW: 'bg-orange-500/20 text-orange-400',
      RW: 'bg-orange-500/20 text-orange-400',
      ST: 'bg-red-500/20 text-red-400',
      CF: 'bg-red-500/20 text-red-400',
    }
    return colors[position] || 'bg-[#334155] text-[#94a3b8]'
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Header Section */}
      <div className="bg-[#0f172a]/80 border-b border-[#1e293b]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-6">Search Players</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <input
              ref={inputRef}
              type="text"
              placeholder="Search players..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-24 py-3.5 bg-[#0a0e17] border border-[#1e293b] rounded-xl text-white text-base placeholder-[#64748b] focus:outline-none focus:border-[#10b981]/50 focus:ring-2 focus:ring-[#10b981]/20 transition-all"
              autoFocus
            />

            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-medium rounded-lg hover:from-[#059669] hover:to-[#047857] transition-all disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-[#94a3b8]">
              <svg className="animate-spin h-5 w-5 text-[#10b981]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Searching players...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-3xl mx-auto mb-4">!</div>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => performSearch(query)}
              className="px-4 py-2 bg-[#1e293b] text-white rounded-lg hover:bg-[#334155] transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && hasSearched && results.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#1e293b] flex items-center justify-center text-3xl mx-auto mb-4">?</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Players Found</h3>
            <p className="text-[#64748b]">
              No players found matching "{query}". Try a different search term.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!loading && !error && !hasSearched && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-[#1e293b] flex items-center justify-center text-4xl mx-auto mb-4">?</div>
            <h3 className="text-xl font-semibold text-white mb-2">Search for Players</h3>
            <p className="text-[#64748b] max-w-md mx-auto">
              Enter a player name above to discover talent from leagues around the world.
            </p>
          </div>
        )}

        {/* Results Header */}
        {!loading && results.length > 0 && (
          <div className="mb-6">
            <p className="text-[#94a3b8]">
              Found <span className="text-white font-semibold">{results.length}</span> players for{' '}
              <span className="text-[#10b981]">"{query}"</span>
            </p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map((player, index) => (
              <Link
                key={`${player.id}-${index}`}
                to={`/players/${player.id}`}
                className="group bg-[#0f172a] rounded-xl border border-[#1e293b] hover:border-[#10b981]/30 transition-all overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Player Image */}
                <div className="relative h-40 bg-gradient-to-br from-[#1e293b] to-[#0f172a]">
                  {player.image_url ? (
                    <img
                      src={player.image_url}
                      alt={player.name}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#334155]">
                      {player.name?.charAt(0) || '?'}
                    </div>
                  )}
                  {/* Rating Badge */}
                  {player.rating && (
                    <div className="absolute top-3 right-3 w-10 h-10 bg-[#0f172a]/90 backdrop-blur rounded-lg flex items-center justify-center text-white font-bold text-sm border border-[#334155]">
                      {player.rating}
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-base truncate group-hover:text-[#10b981] transition-colors">
                    {player.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1">
                    {player.team_logo && (
                      <img src={player.team_logo} alt="" className="w-4 h-4" onError={(e) => e.target.style.display = 'none'} />
                    )}
                    <span className="text-[#64748b] text-sm truncate">{player.team_name || player.club || 'Unknown'}</span>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#1e293b]">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPositionColor(player.position)}`}>
                      {player.position || 'N/A'}
                    </span>
                    <span className="text-[#64748b] text-xs">{player.age || '?'} years</span>
                    {player.market_value_display && (
                      <span className="text-[#10b981] text-xs font-medium ml-auto">
                        {player.market_value_display}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}

export default Search
