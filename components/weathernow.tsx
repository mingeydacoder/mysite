'use client'
import { useEffect, useState } from 'react'

type WeatherState = {
  tempF: number
  description: string
  highF?: number
  lowF?: number
  raw?: any
}

export default function WeatherNow({ location = 'Columbia, SC' }: { location?: string }) {
  const [weather, setWeather] = useState<WeatherState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loc = encodeURIComponent(location)
    // wttr.in simple JSON endpoint: `https://wttr.in/<loc>?format=j1`
    fetch(`https://wttr.in/${loc}?format=j1`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return
        // wttr.in structure: current_condition[0].temp_F, weather[0].maxtempF/min...
        const curr = data.current_condition?.[0]
        const today = data.weather?.[0]
        setWeather({
          tempF: parseInt(curr?.temp_F ?? '0', 10),
          description: curr?.weatherDesc?.[0]?.value ?? '',
          highF: today?.maxtempF ? parseInt(today.maxtempF, 10) : undefined,
          lowF: today?.mintempF ? parseInt(today.mintempF, 10) : undefined,
          raw: data,
        })
      })
      .catch(err => {
        console.error('weather fetch error', err)
      })
      .finally(() => isMounted && setLoading(false))
    return () => { isMounted = false }
  }, [location])

  if (loading) {
    return (
      <div className="w-36 ml-4 flex-shrink-0">
        <div className="card p-3 text-center">
          <div className="text-sm text-muted">Loading…</div>
        </div>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="w-36 ml-4 flex-shrink-0">
        <div className="card p-3 text-center">
          <div className="text-sm text-muted">No data</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-45 ml-4 flex-shrink-0 ">
      <div className="card p-3 text-center ">
        <div className="text-xs text-muted">
  Now · <span className="text-xs text-muted">Columbia, SC</span>
</div>
        <div className="text-3xl font-semibold mt-1">{weather.tempF}°F</div>
        <div className="text-sm mt-1">{weather.description}</div>
        <div className="text-xs text-muted mt-2">
          {weather.highF ?? '—'}°F · {weather.lowF ?? '—'}°F
        </div>
      </div>
    </div>
  )
}
