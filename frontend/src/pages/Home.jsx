import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../services/api'
import PlayerCard from '../components/player/PlayerCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const Home = () => {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadPlayers()
    loadStats()
  }, [])

  const loadPlayers = async () => {
    try {
      const data = await api.listPlayers({ limit: 8 })
      setPlayers(data.players || [])
    } catch (error) {
      console.error('Failed to load players:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await api.health()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900/20 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
            AI-Powered <span className="text-emerald-400">Football Scouting</span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Discover, analyze, and compare football players with advanced AI insights powered by Groq.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search for players (e.g., Haaland, Bellingham...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-6 py-4 bg-slate-800/80 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleSearchClick}
                className="px-8 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-400">{players.length}+</p>
              <p className="text-slate-400">Players in DB</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-400">AI</p>
              <p className="text-slate-400">Powered Insights</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-400">5</p>
              <p className="text-slate-400">Top Leagues</p>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Featured Players */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Featured Players</h2>
              <p className="text-slate-400 mt-1">Browse some of our database entries</p>
            </div>
            <Link
              to="/search"
              className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="py-20">
              <LoadingSpinner size="lg" text="Loading players..." />
            </div>
          ) : players.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {players.map(player => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg mb-4">No players in database yet.</p>
              <Link
                to="/search"
                className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Search for Players
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🔍"
              title="Player Search"
              description="Search across thousands of players from major leagues worldwide with detailed profiles."
            />
            <FeatureCard
              icon="📊"
              title="Statistics"
              description="View comprehensive player stats including goals, assists, appearances, and per-90 metrics."
            />
            <FeatureCard
              icon="🤖"
              title="AI Scouting"
              description="Get AI-generated scouting reports powered by Groq's LLM technology."
            />
            <FeatureCard
              icon="⚖️"
              title="Player Comparison"
              description="Compare multiple players side-by-side with detailed statistical breakdowns."
            />
            <FeatureCard
              icon="🔄"
              title="Similar Players"
              description="Find players with similar profiles and playing styles using ML similarity scoring."
            />
            <FeatureCard
              icon="💾"
              title="Smart Caching"
              description="Fast responses with intelligent caching of API data and AI-generated reports."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to scout?</h2>
          <p className="text-emerald-100 text-lg mb-8">
            Start exploring players and unlock AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/search"
              className="px-8 py-4 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors"
            >
              Search Players
            </Link>
            <Link
              to="/compare"
              className="px-8 py-4 bg-emerald-800 text-white font-semibold rounded-xl hover:bg-emerald-900 transition-colors"
            >
              Compare Players
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 hover:border-emerald-500/30 transition-all">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-slate-400 text-sm">{description}</p>
  </div>
)

export default Home
