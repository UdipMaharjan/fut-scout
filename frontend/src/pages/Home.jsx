import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

const Home = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [apiUsage, setApiUsage] = useState(null)

  useEffect(() => {
    loadApiUsage()
  }, [])

  const loadApiUsage = async () => {
    try {
      const data = await api.getApiUsage()
      if (data?.api_usage) {
        setApiUsage(data.api_usage)
      }
    } catch (e) {
      console.warn('Could not load API usage')
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const quickSearches = [
    { name: 'Erling Haaland', query: 'Haaland' },
    { name: 'Kylian Mbappé', query: 'Mbappé' },
    { name: 'Jude Bellingham', query: 'Bellingham' },
    { name: 'Vinícius Jr', query: 'Vinícius' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 pt-24 pb-16">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white tracking-tight">FutScout</h1>
              <p className="text-slate-500 text-sm">Football Intelligence Platform</p>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-center text-slate-400 text-xl mb-12 max-w-2xl mx-auto">
            Discover, analyze, and compare football talent from over 100 leagues worldwide
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative group">
              {/* Search Icon */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Input */}
              <input
                type="text"
                placeholder="Search players... (e.g., Haaland, Mbappé, Bellingham)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-16 pr-32 py-5 bg-[#0f172a] border-2 border-slate-800 rounded-2xl text-white text-lg placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-2xl"
              />

              {/* Search Button */}
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
              >
                <span>Search</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </form>

          {/* Quick Searches */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <span className="text-slate-500 text-sm">Popular:</span>
            {quickSearches.map(({ name, query }) => (
              <button
                key={query}
                onClick={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 text-sm hover:bg-slate-800 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-12">What You Can Do</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Search */}
          <Link
            to="/search"
            className="group p-8 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
              <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Search Players</h3>
            <p className="text-slate-400">Find players from major leagues with detailed statistics and performance data.</p>
          </Link>

          {/* Squad Builder */}
          <Link
            to="/squad-builder"
            className="group p-8 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
              <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Squad Builder</h3>
            <p className="text-slate-400">Create your dream XI with players from around the world on a visual pitch.</p>
          </Link>

          {/* Compare */}
          <Link
            to="/compare"
            className="group p-8 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-purple-500/30 transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
              <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Compare Players</h3>
            <p className="text-slate-400">Side-by-side comparison of player statistics and performance metrics.</p>
          </Link>
        </div>
      </section>

      {/* API Usage (Dev Info) */}
      {apiUsage && (
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                API Usage
              </h3>
              <span className="text-slate-500 text-sm">{apiUsage.date}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Daily Quota</span>
                  <span className="text-white font-medium">{apiUsage.used} / {apiUsage.limit}</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      apiUsage.remaining < 20 ? 'bg-red-500' : apiUsage.remaining < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(apiUsage.used / apiUsage.limit) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-400">{apiUsage.remaining}</p>
                <p className="text-slate-500 text-sm">remaining</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-white font-semibold">FutScout</span>
              <span className="text-slate-500 text-sm">• Football Intelligence</span>
            </div>
            <p className="text-slate-500 text-sm">
              Powered by API-Football
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
