import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import StatsCard from '../components/player/StatsCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

const PlayerProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [stats, setStats] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generatingReport, setGeneratingReport] = useState(false)

  useEffect(() => {
    loadPlayerData()
  }, [id])

  const loadPlayerData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [playerData, statsData] = await Promise.all([
        api.getPlayer(id),
        api.getPlayerStats(id).catch(() => null)
      ])

      setPlayer(playerData)
      setStats(statsData?.stats || null)

      // Try to load cached report
      const cachedReport = await api.getScoutReport(id)
      if (cachedReport) {
        setReport(cachedReport)
      }
    } catch (err) {
      console.error('Failed to load player:', err)
      setError('Failed to load player data. This player may not exist in the database.')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    setGeneratingReport(true)
    try {
      const data = await api.generateScoutReport(id)
      setReport(data)
    } catch (err) {
      alert('Failed to generate report: ' + err.message)
    } finally {
      setGeneratingReport(false)
    }
  }

  const positionColors = {
    GK: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    DEF: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    MID: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    ATT: 'bg-red-500/20 text-red-400 border-red-500/30',
    AM: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading player profile..." />
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <EmptyState
          icon="❌"
          title="Player Not Found"
          description={error || 'The requested player could not be found.'}
          action="Back to Search"
          onAction={() => navigate('/search')}
        />
      </div>
    )
  }

  const posGroup = player.position || 'MID'
  const positionColor = positionColors[posGroup] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  const totalStats = stats?.total || {}

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-900/20 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Player Image */}
            <div className="flex-shrink-0">
              {player.image_url ? (
                <img
                  src={player.image_url}
                  alt={player.name}
                  className="w-48 h-48 rounded-2xl object-cover border-4 border-slate-700 shadow-2xl"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="w-48 h-48 rounded-2xl bg-slate-700 flex items-center justify-center text-6xl font-bold text-slate-400 border-4 border-slate-700">
                  {player.name?.charAt(0) || '?'}
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mb-3 ${positionColor}`}>
                    {player.position || 'Unknown'}
                  </span>
                  <h1 className="text-4xl font-bold text-white">{player.name}</h1>
                  {player.team && (
                    <p className="text-xl text-emerald-400 mt-1">{player.team.name || player.team}</p>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <InfoBlock label="Age" value={player.age || 'N/A'} />
                <InfoBlock label="Nationality" value={player.nationality || 'Unknown'} />
                <InfoBlock label="Height" value={player.height_cm ? `${player.height_cm} cm` : 'N/A'} />
                <InfoBlock label="Preferred Foot" value={player.preferred_foot || 'N/A'} />
              </div>

              {/* Market Value */}
              {player.market_value_display && (
                <div className="mt-6 inline-block px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
                  <p className="text-slate-400 text-sm">Market Value</p>
                  <p className="text-emerald-400 text-2xl font-bold">{player.market_value_display}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Statistics */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Career Statistics</h2>
            {totalStats && Object.keys(totalStats).length > 0 ? (
              <StatsCard title="All Seasons Total" stats={totalStats} />
            ) : (
              <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
                <p className="text-slate-400">No statistics available for this player.</p>
              </div>
            )}
          </div>

          {/* AI Scouting Report */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">AI Scouting Report</h2>
              {!report && (
                <button
                  onClick={generateReport}
                  disabled={generatingReport}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {generatingReport ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Generate Report</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {generatingReport && (
              <div className="bg-slate-800 rounded-xl p-12 border border-slate-700">
                <LoadingSpinner size="lg" text="Generating AI scouting report..." />
              </div>
            )}

            {report && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 prose prose-invert prose-emerald max-w-none">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
                  <span className="text-slate-400 text-sm">
                    Generated by {report.model_used || 'AI'}
                  </span>
                  {report.cached && (
                    <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded">Cached</span>
                  )}
                </div>
                <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {report.content}
                </div>
              </div>
            )}

            {!report && !generatingReport && (
              <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
                <div className="text-4xl mb-3">🤖</div>
                <p className="text-slate-400">
                  Generate an AI-powered scouting report with analysis of this player's strengths, weaknesses, and potential.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 pb-8">
            <button
              onClick={() => navigate(`/compare?add=${id}`)}
              className="px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Compare with Others</span>
            </button>
            <button
              onClick={generateReport}
              disabled={generatingReport}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              Get Scouting Report
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

const InfoBlock = ({ label, value }) => (
  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
    <p className="text-slate-500 text-xs mb-1">{label}</p>
    <p className="text-white font-medium">{value}</p>
  </div>
)

export default PlayerProfile
