import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

const PlayerProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadPlayerData()
  }, [id])

  const loadPlayerData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Try to get comprehensive player data
      let playerData
      try {
        playerData = await api.getPlayerFull(id)
      } catch {
        playerData = await api.getPlayer(id)
      }
      setPlayer(playerData)
    } catch (err) {
      console.error('Failed to load player:', err)
      setError('Failed to load player data.')
    } finally {
      setLoading(false)
    }
  }

  const getPositionColor = (position) => {
    const colors = {
      GK: { bg: 'bg-amber-500/20', text: 'text-amber-400', ring: 'from-amber-500/20' },
      CB: { bg: 'bg-blue-500/20', text: 'text-blue-400', ring: 'from-blue-500/20' },
      LB: { bg: 'bg-blue-500/20', text: 'text-blue-400', ring: 'from-blue-500/20' },
      RB: { bg: 'bg-blue-500/20', text: 'text-blue-400', ring: 'from-blue-500/20' },
      CM: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'from-emerald-500/20' },
      CDM: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'from-emerald-500/20' },
      CAM: { bg: 'bg-purple-500/20', text: 'text-purple-400', ring: 'from-purple-500/20' },
      LW: { bg: 'bg-orange-500/20', text: 'text-orange-400', ring: 'from-orange-500/20' },
      RW: { bg: 'bg-orange-500/20', text: 'text-orange-400', ring: 'from-orange-500/20' },
      ST: { bg: 'bg-red-500/20', text: 'text-red-400', ring: 'from-red-500/20' },
      CF: { bg: 'bg-red-500/20', text: 'text-red-400', ring: 'from-red-500/20' },
    }
    return colors[position] || { bg: 'bg-[#334155]', text: 'text-[#94a3b8]', ring: 'from-[#334155]' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#94a3b8]">
          <svg className="animate-spin h-6 w-6 text-[#10b981]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading player profile...</span>
        </div>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-3xl mx-auto mb-4">!</div>
          <h3 className="text-xl font-semibold text-white mb-2">Player Not Found</h3>
          <p className="text-[#64748b] mb-4">{error || 'The requested player could not be found.'}</p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all"
          >
            Back to Search
          </Link>
        </div>
      </div>
    )
  }

  const posStyle = getPositionColor(player.position)

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Hero Header */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${posStyle.ring} to-transparent opacity-40`} />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#10b981]/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#94a3b8] hover:text-white mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Player Image */}
            <div className="relative">
              <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-2xl overflow-hidden bg-[#0f172a] border-4 border-[#1e293b] shadow-2xl">
                {player.image_url ? (
                  <img
                    src={player.image_url}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-[#334155]">
                    {player.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              {/* Rating Badge */}
              {player.rating && (
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg border-4 border-[#0a0e17]">
                  {player.rating}
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 pt-4">
              {/* Position Badge */}
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${posStyle.bg} ${posStyle.text} border-current/20 mb-3`}>
                {player.position || 'Unknown Position'}
              </span>

              {/* Name */}
              <h1 className="text-4xl lg:text-5xl font-bold text-white">
                {player.name}
              </h1>

              {/* Team */}
              <div className="flex items-center gap-3 mt-3">
                {player.team_logo && (
                  <img
                    src={player.team_logo}
                    alt={player.team_name}
                    className="w-6 h-6"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                <span className="text-lg text-[#10b981] font-medium">
                  {player.team_name || player.club || 'Free Agent'}
                </span>
                {player.league && (
                  <>
                    <span className="text-[#475569]">•</span>
                    <span className="text-[#64748b]">{player.league}</span>
                  </>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <div className="bg-[#0f172a]/50 rounded-lg p-3 border border-[#1e293b]">
                  <p className="text-[#64748b] text-xs">Age</p>
                  <p className="text-white font-semibold">{player.age || 'N/A'}</p>
                </div>
                <div className="bg-[#0f172a]/50 rounded-lg p-3 border border-[#1e293b]">
                  <p className="text-[#64748b] text-xs">Nationality</p>
                  <p className="text-white font-semibold truncate">{player.nationality?.split(' ')[0] || 'Unknown'}</p>
                </div>
                <div className="bg-[#0f172a]/50 rounded-lg p-3 border border-[#1e293b]">
                  <p className="text-[#64748b] text-xs">Height</p>
                  <p className="text-white font-semibold">{player.height_cm ? `${player.height_cm} cm` : 'N/A'}</p>
                </div>
                <div className="bg-[#0f172a]/50 rounded-lg p-3 border border-[#1e293b]">
                  <p className="text-[#64748b] text-xs">Preferred Foot</p>
                  <p className="text-white font-semibold">{player.preferred_foot || 'N/A'}</p>
                </div>
              </div>

              {/* Market Value */}
              {player.market_value && (
                <div className="mt-6 inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-[#10b981]/20 to-transparent border border-[#10b981]/30 rounded-xl">
                  <p className="text-[#64748b] text-sm">Market Value</p>
                  <p className="text-[#10b981] text-2xl font-bold">{player.market_value}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="border-b border-[#1e293b] sticky top-16 z-10 bg-[#0a0e17]/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1">
            {['overview', 'attributes', 'career'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium capitalize transition-all relative ${
                  activeTab === tab
                    ? 'text-[#10b981]'
                    : 'text-[#64748b] hover:text-white'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#10b981] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            {(player.stats?.goals > 0 || player.stats?.assists > 0) && (
              <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Current Season</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-[#0a0e17] rounded-lg">
                    <p className="text-3xl font-bold text-[#10b981]">{player.stats.goals || 0}</p>
                    <p className="text-[#64748b] text-sm">Goals</p>
                  </div>
                  <div className="text-center p-4 bg-[#0a0e17] rounded-lg">
                    <p className="text-3xl font-bold text-blue-400">{player.stats.assists || 0}</p>
                    <p className="text-[#64748b] text-sm">Assists</p>
                  </div>
                  <div className="text-center p-4 bg-[#0a0e17] rounded-lg">
                    <p className="text-3xl font-bold text-white">{player.stats.goals + player.stats.assists || 0}</p>
                    <p className="text-[#64748b] text-sm">Contributions</p>
                  </div>
                  <div className="text-center p-4 bg-[#0a0e17] rounded-lg">
                    <p className="text-3xl font-bold text-amber-400">{player.stats.yellow_cards || 0}</p>
                    <p className="text-[#64748b] text-sm">Yellow Cards</p>
                  </div>
                </div>
              </div>
            )}

            {/* Player Info Card */}
            <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Player Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Full Name" value={player.name} />
                <InfoRow label="Position" value={player.position} />
                <InfoRow label="Age" value={player.age ? `${player.age} years` : 'N/A'} />
                <InfoRow label="Nationality" value={player.nationality} />
                <InfoRow label="Date of Birth" value={player.date_of_birth || 'N/A'} />
                <InfoRow label="Height" value={player.height_cm ? `${player.height_cm} cm` : 'N/A'} />
                <InfoRow label="Preferred Foot" value={player.preferred_foot || 'N/A'} />
                <InfoRow label="Club" value={player.team_name || player.club || 'N/A'} />
                <InfoRow label="League" value={player.league || 'N/A'} />
                <InfoRow label="Market Value" value={player.market_value || 'N/A'} />
                {player.contract_until && <InfoRow label="Contract Until" value={player.contract_until} />}
                {player.shirt_number && <InfoRow label="Shirt Number" value={`#${player.shirt_number}`} />}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attributes' && (
          <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Player Attributes</h3>
            <div className="space-y-4">
              <AttributeBar label="Overall" value={player.rating || 70} />
              <AttributeBar label="Age" value={Math.max(0, 100 - (parseInt(player.age) || 25) + 25)} />
              <AttributeBar label="Market Value" value={player.market_value ? 85 : 50} />
              <AttributeBar label="Goals per Season" value={player.stats?.goals ? Math.min(100, player.stats.goals * 10) : 40} />
              <AttributeBar label="Assists per Season" value={player.stats?.assists ? Math.min(100, player.stats.assists * 10) : 40} />
            </div>
            <p className="text-[#64748b] text-sm mt-6">
              * Attribute bars are calculated based on available data. Some values may be estimates.
            </p>
          </div>
        )}

        {activeTab === 'career' && (
          <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Career Summary</h3>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#1e293b] flex items-center justify-center text-3xl mx-auto mb-4">?</div>
              <p className="text-[#64748b]">
                Detailed career history requires additional data sources.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mt-8">
          <button
            onClick={() => navigate(`/compare?add=${id}`)}
            className="px-6 py-3 bg-[#1e293b] text-white rounded-xl font-medium hover:bg-[#334155] transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Compare Player
          </button>
        </div>
      </div>
    </div>
  )
}

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-[#1e293b] last:border-0">
    <span className="text-[#64748b]">{label}</span>
    <span className="text-white font-medium">{value || 'N/A'}</span>
  </div>
)

const AttributeBar = ({ label, value }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-[#94a3b8] text-sm">{label}</span>
      <span className="text-white font-medium text-sm">{value}</span>
    </div>
    <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  </div>
)

export default PlayerProfile
