import { createFileRoute } from '@tanstack/react-router'
import { Users, Thermometer, TrendingUp, Activity } from 'lucide-react'

export const Route = createFileRoute('/fan/crowd')({
  component: FanCrowd,
})

const zoneData = [
  { zone: 'A', name: 'Main Stand', capacity: 85, status: 'busy' as const },
  { zone: 'B', name: 'East Wing', capacity: 42, status: 'moderate' as const },
  { zone: 'C', name: 'Food Court', capacity: 68, status: 'busy' as const },
  { zone: 'D', name: 'West Concourse', capacity: 23, status: 'quiet' as const },
  { zone: 'E', name: 'VIP Area', capacity: 15, status: 'quiet' as const },
  { zone: 'F', name: 'South Gate', capacity: 55, status: 'moderate' as const },
  { zone: 'G', name: 'North Terrace', capacity: 72, status: 'busy' as const },
  { zone: 'H', name: 'Parking', capacity: 90, status: 'crowded' as const },
]

const statusColors: Record<string, string> = {
  quiet: '#58d68d',
  moderate: '#f59e0b',
  busy: '#f97316',
  crowded: '#ef4444',
}

function FanCrowd() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 fade-in-up">
        <h1 className="text-2xl font-bold text-white mb-1">Crowd Density</h1>
        <p className="text-[#8a94a8] text-sm">Real-time stadium occupancy by zone</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 fade-in-up stagger-1">
        {[
          { icon: Users, label: 'Total Occupancy', value: '47%', color: '#8b5cf6' },
          { icon: Activity, label: 'Current Flow', value: '1,240/hr', color: '#06b6d4' },
          { icon: TrendingUp, label: 'Peak Today', value: '68%', color: '#f59e0b' },
          { icon: Thermometer, label: 'Comfort Index', value: 'Good', color: '#58d68d' },
        ].map(stat => (
          <div key={stat.label} className="glass p-3 text-center rounded-2xl">
            <stat.icon className="size-4 mx-auto mb-1" style={{ color: stat.color }} />
            <div className="text-lg font-bold text-white">{stat.value}</div>
            <div className="text-[10px] text-[#6b7a99]">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2 fade-in-up stagger-2">
        {zoneData.map(zone => (
          <div key={zone.zone} className="glass p-3 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">Zone {zone.zone}</span>
                <span className="text-xs text-[#6b7a99]">{zone.name}</span>
              </div>
              <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded" style={{
                background: `${statusColors[zone.status]}20`,
                color: statusColors[zone.status],
              }}>
                {zone.status}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#1a2332] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${zone.capacity}%`,
                  background: zone.capacity > 75 ? '#ef4444' : zone.capacity > 50 ? '#f59e0b' : '#58d68d',
                }}
              />
            </div>
            <div className="text-right text-[10px] text-[#5a6a8a] mt-0.5">{zone.capacity}% capacity</div>
          </div>
        ))}
      </div>
    </div>
  )
}
