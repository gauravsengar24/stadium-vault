import { createFileRoute } from '@tanstack/react-router'
import { Users, TrendingUp, Thermometer, Activity } from 'lucide-react'

export const Route = createFileRoute('/staff/crowd')({
  component: StaffCrowd,
})

const zones = [
  { zone: 'A', name: 'Main Stand', cap: 85, trend: '+12%', status: 'elevated' as const },
  { zone: 'B', name: 'East Wing', cap: 42, trend: '+3%', status: 'normal' as const },
  { zone: 'C', name: 'Food Court', cap: 68, trend: '+8%', status: 'elevated' as const },
  { zone: 'D', name: 'West Concourse', cap: 23, trend: '-2%', status: 'low' as const },
  { zone: 'E', name: 'VIP Area', cap: 15, trend: '+1%', status: 'low' as const },
  { zone: 'F', name: 'South Gate', cap: 55, trend: '+5%', status: 'normal' as const },
  { zone: 'G', name: 'North Terrace', cap: 72, trend: '+15%', status: 'elevated' as const },
  { zone: 'H', name: 'Parking', cap: 90, trend: '+20%', status: 'critical' as const },
]

function StaffCrowd() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 fade-in-up">
        <h1 className="text-2xl font-bold text-white mb-1">Crowd Monitor</h1>
        <p className="text-[#8a94a8] text-sm">Real-time zone occupancy and trends</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 fade-in-up stagger-1">
        {[
          { icon: Users, label: 'Total', value: '8,420', color: '#8b5cf6' },
          { icon: Activity, label: 'Capacity', value: '47%', color: '#58d68d' },
          { icon: TrendingUp, label: 'Peak Zone', value: 'H (90%)', color: '#ef4444' },
          { icon: Thermometer, label: 'Flow Rate', value: '1.2k/hr', color: '#06b6d4' },
        ].map(s => (
          <div key={s.label} className="glass p-3 text-center rounded-2xl">
            <s.icon className="size-4 mx-auto mb-1" style={{ color: s.color }} />
            <div className="text-lg font-bold text-white">{s.value}</div>
            <div className="text-[10px] text-[#6b7a99]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2 fade-in-up stagger-2">
        {zones.map(z => (
          <div key={z.zone} className="glass p-3 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">Zone {z.zone}</span>
                <span className="text-xs text-[#6b7a99]">{z.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8a94a8]">{z.trend}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                  z.status === 'critical' ? 'bg-red-500/20 text-red-400' :
                  z.status === 'elevated' ? 'bg-amber-500/20 text-amber-400' :
                  z.status === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {z.status}
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-[#1a2332] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${z.cap}%`,
                  background: z.cap > 75 ? '#ef4444' : z.cap > 50 ? '#f59e0b' : '#58d68d',
                }}
              />
            </div>
            <div className="text-right text-[10px] text-[#5a6a8a] mt-0.5">{z.cap}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
