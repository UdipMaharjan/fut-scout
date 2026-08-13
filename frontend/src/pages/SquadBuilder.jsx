import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2']

const POSITIONS = {
  '4-3-3': {
    GK: { x: 50, y: 90 },
    LB: { x: 15, y: 70 },
    CB1: { x: 35, y: 72 },
    CB2: { x: 65, y: 72 },
    RB: { x: 85, y: 70 },
    CM1: { x: 30, y: 50 },
    CM2: { x: 50, y: 45 },
    CM3: { x: 70, y: 50 },
    LW: { x: 20, y: 25 },
    ST: { x: 50, y: 20 },
    RW: { x: 80, y: 25 },
  },
  '4-4-2': {
    GK: { x: 50, y: 90 },
    LB: { x: 12, y: 68 },
    CB1: { x: 35, y: 72 },
    CB2: { x: 65, y: 72 },
    RB: { x: 88, y: 68 },
    LM: { x: 12, y: 45 },
    CM1: { x: 35, y: 48 },
    CM2: { x: 65, y: 48 },
    RM: { x: 88, y: 45 },
    ST1: { x: 35, y: 20 },
    ST2: { x: 65, y: 20 },
  },
  '4-2-3-1': {
    GK: { x: 50, y: 90 },
    LB: { x: 12, y: 68 },
    CB1: { x: 35, y: 72 },
    CB2: { x: 65, y: 72 },
    RB: { x: 88, y: 68 },
    CDM1: { x: 35, y: 55 },
    CDM2: { x: 65, y: 55 },
    CAM: { x: 50, y: 38 },
    LW: { x: 20, y: 25 },
    RW: { x: 80, y: 25 },
    ST: { x: 50, y: 15 },
  },
  '3-5-2': {
    GK: { x: 50, y: 90 },
    CB1: { x: 25, y: 72 },
    CB2: { x: 50, y: 70 },
    CB3: { x: 75, y: 72 },
    LWB: { x: 8, y: 48 },
    CM1: { x: 30, y: 48 },
    CM2: { x: 50, y: 45 },
    CM3: { x: 70, y: 48 },
    RWB: { x: 92, y: 48 },
    ST1: { x: 35, y: 20 },
    ST2: { x: 65, y: 20 },
  },
  '5-3-2': {
    GK: { x: 50, y: 90 },
    LWB: { x: 8, y: 65 },
    CB1: { x: 28, y: 70 },
    CB2: { x: 50, y: 68 },
    CB3: { x: 72, y: 70 },
    RWB: { x: 92, y: 65 },
    CM1: { x: 25, y: 42 },
    CM2: { x: 50, y: 40 },
    CM3: { x: 75, y: 42 },
    ST1: { x: 35, y: 18 },
    ST2: { x: 65, y: 18 },
  },
}

const POSITION_LABELS = {
  GK: 'GK', LB: 'LB', CB1: 'CB', CB2: 'CB', CB3: 'CB',
  RB: 'RB', CM1: 'CM', CM2: 'CM', CM3: 'CM',
  LM: 'LM', RM: 'RM', CDM1: 'CDM', CDM2: 'CDM',
  LW: 'LW', RW: 'RW', ST: 'ST', ST1: 'ST', ST2: 'ST',
  CAM: 'CAM', LWB: 'LWB', RWB: 'RWB'
}

const SquadBuilder = () => {
  const navigate = useNavigate()
  const [squad, setSquad] = useState({})
  const [formation, setFormation] = useState('4-3-3')
  const [showPlayerSearch, setShowPlayerSearch] = useState(false)
  const [searchTargetSlot, setSearchTargetSlot] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const searchInputRef = useRef(null)

  // Position colors
  const getPositionColor = (posKey) => {
    const label = POSITION_LABELS[posKey] || posKey
    const colors = {
      GK: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
      DEF: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
      MID: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
      ATT: 'bg-red-500/20 border-red-500/50 text-red-400',
    }
    if (label === 'GK') return colors.GK
    if (['LB', 'CB', 'RB', 'LWB', 'RWB'].includes(label)) return colors.DEF
    if (['CM', 'CDM', 'LM', 'RM', 'CAM'].includes(label)) return colors.MID
    if (['LW', 'RW', 'ST'].includes(label)) return colors.ATT
    return 'bg-slate-500/20 border-slate-500/50 text-slate-400'
  }

  const openPlayerSearch = (slot) => {
    setSearchTargetSlot(slot)
    setShowPlayerSearch(true)
    setSearchQuery('')
    setSearchResults([])
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  const closePlayerSearch = () => {
    setShowPlayerSearch(false)
    setSearchTargetSlot(null)
    setSearchQuery('')
    setSearchResults([])
  }

  const addPlayerToSlot = (player) => {
    setSquad(prev => ({
      ...prev,
      [searchTargetSlot]: player
    }))
    closePlayerSearch()
  }

  const removePlayer = (slot) => {
    setSquad(prev => {
      const newSquad = { ...prev }
      delete newSquad[slot]
      return newSquad
    })
  }

  const getPositionForSlot = (slot) => {
    const label = POSITION_LABELS[slot] || slot
    if (label === 'GK') return 'Goalkeeper'
    if (['LB', 'CB', 'RB', 'LWB', 'RWB'].includes(label)) return 'Defender'
    if (['CM', 'CDM', 'LM', 'RM', 'CAM'].includes(label)) return 'Midfielder'
    return 'Attacker'
  }

  // Search with debouncing
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await api.searchPlayers(searchQuery, { limit: 10 })
        setSearchResults(data.response || [])
      } catch (err) {
        console.error('Search failed:', err)
        setSearchResults([])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const filledSlots = Object.keys(squad).length

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </div>
                Squad Builder
              </h1>
              <p className="text-slate-400 mt-1">Build your dream XI with players from around the world</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Formation Selector */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">Formation:</span>
                <select
                  value={formation}
                  onChange={(e) => {
                    setFormation(e.target.value)
                    setSquad({})
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  {FORMATIONS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Squad Count */}
              <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
                <span className="text-white font-medium">{filledSlots}</span>
                <span className="text-slate-400"> / 11 Players</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pitch */}
          <div className="lg:col-span-2">
            <div className="relative aspect-[3/4] max-h-[700px] mx-auto w-full">
              {/* Pitch Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/30 to-emerald-800/30 rounded-2xl border-2 border-emerald-700/50 overflow-hidden">
                {/* Pitch Lines */}
                <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Outer Box */}
                  <rect x="5" y="70" width="90" height="25" fill="none" stroke="white" strokeWidth="0.5" />
                  {/* Goal Box */}
                  <rect x="25" y="85" width="50" height="12" fill="none" stroke="white" strokeWidth="0.5" />
                  {/* Center Circle */}
                  <circle cx="50" cy="50" r="12" fill="none" stroke="white" strokeWidth="0.5" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="0.5" />
                  {/* Penalty Spot */}
                  <circle cx="50" cy="88" r="0.5" fill="white" />
                </svg>

                {/* Player Slots */}
                {Object.entries(POSITIONS[formation]).map(([slot, pos]) => {
                  const player = squad[slot]
                  const slotLabel = POSITION_LABELS[slot] || slot

                  return (
                    <div
                      key={slot}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      {player ? (
                        <div className="relative group">
                          {/* Player Card */}
                          <div className={`w-16 h-20 sm:w-20 sm:h-24 rounded-xl border-2 ${getPositionColor(slot)} bg-slate-900/90 backdrop-blur shadow-xl overflow-hidden transition-all group-hover:scale-105 cursor-pointer`}
                            onClick={() => removePlayer(slot)}
                          >
                            <div className="w-full h-2/3 bg-slate-800 flex items-center justify-center overflow-hidden">
                              {player.photo || player.image_url ? (
                                <img
                                  src={player.photo || player.image_url}
                                  alt={player.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <span className="text-2xl font-bold text-slate-600">{player.name?.charAt(0)}</span>
                              )}
                            </div>
                            <div className="h-1/3 flex flex-col items-center justify-center p-1">
                              <span className="text-xs font-bold text-white truncate w-full text-center">{player.name?.split(' ').pop()}</span>
                              <span className={`text-[10px] font-medium ${getPositionColor(slot).split(' ')[2]}`}>{slotLabel}</span>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              removePlayer(slot)
                            }}
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        /* Empty Slot */
                        <button
                          onClick={() => openPlayerSearch(slot)}
                          className={`w-16 h-20 sm:w-20 sm:h-24 rounded-xl border-2 border-dashed ${getPositionColor(slot)} bg-slate-900/50 backdrop-blur flex flex-col items-center justify-center gap-1 hover:bg-slate-800/70 transition-all`}
                        >
                          <span className={`text-lg font-bold ${getPositionColor(slot).split(' ')[2]}`}>{slotLabel}</span>
                          <svg className={`w-5 h-5 ${getPositionColor(slot).split(' ')[2]} opacity-60`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Squad List */}
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Your Squad</h3>

              {filledSlots === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">
                  Click on a position above to add players
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Goalkeepers */}
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Goalkeeper</p>
                    {Object.entries(squad).filter(([slot]) => POSITION_LABELS[slot] === 'GK').map(([slot, player]) => (
                      <SquadPlayerRow key={slot} player={player} position={POSITION_LABELS[slot]} onRemove={() => removePlayer(slot)} />
                    ))}
                  </div>

                  {/* Defenders */}
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-4">Defenders</p>
                    {Object.entries(squad).filter(([slot]) => ['LB', 'CB', 'RB', 'LWB', 'RWB'].includes(POSITION_LABELS[slot])).map(([slot, player]) => (
                      <SquadPlayerRow key={slot} player={player} position={POSITION_LABELS[slot]} onRemove={() => removePlayer(slot)} />
                    ))}
                  </div>

                  {/* Midfielders */}
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-4">Midfielders</p>
                    {Object.entries(squad).filter(([slot]) => ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(POSITION_LABELS[slot])).map(([slot, player]) => (
                      <SquadPlayerRow key={slot} player={player} position={POSITION_LABELS[slot]} onRemove={() => removePlayer(slot)} />
                    ))}
                  </div>

                  {/* Attackers */}
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-4">Attackers</p>
                    {Object.entries(squad).filter(([slot]) => ['LW', 'RW', 'ST'].includes(POSITION_LABELS[slot])).map(([slot, player]) => (
                      <SquadPlayerRow key={slot} player={player} position={POSITION_LABELS[slot]} onRemove={() => removePlayer(slot)} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear Button */}
            {filledSlots > 0 && (
              <button
                onClick={() => setSquad({})}
                className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all border border-slate-700"
              >
                Clear Squad
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Player Search Modal */}
      {showPlayerSearch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Add Player</h3>
                <p className="text-sm text-slate-400">
                  Position: <span className={`font-medium ${getPositionColor(searchTargetSlot).split(' ')[2]}`}>{POSITION_LABELS[searchTargetSlot]}</span>
                </p>
              </div>
              <button
                onClick={closePlayerSearch}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for a player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                {loading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="px-4 pb-4 max-h-80 overflow-y-auto">
              {searchQuery.length < 3 ? (
                <p className="text-slate-500 text-sm text-center py-8">Type at least 3 characters to search</p>
              ) : searchResults.length === 0 && !loading ? (
                <p className="text-slate-500 text-sm text-center py-8">No players found</p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((player) => {
                    const isAlreadyAdded = Object.values(squad).some(p => p?.id === player.id)
                    return (
                      <button
                        key={player.id}
                        onClick={() => !isAlreadyAdded && addPlayerToSlot(player)}
                        disabled={isAlreadyAdded}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          isAlreadyAdded
                            ? 'bg-slate-800/50 opacity-50 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-slate-700 border border-transparent hover:border-emerald-500/30'
                        }`}
                      >
                        {/* Player Image */}
                        <div className="w-12 h-12 rounded-lg bg-slate-700 flex-shrink-0 overflow-hidden">
                          {player.photo || player.image_url ? (
                            <img
                              src={player.photo || player.image_url}
                              alt={player.name}
                              className="w-full h-full object-cover"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-500">
                              {player.name?.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium">{player.name}</p>
                          <p className="text-slate-400 text-sm">
                            {player.team_name || 'Unknown'} • {player.nationality}
                          </p>
                        </div>

                        {/* Position & Status */}
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPositionColor(player.position)}`}>
                            {player.position}
                          </span>
                          {isAlreadyAdded && (
                            <p className="text-xs text-slate-500 mt-1">Already in squad</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const SquadPlayerRow = ({ player, position, onRemove }) => (
  <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg group">
    <div className="w-8 h-8 rounded bg-slate-700 flex-shrink-0 overflow-hidden">
      {player.photo || player.image_url ? (
        <img
          src={player.photo || player.image_url}
          alt={player.name}
          className="w-full h-full object-cover"
          onError={(e) => e.target.style.display = 'none'}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-500">
          {player.name?.charAt(0)}
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white text-sm font-medium truncate">{player.name}</p>
      <p className="text-slate-500 text-xs">{player.team_name}</p>
    </div>
    <span className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-700 rounded">
      {position}
    </span>
    <button
      onClick={onRemove}
      className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
)

export default SquadBuilder
