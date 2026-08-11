import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../services/api'

const Home = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleQuickSearch = (name) => {
    navigate(`/search?q=${encodeURIComponent(name)}`)
  }

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: 'Smart Search',
      description: 'Search across thousands of players from major leagues worldwide'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Player Analysis',
      description: 'View detailed statistics and performance metrics'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Compare Players',
      description: 'Side-by-side comparison with detailed breakdowns'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI Insights',
      description: 'Get AI-powered scouting reports and analysis'
    }
  ]

  const stats = [
    { value: '50K+', label: 'Players' },
    { value: '30+', label: 'Leagues' },
    { value: '20+', label: 'Countries' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#10b981]/10 rounded-full blur-[120px]" />
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0e17]/50 to-[#0a0e17]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#10b981]/10 border border-[#10b981]/20 rounded-full text-[#10b981] text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
              </span>
              Live Data from RapidAPI
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              The Future of
              <br />
              <span className="bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#6ee7b7] bg-clip-text text-transparent">
                Football Scouting
              </span>
            </h1>
            <p className="text-lg text-[#94a3b8] max-w-2xl mx-auto">
              AI-powered platform for discovering, analyzing and comparing football players worldwide
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="relative group">
              {/* Search Icon */}
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#64748b] group-hover:text-[#10b981] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <input
                type="text"
                placeholder="Search players (e.g. Bellingham, Wirtz, Musiala)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-32 py-4 bg-[#0f172a]/80 backdrop-blur-xl border border-[#1e293b] rounded-xl text-white text-base placeholder-[#64748b] focus:outline-none focus:border-[#10b981]/50 focus:ring-2 focus:ring-[#10b981]/20 transition-all"
              />

              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold rounded-lg hover:from-[#059669] hover:to-[#047857] transition-all shadow-lg shadow-emerald-500/20"
              >
                Search
              </button>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <span className="text-[#64748b] text-sm">Popular:</span>
              {['Haaland', 'Mbappe', 'Bellingham', 'Musiala'].map((name) => (
                <button
                  key={name}
                  onClick={() => handleQuickSearch(name)}
                  className="px-3 py-1 text-sm bg-[#1e293b]/50 text-[#94a3b8] rounded-lg hover:text-[#10b981] hover:bg-[#1e293b] transition-all border border-transparent hover:border-[#334155]"
                >
                  {name}
                </button>
              ))}
            </div>
          </form>

          {/* Stats Cards */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="px-6 py-3 bg-[#0f172a]/50 backdrop-blur rounded-xl border border-[#1e293b]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[#10b981]">{stat.value}</span>
                  <span className="text-[#64748b] text-sm">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-[#0f172a]/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-[#0f172a] rounded-xl border border-[#1e293b] hover:border-[#10b981]/30 transition-all hover:bg-[#0f172a]/80"
              >
                <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center mb-4 group-hover:bg-[#10b981]/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#10b981] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-[#10b981]/10 via-transparent to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to find your next star?</h2>
          <p className="text-[#94a3b8] text-lg mb-8 max-w-xl mx-auto">
            Start exploring players and unlock AI-powered insights to build your perfect squad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/search"
              className="px-8 py-4 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold rounded-xl hover:from-[#059669] hover:to-[#047857] transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Players
            </Link>
            <Link
              to="/squad-builder"
              className="px-8 py-4 bg-[#1e293b] text-white font-semibold rounded-xl hover:bg-[#334155] transition-all border border-[#334155] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Build Squad
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
