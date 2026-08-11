import { Link } from 'react-router-dom'

const PlayerCard = ({ player, onCompare, compact = false, showStats = false }) => {
  const {
    id,
    name,
    position,
    age,
    nationality,
    market_value,
    market_value_display,
    image_url,
    team_name,
    team_logo,
    club,
    league,
    rating,
    stats = {}
  } = player

  // Position colors based on actual position
  const positionColors = {
    GK: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    CB: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    LB: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    RB: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    CM: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    CDM: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    CAM: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
    LM: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    RM: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    LW: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    RW: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    ST: { bg: 'bg-red-500/20', text: 'text-red-400' },
    CF: { bg: 'bg-red-500/20', text: 'text-red-400' },
  }

  // Get colors for position, fallback to default
  const posStyle = positionColors[position] || { bg: 'bg-[#334155]', text: 'text-[#94a3b8]' }

  if (compact) {
    return (
      <Link
        to={`/players/${id}`}
        className="flex items-center gap-3 p-3 bg-[#0f172a] rounded-xl border border-[#1e293b] hover:border-[#10b981]/30 transition-all group"
      >
        {/* Player Image */}
        <div className="relative">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-12 h-12 rounded-lg object-cover bg-[#1e293b]"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div
            className={`w-12 h-12 rounded-lg bg-[#1e293b] flex items-center justify-center text-lg font-bold text-[#475569] ${image_url ? 'hidden' : ''}`}
          >
            {name?.charAt(0) || '?'}
          </div>
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate group-hover:text-[#10b981] transition-colors">
            {name}
          </p>
          <p className="text-[#64748b] text-xs truncate">
            {team_name || club || 'Unknown'}
          </p>
        </div>

        {/* Position Badge */}
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${posStyle.bg} ${posStyle.text}`}>
          {position || 'N/A'}
        </span>
      </Link>
    )
  }

  // Full card variant
  return (
    <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] hover:border-[#10b981]/30 transition-all overflow-hidden group">
      {/* Player Image */}
      <div className="relative h-40 bg-gradient-to-br from-[#1e293b] to-[#0f172a]">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#334155]">
            {name?.charAt(0) || '?'}
          </div>
        )}

        {/* Rating Badge */}
        {(rating || stats.rating) && (
          <div className="absolute top-3 right-3 w-10 h-10 bg-[#0f172a]/90 backdrop-blur rounded-lg flex items-center justify-center text-white font-bold text-sm border border-[#334155]">
            {rating || stats.rating}
          </div>
        )}

        {/* Position Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${posStyle.bg} ${posStyle.text}`}>
            {position || 'N/A'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <Link to={`/players/${id}`} className="block group/link">
          <h3 className="text-white font-semibold text-base truncate group-hover/link:text-[#10b981] transition-colors">
            {name}
          </h3>
        </Link>

        {/* Team */}
        <div className="flex items-center gap-2 mt-1">
          {team_logo && (
            <img src={team_logo} alt="" className="w-4 h-4" onError={(e) => e.target.style.display = 'none'} />
          )}
          <p className="text-[#64748b] text-sm truncate">
            {team_name || club || 'Free Agent'}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1e293b]">
          <div className="text-center">
            <p className="text-white font-medium text-sm">{age || '?'}</p>
            <p className="text-[#64748b] text-xs">Age</p>
          </div>
          {league && (
            <div className="text-center">
              <p className="text-[#64748b] text-xs truncate max-w-[80px]">{league}</p>
              <p className="text-[#64748b] text-xs">League</p>
            </div>
          )}
          {(market_value || market_value_display) && (
            <div className="ml-auto text-right">
              <p className="text-[#10b981] font-semibold text-sm">
                {market_value_display || market_value}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlayerCard
