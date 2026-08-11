import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const SquadBuilder = () => {
  const [formation, setFormation] = useState('4-3-3')
  const [squad, setSquad] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectingPosition, setSelectingPosition] = useState(null)

  const formations = {
    '4-3-3': {
      name: '4-3-3',
      positions: [
        { id: 'GK', label: 'GK', row: 4, col: 2 },
        { id: 'LB', label: 'LB', row: 3, col: 1 },
        { id: 'CB1', label: 'CB', row: 3, col: 2 },
        { id: 'CB2', label: 'CB', row: 3, col: 3 },
        { id: 'RB', label: 'RB', row: 3, col: 4 },
        { id: 'CM1', label: 'CM', row: 2, col: 1.5 },
        { id: 'CM2', label: 'CM', row: 2, col: 2.5 },
        { id: 'CM3', label: 'CM', row: 2, col: 3.5 },
        { id: 'RW', label: 'RW', row: 1, col: 1 },
        { id: 'ST', label: 'ST', row: 1, col: 2.5 },
        { id: 'LW', label: 'LW', row: 1, col: 4 },
      ]
    },
    '4-4-2': {
      name: '4-4-2',
      positions: [
        { id: 'GK', label: 'GK', row: 4, col: 2 },
        { id: 'LB', label: 'LB', row: 3, col: 1 },
        { id: 'CB1', label: 'CB', row: 3, col: 2 },
        { id: 'CB2', label: 'CB', row: 3, col: 3 },
        { id: 'RB', label: 'RB', row: 3, col: 4 },
        { id: 'LM', label: 'LM', row: 2, col: 1 },
        { id: 'CM1', label: 'CM', row: 2, col: 2 },
        { id: 'CM2', label: 'CM', row: 2, col: 3 },
        { id: 'RM', label: 'RM', row: 2, col: 4 },
        { id: 'ST1', label: 'ST', row: 1, col: 2 },
        { id: 'ST2', label: 'ST', row: 1, col: 3 },
      ]
    },
    '4-2-3-1': {
      name: '4-2-3-1',
      positions: [
        { id: 'GK', label: 'GK', row: 4, col: 2 },
        { id: 'LB', label: 'LB', row: 3, col: 1 },
        { id: 'CB1', label: 'CB', row: 3, col: 2 },
        { id: 'CB2', label: 'CB', row: 3, col: 3 },
        { id: 'RB', label: 'RB', row: 3, col: 4 },
        { id: 'CDM1', label: 'CDM', row: 2.5, col: 1.5 },
        { id: 'CDM2', label: 'CDM', row: 2.5, col: 3.5 },
        { id: 'CAM', label: 'CAM', row: 2, col: 2.5 },
        { id: 'LW', label: 'LW', row: 1, col: 1 },
        { id: 'ST', label: 'ST', row: 1, col: 2.5 },
        { id: 'RW', label: 'RW', row: 1, col: 4 },
      ]
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const data = await api.searchPlayers(searchQuery, 15)
      setSearchResults(data.response || [])
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setSearching(false)
    }
  }

  const addPlayerToPosition = (player) => {
    if (!selectingPosition) return

    // Check for duplicates
    if (Object.values(squad).some(p => p?.id === player.id)) {
      alert('This player is already in your squad!')
      return
    }

    setSquad(prev => ({ ...prev, [selectingPosition]: player }))
    setSearchResults([])
    setSearchQuery('')
    setSelectingPosition(null)
  }

  const removePlayer = (positionId) => {
    setSquad(prev => {
      const newSquad = { ...prev }
      delete newSquad[positionId]
      return newSquad
    })
  }

  const squadCount = Object.keys(squad).length
  const isComplete = squadCount === 11

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
      ST1: 'bg-red-500/20 text-red-400',
      ST2: 'bg-red-500/20 text-red-400',
    }
    return colors[position] || 'bg-[#334155] text-[#94a3b8]'
  }

  const currentPositions = formations[formation].positions

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Header */}
      <div className="bg-[#0f172a]/80 border-b border-[#1e293b]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Squad Builder</h1>
              <p className="text-[#64748b]">
                Build your dream XI with {squadCount}/11 players
                {isComplete && <span className="text-[#10b981] ml-2">- Squad Complete!</span>}
              </p>
            </div>

            {/* Formation Selector */}
            <div className="flex items-center gap-3">
              <span className="text-[#64748b] text-sm">Formation:</span>
              <select
                value={formation}
                onChange={(e) => setFormation(e.target.value)}
                className="px-4 py-2 bg-[#0a0e17] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-[#10b981]/50"
              >
                {Object.keys(formations).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Football Pitch */}
        <div className="relative bg-gradient-to-b from-[#1a472a] via-[#228b22] to-[#1a472a] rounded-xl overflow-hidden aspect-[2/3] sm:aspect-[3/4] lg:aspect-[4/3] max-h-[600px] mx-auto">
          {/* Pitch Lines */}
          <div className="absolute inset-4 border-2 border-white/20 rounded-lg">
            {/* Center Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />
            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/20" />
            {/* Goal Box */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-16 border-2 border-white/20 border-b-0" />
            {/* Penalty Spot */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/50 rounded-full" />
          </div>

          {/* Player Positions */}
          {currentPositions.map((pos) => {
            const player = squad[pos.id]
            const topPercent = (pos.row / 5) * 100
            const leftPercent = (pos.col / 5) * 100

            return (
              <div
                key={pos.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
              >
                {player ? (
                  <div className="relative group">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-[#0f172a] border-2 border-[#10b981] shadow-lg">
                      {player.image_url ? (
                        <img
                          src={player.image_url}
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[#475569]">
                          {player.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    {/* Rating Badge */}
                    {player.rating && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#10b981] rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {player.rating}
                      </div>
                    )}
                    {/* Remove Button */}
                    <button
                      onClick={() => removePlayer(pos.id)}
                      className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {/* Player Name */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-[#0a0e17]/90 rounded text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {player.name?.split(' ').pop()}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectingPosition(pos.id)}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0a0e17]/80 border-2 border-dashed border-white/30 hover:border-[#10b981] hover:bg-[#0f172a] transition-all flex flex-col items-center justify-center"
                  >
                    <span className="text-white/50 text-lg font-bold">{pos.label}</span>
                    <span className="text-white/30 text-xs">+</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#10b981]" />
            <span className="text-[#64748b]">Filled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-dashed border-white/30" />
            <span className="text-[#64748b]">Empty</span>
          </div>
        </div>

        {/* Player Search Modal */}
        {selectingPosition && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-20 px-4">
            <div className="bg-[#0f172a] rounded-xl w-full max-w-md border border-[#1e293b] shadow-2xl">
              <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Add Player - {selectingPosition}
                </h3>
                <button
                  onClick={() => setSelectingPosition(null)}
                  className="text-[#64748b] hover:text-white"
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
                    placeholder="Search player name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-[#0a0e17] border border-[#1e293b] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#10b981]/50"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-4 py-2.5 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50"
                  >
                    {searching ? '...' : 'Search'}
                  </button>
                </div>
              </form>

              <div className="max-h-80 overflow-y-auto">
                {searchResults.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => addPlayerToPosition(player)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#1e293b] transition-colors text-left border-b border-[#1e293b]/50 last:border-0"
                  >
                    {player.image_url && (
                      <img src={player.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-[#1e293b]" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{player.name}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${getPositionColor(player.position)}`}>
                          {player.position || 'N/A'}
                        </span>
                        <span className="text-[#64748b]">{player.team_name || player.club}</span>
                      </div>
                    </div>
                    {player.rating && (
                      <span className="w-8 h-8 bg-[#10b981] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {player.rating}
                      </span>
                    )}
                  </button>
                ))}

                {searching && (
                  <div className="p-8 text-center text-[#64748b]">Searching...</div>
                )}

                {!searching && searchQuery && searchResults.length === 0 && (
                  <div className="p-8 text-center text-[#64748b]">No players found</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Squad Summary */}
        {squadCount > 0 && (
          <div className="mt-8 bg-[#0f172a] rounded-xl border border-[#1e293b] p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Squad Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {currentPositions.map((pos) => {
                const player = squad[pos.id]
                return (
                  <div
                    key={pos.id}
                    className={`p-3 rounded-lg border ${
                      player ? 'bg-[#0a0e17] border-[#1e293b]' : 'border-dashed border-[#334155]'
                    }`}
                  >
                    <p className="text-[#64748b] text-xs mb-1">{pos.id}</p>
                    {player ? (
                      <Link
                        to={`/players/${player.id}`}
                        className="flex items-center gap-2 hover:text-[#10b981] transition-colors"
                      >
                        {player.image_url && (
                          <img src={player.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        <span className="text-white text-sm font-medium truncate">{player.name}</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => setSelectingPosition(pos.id)}
                        className="text-[#475569] text-sm hover:text-[#10b981] transition-colors"
                      >
                        Empty
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SquadBuilder
