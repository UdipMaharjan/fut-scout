import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

const Compare = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [comparison, setComparison] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    const addId = searchParams.get('add')
    if (addId && !players.find(p => p.id === parseInt(addId))) {
      loadPlayerForCompare(parseInt(addId))
    }
  }, [searchParams])

  const loadPlayerForCompare = async (playerId) => {
    try {
      const data = await api.getPlayer(playerId)
      setPlayers(prev => [...prev, data])
    } catch (err) {
      console.error('Failed to load player:', err)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const data = await api.searchPlayers(searchQuery, 10)
      setSearchResults(data.response || data.results || data || [])
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setSearching(false)
    }
  }

  const addPlayer = async (player) => {
    if (players.length >= 4) {
      alert('Maximum 4 players can be compared.')
      return
    }
    if (players.find(p => p.id === player.id)) {
      alert('Player already added.')
      return
    }

    try {
      const data = await api.getPlayer(player.id)
      setPlayers(prev => [...prev, data])
      setShowSearch(false)
      setSearchQuery('')
      setSearchResults([])
    } catch (err) {
      alert('Failed to add player: ' + err.message)
    }
  }

  const removePlayer = (playerId) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId))
    setComparison(null)
  }

  const comparePlayers = async () => {
    if (players.length < 2) {
      alert('Select at least 2 players to compare.')
      return
    }

    setLoading(true)
    try {
      const data = await api.comparePlayers(players[0].id, players[1].id)
      setComparison(data)
    } catch (err) {
      alert('Comparison failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const comparisonStats = [
    { key: 'goals', label: 'Goals', format: (v) => v || 0 },
    { key: 'assists', label: 'Assists', format: (v) => v || 0 },
    { key: 'appearances', label: 'Appearances', format: (v) => v || 0 },
    { key: 'goals_per_90', label: 'Goals/90', format: (v) => v?.toFixed(2) || '0.00' },
    { key: 'assists_per_90', label: 'Assists/90', format: (v) => v?.toFixed(2) || '0.00' },
    { key: 'yellow_cards', label: 'Yellow Cards', format: (v) => v || 0 },
    { key: 'red_cards', label: 'Red Cards', format: (v) => v || 0 }
  ]

  const getPlayerStats = (player) => {
    if (comparison) {
      const compPlayer = comparison.players?.find(p => p.id === player.id)
      return compPlayer?.stats?.total || {}
    }
    return player.stats?.total || {}
  }

  const getStatWinner = (statKey) => {
    if (players.length < 2) return null
    const stats0 = getPlayerStats(players[0])
    const stats1 = getPlayerStats(players[1])
    const val0 = stats0[statKey] || 0
    const val1 = stats1[statKey] || 0

    if (val0 === val1) return 'tie'
    // For cards, lower is better
    if (statKey.includes('card')) {
      return val0 < val1 ? 0 : 1
    }
    return val0 > val1 ? 0 : 1
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <section className="bg-slate-800 border-b border-slate-700 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Compare Players</h1>

          {/* Player Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[0, 1, 2, 3].map(index => (
              <PlayerSlot
                key={index}
                player={players[index]}
                onRemove={() => players[index] && removePlayer(players[index].id)}
                onAdd={() => setShowSearch(true)}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowSearch(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Player</span>
            </button>

            <button
              onClick={comparePlayers}
              disabled={players.length < 2 || loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )}
              <span>Compare</span>
            </button>

            <button
              onClick={() => {
                setPlayers([])
                setComparison(null)
              }}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </section>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-lg border border-slate-700 shadow-2xl">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Add Player</h3>
              <button
                onClick={() => setShowSearch(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSearch} className="p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search for a player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {searching ? '...' : 'Search'}
                </button>
              </div>
            </form>

            <div className="max-h-96 overflow-y-auto">
              {searchResults.map((player, index) => (
                <button
                  key={`${player.id}-${index}`}
                  onClick={() => addPlayer(player)}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-slate-700 transition-colors text-left"
                >
                  {player.image_url ? (
                    <img
                      src={player.image_url}
                      alt={player.name}
                      className="w-10 h-10 rounded-full object-cover bg-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                      {player.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{player.name}</p>
                    <p className="text-slate-400 text-sm truncate">{player.position || 'Unknown'}</p>
                  </div>
                  <span className="text-emerald-400">+</span>
                </button>
              ))}

              {searching && (
                <div className="p-8">
                  <LoadingSpinner />
                </div>
              )}

              {!searching && searchQuery && searchResults.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  No players found
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {players.length < 2 ? (
            <EmptyState
              icon="⚖️"
              title="Select Players to Compare"
              description="Add at least 2 players above to see a detailed comparison."
            />
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              {/* Player Headers */}
              <div className="grid" style={{ gridTemplateColumns: `200px repeat(${players.length}, 1fr)` }}>
                <div className="bg-slate-750 p-4 border-b border-r border-slate-700"></div>
                {players.map(player => (
                  <div key={player.id} className="p-4 border-b border-slate-700 text-center">
                    <Link to={`/players/${player.id}`} className="block group">
                      {player.image_url ? (
                        <img
                          src={player.image_url}
                          alt={player.name}
                          className="w-16 h-16 rounded-full mx-auto object-cover bg-slate-700 mb-2"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full mx-auto bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400 mb-2">
                          {player.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <p className="text-white font-semibold group-hover:text-emerald-400 truncate">
                        {player.name}
                      </p>
                      <p className="text-slate-400 text-sm">{player.position || 'N/A'}</p>
                    </Link>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="mt-2 text-slate-500 hover:text-red-400 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Stats Rows */}
              {comparisonStats.map(({ key, label, format }) => {
                const winner = getStatWinner(key)
                return (
                  <div
                    key={key}
                    className="grid border-b border-slate-700/50 hover:bg-slate-750/50 transition-colors"
                    style={{ gridTemplateColumns: `200px repeat(${players.length}, 1fr)` }}
                  >
                    <div className="p-4 border-r border-slate-700 flex items-center">
                      <span className="text-slate-400 font-medium">{label}</span>
                    </div>
                    {players.map((player, idx) => {
                      const stats = getPlayerStats(player)
                      const value = format(stats[key])
                      const isWinner = winner === idx
                      const isTie = winner === 'tie'

                      return (
                        <div
                          key={player.id}
                          className={`p-4 text-center font-semibold ${
                            isWinner ? 'text-emerald-400' : isTie ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {value}
                          {isWinner && players.length > 1 && (
                            <span className="ml-2 text-xs">★</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}

          {/* Comparison Explanation */}
          {comparison && (
            <div className="mt-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">AI Analysis</h3>
              <p className="text-slate-300 leading-relaxed">
                {comparison.comparison ? (
                  Object.entries(comparison.comparison).map(([key, data]) => (
                    <div key={key} className="mb-2">
                      <span className="font-medium text-emerald-400">{key}:</span> {data.winner} has the edge.
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400">Select players and click Compare to see detailed analysis.</span>
                )}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

const PlayerSlot = ({ player, onRemove, onAdd }) => {
  if (player) {
    return (
      <div className="relative bg-slate-800 rounded-xl border border-slate-700 p-4">
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
        >
          ×
        </button>
        {player.image_url ? (
          <img
            src={player.image_url}
            alt={player.name}
            className="w-16 h-16 rounded-full mx-auto object-cover bg-slate-700 mb-2"
          />
        ) : (
          <div className="w-16 h-16 rounded-full mx-auto bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400 mb-2">
            {player.name?.charAt(0) || '?'}
          </div>
        )}
        <p className="text-white font-medium text-center truncate">{player.name}</p>
        <p className="text-slate-400 text-sm text-center">{player.position || 'N/A'}</p>
      </div>
    )
  }

  return (
    <button
      onClick={onAdd}
      className="bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-600 p-4 hover:border-emerald-500/50 hover:bg-slate-800 transition-all"
    >
      <div className="w-16 h-16 rounded-full mx-auto bg-slate-700/50 flex items-center justify-center mb-2">
        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <p className="text-slate-500 text-sm text-center">Add Player</p>
    </button>
  )
}

export default Compare
