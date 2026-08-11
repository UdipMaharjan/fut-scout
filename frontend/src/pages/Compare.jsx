import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

const Compare = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [addingTo, setAddingTo] = useState(null)

  useEffect(() => {
    const addId = searchParams.get('add')
    if (addId && players.length < 2) {
      loadPlayerById(addId)
    }
  }, [searchParams])

  const loadPlayerById = async (id) => {
    try {
      const data = await api.getPlayer(id)
      if (!players.find(p => p.id === data.id)) {
        setPlayers(prev => [...prev.slice(0, 2), data].slice(0, 2))
      }
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
      setSearchResults(data.response || [])
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setSearching(false)
    }
  }

  const addPlayer = (player) => {
    if (players.length < 2 && !players.find(p => p.id === player.id)) {
      setPlayers(prev => [...prev, player])
      setSearchResults([])
      setSearchQuery('')
      setAddingTo(null)
    }
  }

  const removePlayer = (index) => {
    setPlayers(prev => prev.filter((_, i) => i !== index))
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
      LW: 'bg-orange-500/20 text-orange-400',
      RW: 'bg-orange-500/20 text-orange-400',
      ST: 'bg-red-500/20 text-red-400',
      CF: 'bg-red-500/20 text-red-400',
    }
    return colors[position] || 'bg-[#334155] text-[#94a3b8]'
  }

  const compareStats = [
    { key: 'age', label: 'Age', format: v => `${v} yrs`, higher: false },
    { key: 'rating', label: 'Rating', higher: true },
    { key: 'stats.goals', label: 'Goals', higher: true },
    { key: 'stats.assists', label: 'Assists', higher: true },
    { key: 'height_cm', label: 'Height', format: v => `${v} cm`, higher: true },
  ]

  const getWinner = (stat) => {
    if (players.length !== 2) return null
    const p1 = stat.key.includes('.')
      ? players[0]?.[stat.key.split('.')[0]]?.[stat.key.split('.')[1]]
      : players[0]?.[stat.key]
    const p2 = stat.key.includes('.')
      ? players[1]?.[stat.key.split('.')[0]]?.[stat.key.split('.')[1]]
      : players[1]?.[stat.key]
    if (!p1 && !p2) return null
    if (!p1) return 1
    if (!p2) return 0
    if (p1 === p2) return 'tie'
    return (stat.higher ? p1 > p2 : p1 < p2) ? 0 : 1
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Header */}
      <div className="bg-[#0f172a]/80 border-b border-[#1e293b]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-white mb-2">Compare Players</h1>
          <p className="text-[#64748b]">Select two players to compare their stats and attributes</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Player Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[0, 1].map((index) => (
            <div key={index} className="bg-[#0f172a] rounded-xl border border-[#1e293b] overflow-hidden">
              {players[index] ? (
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#1e293b]">
                        {players[index].image_url ? (
                          <img
                            src={players[index].image_url}
                            alt={players[index].name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#475569]">
                            {players[index].name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      {players[index].rating && (
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#10b981] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {players[index].rating}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{players[index].name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPositionColor(players[index].position)}`}>
                          {players[index].position || 'N/A'}
                        </span>
                        <span className="text-[#64748b] text-sm">{players[index].age || '?'} yrs</span>
                      </div>
                      <p className="text-[#10b981] text-sm mt-2">{players[index].team_name || players[index].club}</p>
                      {players[index].market_value && (
                        <p className="text-[#64748b] text-sm">{players[index].market_value}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removePlayer(index)}
                      className="p-2 text-[#64748b] hover:text-red-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {addingTo === index ? (
                    <form onSubmit={handleSearch}>
                      <input
                        type="text"
                        placeholder="Search player..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0a0e17] border border-[#1e293b] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#10b981]/50"
                        autoFocus
                      />
                      {searchResults.length > 0 && (
                        <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                          {searchResults.map((player) => (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => addPlayer(player)}
                              className="w-full flex items-center gap-3 p-2 bg-[#1e293b] rounded-lg hover:bg-[#334155] transition-colors text-left"
                            >
                              {player.image_url && (
                                <img src={player.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                              )}
                              <div>
                                <p className="text-white text-sm">{player.name}</p>
                                <p className="text-[#64748b] text-xs">{player.team_name || player.club}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searching && <p className="text-[#64748b] text-sm mt-2">Searching...</p>}
                    </form>
                  ) : (
                    <button
                      onClick={() => setAddingTo(index)}
                      className="w-full py-8 border-2 border-dashed border-[#1e293b] rounded-lg text-[#64748b] hover:border-[#10b981]/50 hover:text-[#10b981] transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Player {index + 1}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        {players.length === 2 && (
          <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] overflow-hidden">
            <div className="p-6 border-b border-[#1e293b]">
              <h3 className="text-lg font-semibold text-white">Statistics Comparison</h3>
            </div>
            <div className="divide-y divide-[#1e293b]">
              {compareStats.map((stat) => {
                const winner = getWinner(stat)
                const p1Val = stat.key.includes('.')
                  ? players[0]?.[stat.key.split('.')[0]]?.[stat.key.split('.')[1]]
                  : players[0]?.[stat.key]
                const p2Val = stat.key.includes('.')
                  ? players[1]?.[stat.key.split('.')[0]]?.[stat.key.split('.')[1]]
                  : players[1]?.[stat.key]

                return (
                  <div key={stat.key} className="grid grid-cols-3">
                    <div className={`p-4 text-center ${winner === 0 ? 'bg-[#10b981]/10' : ''}`}>
                      <p className="text-white font-medium">
                        {stat.format ? stat.format(p1Val) : p1Val || '-'}
                      </p>
                    </div>
                    <div className="p-4 text-center bg-[#1e293b]/30">
                      <p className="text-[#64748b] text-sm">{stat.label}</p>
                    </div>
                    <div className={`p-4 text-center ${winner === 1 ? 'bg-[#10b981]/10' : ''}`}>
                      <p className="text-white font-medium">
                        {stat.format ? stat.format(p2Val) : p2Val || '-'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {players.length < 2 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-[#1e293b] flex items-center justify-center text-4xl mx-auto mb-4">?</div>
            <h3 className="text-xl font-semibold text-white mb-2">Select Two Players</h3>
            <p className="text-[#64748b] max-w-md mx-auto">
              Add two players above to see a detailed comparison of their stats and attributes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Compare
