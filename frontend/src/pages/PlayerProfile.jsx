import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

const PlayerProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('stats')
  const [season, setSeason] = useState(2024)
  const [availableSeasons, setAvailableSeasons] = useState([])

  useEffect(() => {
    loadPlayerData()
  }, [id, season])

  const loadPlayerData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get player data
      const playerData = await api.getPlayer(id, season)
      setPlayer(playerData)

      // Get detailed stats
      try {
        const statsData = await api.getPlayerStats(id, season)
        setStats(statsData)
      } catch (e) {
        console.warn('Could not load detailed stats:', e)
      }

      // Get available seasons
      if (availableSeasons.length === 0) {
        try {
          const seasonsData = await api.getPlayerSeasons(id)
          setAvailableSeasons(seasonsData.seasons || [])
        } catch (e) {
          console.warn('Could not load seasons:', e)
        }
      }
    } catch (err) {
      console.error('Failed to load player:', err)
      setError('Failed to load player data.')
    } finally {
      setLoading(false)
    }
  }

  const getPositionColor = (position) => {
    const colors = {
      GK: { bg: 'from-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
      DEF: { bg: 'from-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
      MID: { bg: 'from-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      ATT: { bg: 'from-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    }
    return colors[position] || { bg: 'from-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400">Loading player profile...</p>
        </div>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Player Not Found</h3>
          <p className="text-slate-400 mb-6">{error || 'The requested player could not be found.'}</p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Players
          </Link>
        </div>
      </div>
    )
  }

  const posStyle = getPositionColor(player.position)
  const totalStats = stats?.stats?.total || player.stats?.total || {}

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Hero Header */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${posStyle.bg} to-transparent opacity-30`} />
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Player Image */}
            <div className="relative">
              <div className="w-44 h-44 lg:w-52 lg:h-52 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 shadow-2xl">
                {player.image_url || player.photo ? (
                  <img
                    src={player.image_url || player.photo}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-slate-600 bg-slate-800">
                    {player.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              {/* Rating Badge */}
              {player.rating && (
                <div className="absolute -bottom-3 -right-3 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg flex items-center gap-2">
                  <span className="text-white/60 text-sm">Rating</span>
                  <span className="text-white font-bold text-xl">{parseFloat(player.rating).toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 pt-2">
              {/* Position & Name */}
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${posStyle.bg} ${posStyle.text} ${posStyle.border}`}>
                  {player.position || player.position_raw || 'Unknown'}
                </span>
                {player.age && (
                  <span className="text-slate-400 text-sm">{player.age} years</span>
                )}
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                {player.name}
              </h1>

              {/* Team */}
              <div className="flex items-center gap-4 mb-6">
                {player.team_logo && (
                  <img
                    src={player.team_logo}
                    alt={player.team_name}
                    className="w-8 h-8"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                <span className="text-xl text-emerald-400 font-medium">
                  {player.team_name || 'Free Agent'}
                </span>
                {player.league_name && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{player.league_name}</span>
                  </>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {player.nationality && (
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <p className="text-slate-500 text-xs mb-1">Nationality</p>
                    <p className="text-white font-medium">{player.nationality}</p>
                  </div>
                )}
                {player.height_cm && (
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <p className="text-slate-500 text-xs mb-1">Height</p>
                    <p className="text-white font-medium">{player.height_cm} cm</p>
                  </div>
                )}
                {player.weight && (
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <p className="text-slate-500 text-xs mb-1">Weight</p>
                    <p className="text-white font-medium">{player.weight}</p>
                  </div>
                )}
                {player.date_of_birth && (
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <p className="text-slate-500 text-xs mb-1">Born</p>
                    <p className="text-white font-medium">{player.date_of_birth}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Season Selector */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-6">
            {/* Tabs */}
            <div className="flex gap-1">
              {['stats', 'info'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-4 text-sm font-medium capitalize transition-all relative ${
                    activeTab === tab
                      ? 'text-emerald-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-3">
              <span className="text-slate-500 text-sm">Season:</span>
              <select
                value={season}
                onChange={(e) => setSeason(parseInt(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {availableSeasons.length > 0 ? (
                  availableSeasons.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))
                ) : (
                  <option value={2024}>2024</option>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Key Stats */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
                <span className="w-1 h-6 bg-emerald-500 rounded-full" />
                {season} Season Statistics
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                <StatCard label="Appearances" value={totalStats.appearances || 0} icon="👕" />
                <StatCard label="Goals" value={totalStats.goals || 0} icon="⚽" highlight />
                <StatCard label="Assists" value={totalStats.assists || 0} icon="🅰️" />
                <StatCard label="Minutes" value={totalStats.minutes || 0} icon="⏱️" />
                <StatCard label="Yellow Cards" value={totalStats.yellow_cards || 0} icon="🟨" />
                <StatCard label="Red Cards" value={totalStats.red_cards || 0} icon="🟥" />
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Detailed Statistics</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                <StatDetail label="Shots" value={totalStats.shots_total} />
                <StatDetail label="Shots on Target" value={totalStats.shots_on} />
                <StatDetail label="Passes" value={totalStats.passes_total} />
                <StatDetail label="Key Passes" value={totalStats.passes_key} />
                <StatDetail label="Tackles" value={totalStats.tackles_total} />
                <StatDetail label="Duels Won" value={totalStats.duels_won} />
                <StatDetail label="Dribbles" value={totalStats.dribbles_success} />
                <StatDetail label="Avg Rating" value={totalStats.rating_avg ? totalStats.rating_avg.toFixed(2) : null} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-emerald-500 rounded-full" />
              Player Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Full Name" value={player.name} />
              <InfoRow label="Position" value={player.position || player.position_raw} />
              <InfoRow label="Age" value={player.age ? `${player.age} years` : null} />
              <InfoRow label="Nationality" value={player.nationality} />
              <InfoRow label="Date of Birth" value={player.date_of_birth} />
              <InfoRow label="Height" value={player.height_cm ? `${player.height_cm} cm` : null} />
              <InfoRow label="Weight" value={player.weight} />
              <InfoRow label="Club" value={player.team_name} />
              <InfoRow label="League" value={player.league_name} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mt-8">
          <button
            onClick={() => navigate(`/compare?add=${id}`)}
            className="px-5 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-all flex items-center gap-2 border border-slate-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Compare Player
          </button>
          <button
            onClick={() => navigate('/search')}
            className="px-5 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-all flex items-center gap-2 border border-slate-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search More
          </button>
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ label, value, icon, highlight }) => (
  <div className={`bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 ${highlight ? 'border-emerald-500/30' : ''}`}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-lg">{icon}</span>
      <span className="text-slate-500 text-xs">{label}</span>
    </div>
    <p className={`text-3xl font-bold ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value || 0}</p>
  </div>
)

const StatDetail = ({ label, value }) => (
  <div className="text-center">
    <p className="text-2xl font-bold text-emerald-400">{value || '-'}</p>
    <p className="text-slate-500 text-sm">{label}</p>
  </div>
)

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-800 last:border-0">
    <span className="text-slate-500">{label}</span>
    <span className="text-white font-medium">{value || '-'}</span>
  </div>
)

export default PlayerProfile
