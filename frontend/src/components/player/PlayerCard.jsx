import { Link } from 'react-router-dom'

const PlayerCard = ({ player, onCompare, compact = false }) => {
  const {
    id,
    name,
    position,
    age,
    nationality,
    market_value_display,
    image_url,
    team
  } = player

  const positionColors = {
    GK: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    DEF: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    MID: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    ATT: 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  const positionColor = positionColors[position] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'

  if (compact) {
    return (
      <Link
        to={`/players/${id}`}
        className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-all hover:bg-slate-750"
      >
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-10 h-10 rounded-full object-cover bg-slate-700"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
            {name?.charAt(0) || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{name}</p>
          <p className="text-slate-400 text-sm truncate">{team?.name || 'Unknown Team'}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs border ${positionColor}`}>
          {position || 'N/A'}
        </span>
      </Link>
    )
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
      {/* Image Header */}
      <div className="relative h-32 bg-gradient-to-br from-slate-700 to-slate-800">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent" />

        {/* Position Badge */}
        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium border ${positionColor}`}>
          {position || 'Unknown'}
        </span>

        {/* Player Image */}
        <div className="absolute -bottom-12 left-4">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-24 h-24 rounded-xl border-4 border-slate-800 object-cover bg-slate-700 shadow-xl"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-24 h-24 rounded-xl border-4 border-slate-800 bg-slate-700 flex items-center justify-center text-3xl font-bold text-slate-400">
              {name?.charAt(0) || '?'}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-14 px-4 pb-4">
        <Link to={`/players/${id}`} className="block group">
          <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
            {name}
          </h3>
        </Link>

        <p className="text-slate-400 text-sm truncate mt-1">
          {team?.name || 'Free Agent'}
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <InfoItem label="Age" value={age || 'N/A'} />
          <InfoItem label="Nationality" value={nationality || 'Unknown'} />
        </div>

        {/* Market Value */}
        {market_value_display && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-slate-400 text-xs">Market Value</p>
            <p className="text-emerald-400 font-bold text-lg">{market_value_display}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link
            to={`/players/${id}`}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium text-center hover:bg-emerald-700 transition-colors"
          >
            View Profile
          </Link>
          {onCompare && (
            <button
              onClick={() => onCompare(player)}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
            >
              Compare
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-slate-500 text-xs">{label}</p>
    <p className="text-white text-sm font-medium truncate">{value}</p>
  </div>
)

export default PlayerCard
