import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

const Search = () => {
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [error, setError] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Debounce search query by 400ms
  const debouncedQuery = useDebounce(query, 400)

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 3) {
      performSearch(debouncedQuery)
    } else {
      setSuggestions([])
      setShowDropdown(false)
    }
  }, [debouncedQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async (searchQuery) => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.searchPlayers(searchQuery, { limit: 8 })
      setSuggestions(data.response || [])
      setShowDropdown(true)
    } catch (err) {
      console.error('Search failed:', err)
      setError('Search unavailable')
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setQuery(e.target.value)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          navigateToPlayer(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  const navigateToPlayer = (player) => {
    setShowDropdown(false)
    setQuery('')
    navigate(`/players/${player.id}`)
  }

  const getPositionColor = (position) => {
    const colors = {
      GK: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      DEF: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      MID: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      ATT: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return colors[position] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 pt-20 pb-16">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">FutScout</h1>
          </div>

          {/* Tagline */}
          <p className="text-center text-slate-400 mb-10 text-lg">
            Discover and analyze football talent from around the world
          </p>

          {/* Search Bar */}
          <div className="relative" ref={dropdownRef}>
            <div className="relative group">
              {/* Search Icon */}
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                placeholder="Search players... (e.g., Haaland, Mbappé, Bellingham)"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => query.length >= 3 && suggestions.length > 0 && setShowDropdown(true)}
                className="w-full pl-14 pr-14 py-5 bg-[#0f172a] border-2 border-slate-800 rounded-2xl text-white text-lg placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                autoFocus
              />

              {/* Loading Spinner */}
              {loading && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              )}

              {/* Clear Button */}
              {query && !loading && (
                <button
                  onClick={() => { setQuery(''); setSuggestions([]); setShowDropdown(false); inputRef.current?.focus(); }}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 z-50">
                <div className="p-2">
                  {suggestions.map((player, index) => (
                    <button
                      key={player.id}
                      onClick={() => navigateToPlayer(player)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                        index === selectedIndex
                          ? 'bg-emerald-500/10 border border-emerald-500/30'
                          : 'hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      {/* Player Photo */}
                      <div className="relative flex-shrink-0">
                        {player.photo || player.image_url ? (
                          <img
                            src={player.photo || player.image_url}
                            alt={player.name}
                            className="w-14 h-14 rounded-xl object-cover bg-slate-800"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-14 h-14 rounded-xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-bold text-slate-500 ${
                            player.photo || player.image_url ? 'hidden' : 'flex'
                          }`}
                        >
                          {player.name?.charAt(0) || '?'}
                        </div>
                        {/* Position Badge */}
                        {player.position && (
                          <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-xs font-bold border ${getPositionColor(player.position)}`}>
                            {player.position}
                          </span>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-lg truncate group-hover:text-emerald-400 transition-colors">
                          {player.name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          {/* Team */}
                          {player.team_logo && (
                            <img src={player.team_logo} alt="" className="w-4 h-4" onError={(e) => e.target.style.display = 'none'} />
                          )}
                          <span className="text-slate-400 text-sm truncate">
                            {player.team_name || player.club || 'Unknown'}
                          </span>
                          {player.team_name && player.nationality && (
                            <span className="text-slate-600">•</span>
                          )}
                          {/* Nationality */}
                          {player.nationality && (
                            <span className="text-slate-500 text-sm">{player.nationality}</span>
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      {player.rating && (
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                          <span className="text-emerald-400 font-bold">{parseFloat(player.rating).toFixed(1)}</span>
                        </div>
                      )}

                      {/* Arrow */}
                      <svg className="w-5 h-5 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-500 text-sm">
                    {suggestions.length} result{suggestions.length !== 1 ? 's' : ''} found
                  </span>
                  <div className="flex items-center gap-4 text-slate-500 text-sm">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">↓</kbd>
                      navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">Enter</kbd>
                      select
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="absolute top-full left-0 right-0 mt-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}
          </div>

          {/* Hint */}
          <p className="text-center text-slate-500 mt-6 text-sm">
            Start typing to search across major European leagues
          </p>
        </div>
      </div>

      {/* Popular Players Section */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7m7.056-1.657A8 8 0 0118 9a8 8 0 01-2.343 5.657m-9.045 0A7 7 0 0112 5c-2.5 0-5 .5-7 2m0 0l-3-3m3 3l3-3" />
          </svg>
          Quick Access
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {['Haaland', 'Mbappé', 'Bellingham', 'Vinícius Jr', 'Pedri'].map((name) => (
            <button
              key={name}
              onClick={() => setQuery(name)}
              className="group p-4 bg-[#0f172a] border border-slate-800 rounded-xl hover:border-emerald-500/30 hover:bg-slate-800/30 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="text-white font-medium group-hover:text-emerald-400 transition-colors">{name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Search
