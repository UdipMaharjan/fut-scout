const StatsCard = ({ title, stats, compact = false }) => {
  const statItems = [
    { key: 'appearances', label: 'Apps', icon: '⚽' },
    { key: 'goals', label: 'Goals', icon: '🎯' },
    { key: 'assists', label: 'Assists', icon: '🅰️' },
    { key: 'minutes_played', label: 'Minutes', icon: '⏱️' },
    { key: 'goals_per_90', label: 'G/90', icon: '📊', format: (v) => v?.toFixed(2) || '0.00' },
    { key: 'assists_per_90', label: 'A/90', icon: '📈', format: (v) => v?.toFixed(2) || '0.00' },
    { key: 'yellow_cards', label: 'Yellow', icon: '🟨' },
    { key: 'red_cards', label: 'Red', icon: '🟥' }
  ]

  if (compact) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {statItems.slice(0, 4).map(({ key, label, icon, format }) => (
          <div key={key} className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700">
            <p className="text-xl mb-1">{icon}</p>
            <p className="text-white font-bold">
              {format ? format(stats[key]) : stats[key] || 0}
            </p>
            <p className="text-slate-500 text-xs">{label}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {title && (
        <div className="px-4 py-3 bg-slate-750 border-b border-slate-700">
          <h3 className="text-white font-semibold">{title}</h3>
        </div>
      )}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statItems.map(({ key, label, icon, format }) => (
            <div key={key} className="bg-slate-900 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{icon}</span>
                <span className="text-slate-400 text-xs">{label}</span>
              </div>
              <p className="text-white text-xl font-bold">
                {format ? format(stats[key]) : stats[key] || 0}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StatsCard
